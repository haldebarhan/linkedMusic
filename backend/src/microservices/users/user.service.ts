import { injectable } from "tsyringe";
import { UserRepository } from "./user.repository";
import { TokenService } from "../../utils/services/token.service";
import { BrevoMailService } from "../../utils/services/brevo-mail.service";
import {
  ChangePasswordDTO,
  CreateUserDTO,
  LoginDTO,
  UpdateUserDTO,
  VerifyToken,
} from "./user.dto";
import { FirebaseService } from "../../utils/services/firebase.service";
import { Prisma, Status, User } from "@prisma/client";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import createError from "http-errors";
import { ENV } from "../../config/env";
import {
  changeFirebaseUserPassword,
  createFirebaseUser,
  rollbackFirebaseUser,
} from "../../utils/functions/create-firebase-user";
import { Role } from "../../utils/enums/role.enum";
import { Order } from "../../utils/enums/order.enum";
import { invalideCache } from "../../utils/functions/invalidate-cache";
import { S3Service } from "../../utils/services/s3.service";
import { Badge } from "../../utils/enums/badge.enum";

const firebaseService = FirebaseService.getInstance();
const minioService: S3Service = S3Service.getInstance();

@injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly mailService: BrevoMailService
  ) {}

  async createUser(data: CreateUserDTO, profileImage: string) {
    const { email, password, role, pseudo } = data;
    await this.checkUserExistence(email);
    await this.checkForignUsername(pseudo);
    const token = await this.tokenService.generateAndStoreToken({
      email,
      password,
      role,
      profileImage,
      pseudo,
    });
    const link = `${ENV.FRONTEND_URL}/auth/activate-account?token=${token}&email=${email}`;
    return await this.mailService.sendActivateAccountMail({
      to: email,
      name: `${pseudo}`,
      link,
    });
  }

  async registerTempUser(data: VerifyToken) {
    const { email, token } = data;
    const decoded = await this.tokenService.verifyToken(email, token);
    if (!decoded.isValid || !decoded.tempUser) {
      throw createError(400, "invalid token");
    }
    const user = decoded.tempUser;
    const { role, password, profileImage, pseudo } = user;
    const uid = await createFirebaseUser(email, password, `${pseudo}`);
    try {
      const createData: Omit<CreateUserDTO, "password" | "pseudo"> & {
        uid: string;
        status: Status;
        profileImage: string;
        displayName: string;
      } = {
        uid,
        email,
        profileImage,
        role: (role ?? Role.USER) as Role,
        status: Status.ACTIVATED,
        displayName: pseudo,
      };
      const user = await this.userRepository.create({ ...createData });
      user.profileImage = await minioService.generatePresignedUrl(
        ENV.AWS_S3_DEFAULT_BUCKET,
        user.profileImage
      );
      const accessToken = await firebaseService.loginWithUid(user.uid);
      await invalideCache("GET:/api/admin/users*");
      const userData = { ...user };
      return { user: userData, accessToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        await rollbackFirebaseUser(uid);
        await minioService.deleteFile(ENV.AWS_S3_DEFAULT_BUCKET, profileImage);
        throw createError(409, `${target} already exists`);
      }
      await rollbackFirebaseUser(uid);
      await minioService.deleteFile(ENV.AWS_S3_DEFAULT_BUCKET, profileImage);
      throw createError(500, `Failed to create user: ${error.message}`);
    }
  }

  async findAll(params: {
    limit: number;
    page: number;
    order: Order;
    where?: any;
  }) {
    const { limit, page, order, where } = params;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userRepository.findAll({
        skip,
        take: limit,
        order: order,
        where,
      }),
      this.userRepository.count(where),
    ]);
    return {
      data,
      metadata: {
        total,
        page,
        totalPage: Math.max(Math.ceil(total / limit), 1),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne(id);
    if (!user) throw createError(404, "user not found");
    user.profileImage = await minioService.generatePresignedUrl(
      ENV.AWS_S3_DEFAULT_BUCKET,
      user.profileImage
    );
    return user;
  }

  async updateUser(id: number, data: UpdateUserDTO, profileImage?: string) {
    const user = await this.findOne(id);
    const deleteOldImagePromise = profileImage
      ? minioService.deleteFile(ENV.AWS_S3_DEFAULT_BUCKET, user.profileImage)
      : Promise.resolve();
    await this.checkPhoneOrUsernameConflicts(data.phone, data.displayName, id);
    const updateUserPromise = this.userRepository.update(user.id, {
      ...data,
      profileImage,
    });

    const [updatedUser] = await Promise.all([
      updateUserPromise,
      deleteOldImagePromise,
      invalideCache("GET:/api/admin/users*"),
    ]);
    return this.attachProfileImageUrl(updatedUser);
  }

  async assignBadge(userId: number, badge: Badge) {
    const user = await this.findOne(userId);
    await invalideCache("GET:/api/admin/users*");
    await invalideCache("GET:/api/auth/me");
    return await this.userRepository.update(user.id, { badge });
  }

  async login(
    credentials: LoginDTO,
    claims: { userAgent: string; ip: string }
  ) {
    const { email, password } = credentials;

    try {
      const user = await this.userRepository.findByParams({
        email,
        status: {
          notIn: [
            Status.DESACTIVATED,
            Status.CLOSED,
            Status.SUSPENDED,
            Status.UNVERIFIED,
            Status.REMOVED,
          ],
        },
      });

      if (!user) {
        throw createError(401, "Invalid credentials");
      }

      const { userCredential } =
        await firebaseService.LoginUserWithEmailAndPassword(email, password);

      if (!userCredential?.user) {
        throw createError(401, "Invalid credentials");
      }

      await firebaseService.setCustomUserClaims(user.uid, claims);

      const accessToken = await userCredential.user.getIdToken(true);

      const provider =
        userCredential.user.reloadUserInfo.providerUserInfo[0].providerId;
      user.profileImage = user.profileImage
        ? await minioService.generatePresignedUrl(
            ENV.AWS_S3_DEFAULT_BUCKET,
            user.profileImage
          )
        : "";

      return { accessToken, user: { ...user, provider } };
    } catch (error: any) {
      const fbCode = error?.code as string | undefined;
      if (
        fbCode === "auth/user-not-found" ||
        fbCode === "auth/wrong-password" ||
        fbCode === "auth/invalid-credential" ||
        fbCode === "auth/invalid-password" ||
        fbCode === "auth/invalid-email"
      ) {
        throw createError(401, "Invalid credentials");
      }

      if (error?.status) {
        throw error;
      }

      throw createError(500, "Login failed");
    }
  }

  async loginWithGoogle(user: any, claims: { userAgent: string; ip: string }) {
    const authUser = await this.userRepository.findByParams({
      email: user.email,
      status: {
        notIn: [
          Status.DESACTIVATED,
          Status.CLOSED,
          Status.SUSPENDED,
          Status.UNVERIFIED,
          Status.REMOVED,
        ],
      },
    });
    if (!authUser) throw createError(404, "user not found");

    await firebaseService.setCustomUserClaims(user.uid, claims);
    authUser.profileImage = user.picture
      ? user.picture
      : await minioService.generatePresignedUrl(
          ENV.AWS_S3_DEFAULT_BUCKET,
          authUser.profileImage
        );
    return authUser;
  }

  async registerWithGoogle(
    user: any,
    claims: { userAgent: string; ip: string }
  ) {
    try {
      const exists = await this.userRepository.findByParams({
        email: user.email,
      });
      await firebaseService.setCustomUserClaims(user.uid, claims);
      const createData: Omit<CreateUserDTO, "password" | "pseudo"> & {
        uid: string;
        status: Status;
        profileImage: string;
        displayName: string;
      } = {
        uid: user.uid,
        email: user.email,
        profileImage: user.picture,
        role: Role.USER as Role,
        status: Status.ACTIVATED,
        displayName: user.name,
      };
      if (exists) throw createError(409, "User with email already exist");
      const createdUser = await this.userRepository.create({ ...createData });
      invalideCache("GET:/api/admin/users*");
      return createdUser;
    } catch (error) {
      throw createError(500, `Failed to create user: ${error.message}`);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByParams({ email });
    if (!user) throw createError(404, "User not found");

    const token = this.tokenService.generateResetPasswordToken(
      user.id,
      user.email
    );
    const link = `${ENV.FRONTEND_URL}/auth/reset-password?token=${token}`;

    await this.mailService.sendResetPasswordMail({
      to: user.email,
      link,
      name: `${user.firstName} ${user.lastName}`,
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const decoded = this.tokenService.verifyResetPasswordToken(token);
    if (!decoded) throw createError(400, "Invalid or expired token");

    const user = await this.userRepository.findByParams({
      email: decoded.email,
    });
    if (!user) throw createError(404, "User not found");

    const [,] = await Promise.all([
      changeFirebaseUserPassword(user.uid, newPassword),
      this.mailService.sendChangePasswordConfMail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
      }),
    ]);

    return { message: "Password reset successfully" };
  }

  async changePassword(user: any, data: ChangePasswordDTO) {
    const { password } = data;
    return await changeFirebaseUserPassword(user.uid, password);
  }

  async logout() {
    await firebaseService.logout();
  }

  async closeAccount(userId: number, comment: string) {
    const user = await this.userRepository.findOne(userId);
    if (!user) throw createError(404, "User not found");
    await invalideCache("GET:/api/admin/users*");
    await this.userRepository.closeAccount(user.id, comment);
  }

  async activateAccount(userId: number) {
    const user = await this.userRepository.findOne(userId);
    if (!user) throw createError(404, "User not found");
    await invalideCache("GET:/api/admin/users*");
    await this.userRepository.activateAccount(user.id);
  }

  private async attachProfileImageUrl(user: User): Promise<User> {
    if (!user.profileImage) return user;

    const profileImageUrl = await minioService.generatePresignedUrl(
      ENV.AWS_S3_DEFAULT_BUCKET,
      user.profileImage
    );

    return { ...user, profileImage: profileImageUrl };
  }

  private validateUserNotExists(
    fbUser: UserRecord | undefined,
    dbUserWithEmail: User | null
  ): void {
    if (!fbUser && !dbUserWithEmail) return;

    const conflicts: string[] = [];
    if (fbUser || dbUserWithEmail) conflicts.push("email");

    throw createError(
      409,
      `Ces données sont deja utilisées: ${conflicts.join(" et ")}`
    );
  }

  private async checkUserExistence(email: string): Promise<void> {
    const [firebaseUser, userWithEmail] = await Promise.all([
      firebaseService.findUserByEmail(email),
      this.userRepository.findByParams({ email }),
    ]);

    this.validateUserNotExists(firebaseUser?.user, userWithEmail);
  }

  private async checkForignUsername(pseudo: string) {
    const forbiddenList = [
      "administrateur",
      "administrator",
      "superadmin",
      "superadministrateur",
      "infos",
      "contact",
      "contacts",
      "mail",
      "mails",
      "admin",
      "root",
      "support",
      "help",
      "aide",
      "moderator",
      "moderateur",
      "staff",
      "system",
      "systeme",
      "adminxxxx",
    ];
    const normalizedPseudo = pseudo.toLowerCase().trim();
    if (forbiddenList.includes(normalizedPseudo)) {
      throw createError(400, "Ce nom d'utilisateur n'est pas autorisé");
    }

    if (normalizedPseudo.startsWith("zik")) {
      throw createError(400, "Ce nom d'utilisateur n'est pas autorisé");
    }
  }

  private async checkPhoneOrUsernameConflicts(
    phone: string,
    displayName: string,
    userId: number
  ): Promise<void> {
    if (!phone && !displayName) return;

    const [userWithPhone, userWithUsername] = await Promise.all([
      phone ? this.userRepository.findByPhone(phone, userId) : null,
      displayName
        ? this.userRepository.findByDisplayName(displayName, userId)
        : null,
    ]);

    if (!userWithPhone && !userWithUsername) return;

    const conflicts: string[] = [];
    if (userWithPhone) conflicts.push("Phone number");
    if (userWithUsername) conflicts.push("Username");

    throw createError(409, `Already in use: ${conflicts.join(" and ")}`);
  }
}
