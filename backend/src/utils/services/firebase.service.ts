import * as firebase from "firebase-admin";
import { UserRecord } from "firebase-admin/lib/auth/user-record";
import createError from "http-errors";
import axios from "axios";

import { initializeApp as initClientApp } from "firebase/app";
import {
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { ENV } from "../../config/env";
import logger from "../../config/logger";

const firebaseClientApp = initClientApp({
  apiKey: ENV.FIREBASE_API_KEY!,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN!,
  projectId: ENV.FIREBASE_PROJECT_ID!,
});
const firebaseAuthClient = getAuth(firebaseClientApp);
export class FirebaseService {
  private static instance: FirebaseService;
  private constructor() {
    if (firebase.app.length > 0) {
      firebase.initializeApp({
        credential: firebase.credential.cert(
          JSON.parse(ENV.FIREBASE_SERVICE_ACCOUNT)
        ),
      });
    }
  }

  async verifyIdToken(token: string): Promise<any> {
    try {
      return await firebase.auth().verifyIdToken(token);
    } catch (error) {
      throw new Error("Error verifying token: " + error.message);
    }
  }

  async users(): Promise<any> {
    try {
      return await firebase.auth().listUsers();
    } catch (error) {
      throw new Error("Error listing users: " + error.message);
    }
  }

  async signInWithCustomToken(token: string): Promise<any> {
    try {
      const userCredential = await signInWithCustomToken(
        firebaseAuthClient,
        token
      );
      const idToken = await userCredential?.user?.getIdToken();
      if (!idToken) {
        throw createError(500, "Impossible de générer l'idToken.");
      }
      return { userCredential, idToken };
    } catch (error) {
      throw new Error("Error signing in with custom token: " + error.message);
    }
  }

  async setRole(uid: string, role: string): Promise<any> {
    try {
      await firebase.auth().setCustomUserClaims(uid, { role });
      return { success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async findUserByEmail(
    email: string
  ): Promise<{ success: boolean; user?: UserRecord; error?: any }> {
    try {
      const user = await firebase.auth().getUserByEmail(email);
      return { user, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async findUserByUid(uid: string): Promise<any> {
    try {
      const user = await firebase.auth().getUser(uid);
      return { user, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async updateUser(uid: string, user: any): Promise<any> {
    try {
      return await firebase.auth().updateUser(uid, user);
    } catch (error) {
      throw new Error("Error updating user: " + error.message);
    }
  }

  async deleteUserAccount(uid: string): Promise<any> {
    try {
      const response = await firebase.auth().deleteUser(uid);
      return { success: true, response };
    } catch (error) {
      return { error, success: false };
    }
  }

  async createUser(
    data: any
  ): Promise<{ user?: UserRecord; success: boolean; error?: any }> {
    try {
      const user = await firebase.auth().createUser(data);
      return { user, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async createUserAndReturnToken(data: any): Promise<any> {
    try {
      const user = await firebase.auth().createUser(data);
      const customToken = await firebase.auth().createCustomToken(user.uid);
      return { user, customToken, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async createCustomToken(uid: string): Promise<any> {
    try {
      const customToken = await firebase.auth().createCustomToken(uid);
      return { customToken, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async disableUser(uid: string): Promise<{ success: boolean; error?: any }> {
    try {
      await firebase.auth().updateUser(uid, { disabled: true });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async enableUser(uid: string): Promise<{ success: boolean; error?: any }> {
    try {
      await firebase.auth().updateUser(uid, { disabled: false });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  async sendPushNotification(data: {
    token: string;
    title: string;
    body: string;
    opt?: any;
  }): Promise<void> {
    const { token, title, body, opt } = data;
    const message = {
      token,
      notification: { title, body },
      data: opt,
    };
    try {
      const response = await firebase.messaging().send(message);
      logger.info(`✅ Notification envoyée avec succès :`, response);
    } catch (error) {
      logger.error(
        `❌ Erreur lors de l'envoi de la notification :`,
        error.message
      );
    }
  }

  async changePassword(
    uid: string,
    password: string
  ): Promise<{ success: boolean; user?: UserRecord; error?: any }> {
    try {
      const user = await firebase.auth().updateUser(uid, { password });
      return { user, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async signInWithUid(
    uid: string
  ): Promise<{ customToken?: string; success: boolean; error?: any }> {
    try {
      const customToken = await firebase.auth().createCustomToken(uid);
      return { customToken, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async exchangeCustomTokenForIdToken(
    customToken: string
  ): Promise<{ idToken: string }> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${ENV.FIREBASE_API_KEY}`;
      const response = await axios.post(url, {
        token: customToken,
        returnSecureToken: true,
      });

      const { idToken } = response.data;
      return { idToken };
    } catch (error) {
      throw new Error("Error exchanging custom token: " + error.message);
    }
  }

  async LoginUserWithEmailAndPassword(
    email: string,
    password: string
  ): Promise<{
    userCredential?: any;
    idToken?: string;
    success: boolean;
    error?: any;
  }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuthClient,
        email,
        password
      );
      const idToken = await userCredential?.user?.getIdToken();
      if (!idToken) {
        throw createError(500, "Impossible de générer l'idToken.");
      }
      return { userCredential, idToken, success: true };
    } catch (error) {
      return { error, success: false };
    }
  }

  async loginWithUid(uid: string): Promise<string> {
    const credentials = await this.signInWithUid(uid);
    if (!credentials.success || credentials.error || !credentials.customToken)
      throw createError(500, "Login Error");

    const token = await this.exchangeCustomTokenForIdToken(
      credentials.customToken
    );
    return token.idToken;
  }

  async logout() {
    try {
      await signOut(firebaseAuthClient);
    } catch (error) {
      logger.error("Erreur lors de la déconnexion :", error);
      throw createError(500, "Erreur lors de la déconnexion :", error);
    }
  }

  async setCustomUserClaims(
    uid: string,
    claims: { userAgent: string; ip: string }
  ) {
    await firebase.auth().setCustomUserClaims(uid, claims);
  }
}
