import type { NextFunction, Request, Response } from "express";

import { adminAuth, hasFirebaseServiceAccount } from "../lib/firebase-admin";
import { prisma } from "../lib/prisma";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  // 1. Check Authorization header
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Bearer token is missing",
    });
    return;
  }

  const token = header.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Bearer token is empty",
    });
    return;
  }

  // 2. Verify Firebase ID token
  let decoded;

  try {
    decoded = await adminAuth.verifyIdToken(token, hasFirebaseServiceAccount);
  } catch (error) {
    console.error("Firebase verification failed:", error);

    res.status(401).json({
      success: false,
      message: "Invalid, expired, or revoked Firebase token",
    });
    return;
  }

  // 3. Find authenticated user in PostgreSQL
  try {
    const user = await prisma.user.findUnique({
      where: {
        firebaseUid: decoded.uid,
      },
    });

    if (!user) {
      res.status(403).json({
        success: false,
        message: "User is not registered in PostgreSQL",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
      return;
    }

    // 4. Store authenticated user for controllers
    res.locals.user = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Database authentication error:", error);

    res.status(500).json({
      success: false,
      message: "Authentication service unavailable",
    });
  }
}
