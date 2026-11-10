import { Prisma } from "@prisma/client";
import { adminAuth, hasFirebaseServiceAccount } from "../../lib/firebase-admin";
import { prisma } from "../../lib/prisma";

const userSelect = {
  id: true,
  firebaseUid: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
} as const;

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const authService = {
  async syncUser(token: string, name?: string) {
    let decoded;

    try {
      decoded = await adminAuth.verifyIdToken(token, hasFirebaseServiceAccount);
    } catch (error) {
      console.error("Firebase verification failed:", error);
      throw new AuthError("Invalid or expired Firebase token", 401);
    }

    if (!decoded.email) {
      throw new AuthError("Firebase account has no email", 400);
    }

    const displayName =
      name?.trim() ||
      (typeof decoded.name === "string" ? decoded.name.trim() : "") ||
      decoded.email.split("@")[0];

    const existingByUid = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: userSelect,
    });

    if (existingByUid) {
      if (!existingByUid.isActive) {
        throw new AuthError("User account is inactive", 403);
      }

      return existingByUid;
    }

    const existingByEmail = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: userSelect,
    });

    if (existingByEmail) {
      if (!existingByEmail.isActive) {
        throw new AuthError("User account is inactive", 403);
      }

      if (
        existingByEmail.firebaseUid &&
        existingByEmail.firebaseUid !== decoded.uid
      ) {
        throw new AuthError("Email is already linked to another account", 409);
      }

      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: { firebaseUid: decoded.uid },
        select: userSelect,
      });
    }

    try {
      return await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          name: displayName,
        },
        select: userSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new AuthError("Email is already registered", 409);
      }

      throw error;
    }
  },

  async updateName(userId: string, name: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
      select: userSelect,
    });
  },
};
