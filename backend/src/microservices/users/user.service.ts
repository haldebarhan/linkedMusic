import { injectable } from "tsyringe";
import { UserRepository } from "./user.repository";
import { TokenService } from "@/utils/services/token.service";
import { BrevoMailService } from "@/utils/services/brevo-mail.service";
import {
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
    const { email, password, firstName, lastName, role, phone } = data;
    await this.checkUserExistence(email, phone);
    const token = await this.tokenService.generateAndStoreToken({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      profileImage,
    });
    const link = `${ENV.FRONTEND_URL}/auth/activate-account?token=${token}`;
    return await this.mailService.sendActivateAccountMail({
      to: email,
      name: `${firstName} ${lastName}`,
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
    const { firstName, lastName, phone, role, password, profileImage } = user;
    const uid = await createFirebaseUser(
      email,
      password,
      `${firstName} ${lastName}`
    );
    try {
      const createData: Omit<CreateUserDTO, "password"> & {
        uid: string;
        status: Status;
        profileImage: string;
      } = {
        uid,
        email,
        firstName,
        lastName,
        phone,
        profileImage,
        role: (role ?? Role.USER) as Role,
        status: Status.ACTIVATED,
      };
      const user = await this.userRepository.create(createData);
      user.profileImage = await minioService.generatePresignedUrl(
        ENV.MINIO_BUCKET_NAME,
        user.profileImage
      );
      const access_token = await firebaseService.loginWithUid(user.uid);
      await invalideCache("GET:/users*");
      return { user, access_token };
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
    if (profileImage)
      await minioService.deleteFile(ENV.MINIO_BUCKET_NAME, user.profileImage);
    const [updatedUser] = await Promise.all([
      this.userRepository.update(user.id, { ...data, profileImage }),
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
      if (!user) {
        throw createError(404, "Login error: Email or user not found");
      }

      const { userCredential } =
        await firebaseService.LoginUserWithEmailAndPassword(email, password);

      if (!userCredential?.user) {
        throw createError(401, "Authentication failed");
      }

      await firebaseService.setCustomUserClaims(user.uid, claims);
      const freshToken = await userCredential.user.getIdToken(true);

      return { userCredential, idToken: freshToken };
    } catch (error) {
      const status = error.status || 500;
      const message = error.message || "Login failed";
      throw createError(status, `Login error: ${message}`);
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

  async changePassword(user: any, password: string) {
    await changeFirebaseUserPassword(user.uid, password);
    return { message: "Password changed successfully" };
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
    dbUserWithEmail: User | null,
    dbUserWithPhone: User | null
  ): void {
    if (!fbUser && !dbUserWithEmail && !dbUserWithPhone) return;

    const conflicts: string[] = [];
    if (fbUser || dbUserWithEmail) conflicts.push("email");
    if (dbUserWithPhone) conflicts.push("phone number");

    throw createError(409, `Already in use: ${conflicts.join(" and ")}`);
  }

  private async checkUserExistence(
    email: string,
    phone: string
  ): Promise<void> {
    const [firebaseUser, userWithEmail, userWithPhone] = await Promise.all([
      firebaseService.findUserByEmail(email),
      this.userRepository.findByParams({ email }),
      this.userRepository.findByParams({ phone }),
    ]);

    this.validateUserNotExists(
      firebaseUser?.user,
      userWithEmail,
      userWithPhone
    );
  }
}
