import createError from "http-errors";
import { FirebaseService } from "../services/firebase.service";

const firebaseService = FirebaseService.getInstance();
export const createFirebaseUser = async (
  email: string,
  password: string,
  name: string
): Promise<string> => {
  try {
    const response = await firebaseService.createUser({
      email,
      displayName: name,
      password,
      emailVerified: false,
      disabled: false,
    });
    if (!response?.success || !response?.user) {
      throw createError(409, "User with that email already exists.");
    }
    return response.user.uid;
  } catch (error) {
    console.error(`Failed to create Firebase user: ${error.message}`, error);
    throw createError(
      error.code || 500,
      `Failed to create Firebase user: ${error.message}`
    );
  }
};

export const rollbackFirebaseUser = async (uid: string) => {
  try {
    await firebaseService.deleteUserAccount(uid);
  } catch (error) {
    console.error(`Failed to rollback Firebase user with uid: ${uid}`, error);
    throw createError(
      error.code,
      `Failed to rollback Firebase user with uid: ${uid}`
    );
  }
};

export const changeFirebaseUserPassword = async (
  uid: string,
  password: string
) => {
  try {
    return await firebaseService.changePassword(uid, password);
  } catch (error) {
    throw createError(
      error.code,
      `Error changing Firebase user password: ${error.message}`
    );
  }
};
