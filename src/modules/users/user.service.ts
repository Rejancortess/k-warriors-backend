import { Role } from "@prisma/client";
import { adminAuth } from "../../lib/firebase-admin";
import { prisma } from "../../lib/prisma";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
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
          id: true,
          firebaseUid: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
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
};
