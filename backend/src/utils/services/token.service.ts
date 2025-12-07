import { injectable } from "tsyringe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { Role } from "../enums/role.enum";
import { CreateUserDTO } from "../../microservices/users/user.dto";
import logger from "../../config/logger";

interface RegisterToken {
  hashEmail: string;
  pseudo: string;
  password: string;
  profileImage: string;
  role: Role;
}

interface TempUser {
  pseudo: string;
  password: string;
  profileImage: string;
  role: Role;
}

@injectable()
export class TokenService {
  async generateAndStoreToken(
    data: CreateUserDTO & { profileImage: string }
  ): Promise<string> {
    const { email, password, pseudo, role, profileImage } = data;
    const hashEmail = await bcrypt.hash(email, 10);
    const payload: RegisterToken = {
      hashEmail,
      password,
      pseudo,
      role,
      profileImage,
    };
    return jwt.sign(payload, ENV.TOKEN_SECRET, { expiresIn: "5m" });
  }

  async verifyToken(
    email: string,
    token: string
  ): Promise<{ isValid: boolean; tempUser?: TempUser }> {
    try {
      const decoded = jwt.verify(token, ENV.TOKEN_SECRET) as RegisterToken;
      const { hashEmail, password, pseudo, role, profileImage } = decoded;
      const isMatch = await bcrypt.compare(email, hashEmail);
      if (!isMatch) return { isValid: false };
      const user: TempUser = {
        password,
        role,
        profileImage,
        pseudo,
      };
      return { isValid: true, tempUser: user };
    } catch (error) {
      logger.error("Error verifying token: ", error);
      return { isValid: false };
    }
  }

  generateSecretToken = (id: number, email: string): string => {
    return jwt.sign({ id, email }, ENV.TOKEN_SECRET);
  };

  generateResetPasswordToken = (
    id: number,
    email: string,
    time: number = 20
  ) => {
    return jwt.sign({ id, email }, ENV.TOKEN_SECRET, {
      expiresIn: time * 60,
    });
  };

  verifyResetPasswordToken = (
    token: string
  ): { id: string; email: string } | null => {
    try {
      return jwt.verify(token, ENV.TOKEN_SECRET) as {
        id: string;
        email: string;
      };
    } catch (error) {
      return null;
    }
  };
}
