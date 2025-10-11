import { injectable } from "tsyringe";
import { UserRepository } from "./user.repository";
import { TokenService } from "@/utils/services/token.service";
import { BrevoMailService } from "@/utils/services/brevo-mail.service";
import {
  ChangePasswordDTO,
  CreateUserDTO,
  LoginDTO,
  UpdateUserDTO,
  VerifyToken,
} from "./user.dto";
import { FirebaseService } from "@/utils/services/firebase.service";
import { Prisma, Status, User } from "@prisma/client";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import createError from "http-errors";
import { ENV } from "@/config/env";
import {
  changeFirebaseUserPassword,
  createFirebaseUser,
  rollbackFirebaseUser,
} from "@/utils/functions/create-firebase-user";
import { Role } from "@/utils/enums/role.enum";
import { Order } from "@/utils/enums/order.enum";
import { MinioService } from "@/utils/services/minio.service";
import { invalideCache } from "@/utils/functions/invalidate-cache";

const firebaseService = FirebaseService.getInstance();
const minioService: MinioService = MinioService.getInstance();

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
        ENV.MINIO_BUCKET_NAME,
        user.profileImage
      );
      const accessToken = await firebaseService.loginWithUid(user.uid);
      await invalideCache("GET:/users*");
      const userData = { ...user };
      return { user: userData, accessToken };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[])?.join(", ");
        await rollbackFirebaseUser(uid);
        await minioService.deleteFile(ENV.MINIO_BUCKET_NAME, profileImage);
        throw createError(409, `${target} already exists`);
      }
      await rollbackFirebaseUser(uid);
      await minioService.deleteFile(ENV.MINIO_BUCKET_NAME, profileImage);
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

    const dataWithImages = await Promise.all(
      data.map((user) => this.attachProfileImageUrl(user))
    );
    return {
      data: dataWithImages,
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
    return user;
  }

  async updateUser(
    id: number,
    data: UpdateUserDTO & { profileImage?: string },
    profileImage?: string
  ) {
    const user = await this.findOne(id);
    const deleteOldImagePromise = profileImage
      ? minioService.deleteFile(ENV.MINIO_BUCKET_NAME, user.profileImage)
      : Promise.resolve();
    await this.checkPhoneOrUsernameConflicts(data.phone, data.displayName, id);
    const updateUserPromise = this.userRepository.update(user.id, data);

    const [updatedUser] = await Promise.all([
      updateUserPromise,
      deleteOldImagePromise,
      invalideCache("GET:/users*"),
    ]);
    return this.attachProfileImageUrl(updatedUser);
  }

  async login(
    credentials: LoginDTO,
    claims: { userAgent: string; ip: string }
  ) {
    const { email, password } = credentials;

    try {
      const user = await this.userRepository.findByParams({ email });

      // Utilise 401 pour les identifiants invalides (ne divulgue pas l'existence de l'email)
      if (!user) {
        throw createError(401, "Invalid credentials");
      }

      const { userCredential } =
        await firebaseService.LoginUserWithEmailAndPassword(email, password);

      // Si Firebase ne renvoie pas d'utilisateur, considère comme invalid credentials
      if (!userCredential?.user) {
        throw createError(401, "Invalid credentials");
      }

      // Ajoute/Met à jour des claims "non sensibles"
      await firebaseService.setCustomUserClaims(user.uid, claims);

      // Force un token fraîchement signé
      const accessToken = await userCredential.user.getIdToken(true);

      const provider =
        userCredential.user.reloadUserInfo.providerUserInfo[0].providerId;
      user.profileImage = user.profileImage
        ? await minioService.generatePresignedUrl(
            ENV.MINIO_BUCKET_NAME,
            user.profileImage
          )
        : "";

      // Normalise le retour pour le front
      return { accessToken, user: { ...user, provider } };
    } catch (error: any) {
      // Mapping propre des erreurs Firebase -> 401
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

      // Si c'est déjà un http-error avec status défini, relance tel quel
      if (error?.status) {
        throw error;
      }

      // Sinon, 500 générique
      throw createError(500, "Login failed");
    }
  }

  async loginWithGoogle(user: any, claims: { userAgent: string; ip: string }) {
    const authUser = await this.userRepository.findByParams({
      email: user.email,
    });
    if (!authUser) throw createError(404, "user not found");

    await firebaseService.setCustomUserClaims(user.uid, claims);
    authUser.profileImage = user.picture
      ? user.picture
      : await minioService.generatePresignedUrl(
          ENV.MINIO_BUCKET_NAME,
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
    await this.userRepository.closeAccount(user.id, comment);
  }

  private async attachProfileImageUrl(user: User): Promise<User> {
    if (!user.profileImage) return user;

    const profileImageUrl = await minioService.generatePresignedUrl(
      ENV.MINIO_BUCKET_NAME,
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

    throw createError(409, `Already in use: ${conflicts.join(" and ")}`);
  }

  private async checkUserExistence(email: string): Promise<void> {
    const [firebaseUser, userWithEmail] = await Promise.all([
      firebaseService.findUserByEmail(email),
      this.userRepository.findByParams({ email }),
    ]);

    this.validateUserNotExists(firebaseUser?.user, userWithEmail);
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
