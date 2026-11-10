import { Role } from "@prisma/client";
import { adminAuth } from "../../lib/firebase-admin";
import { prisma } from "../../lib/prisma";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
} as const;

export class UserError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export const userService = {
  async createUser(data: CreateUserInput) {
    // 1. Create user in Firebase
    const firebaseUser = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.name,
    });

    try {
      // 2. Save the Firebase UID in PostgreSQL
      const user = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          name: data.name,
          email: firebaseUser.email!,
          role: data.role ?? Role.STAFF,
        },
        select: {
          firebaseUid: true,
          ...userSelect,
        },
      });

      return user;
    } catch (error) {
      // Compensation if PostgreSQL insertion fails
      try {
        await adminAuth.deleteUser(firebaseUser.uid);
      } catch (cleanupError) {
        console.error("Failed to clean up Firebase account:", cleanupError);
      }

      throw error;
    }
  },

  async listUsers() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: [{ name: "asc" }],
    });
  },

  async updateRole(id: string, role: Role, actorId: string) {
    if (id === actorId) {
      throw new UserError("You can't change your own role.", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      throw new UserError("Account not found.", 404);
    }

    if (existing.role === Role.ADMIN && role === Role.STAFF) {
      const admins = await prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });

      if (admins <= 1) {
        throw new UserError("Keep at least one administrator.", 400);
      }
    }

    return prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  },
};
