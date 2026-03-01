import type { User as DomainUser } from "@prisma/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthErrorCode =
  | "UNAUTHORIZED"
  | "EMAIL_NOT_VERIFIED"
  | "FORBIDDEN_DOMAIN"
  | "PROFILE_INCOMPLETE"
  | "BANNED"
  | "NOT_ADMIN";

export class AuthError extends Error {
  readonly status: 401 | 403;
  readonly code: AuthErrorCode;

  constructor(options: { status: 401 | 403; code: AuthErrorCode; message: string }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.name = "AuthError";
  }
}

type RequireAuthResult = { authUserId: string };

async function getSupabaseUserOrThrow(): Promise<SupabaseUser> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new AuthError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  return data.user;
}

export async function requireAuth(): Promise<RequireAuthResult> {
  const user = await getSupabaseUserOrThrow();
  return { authUserId: user.id };
}

export async function requireVerified(): Promise<RequireAuthResult> {
  const user = await getSupabaseUserOrThrow();

  const email = user.email ?? "";
  if (!email.toLowerCase().endsWith("@illinois.edu")) {
    throw new AuthError({
      status: 403,
      code: "FORBIDDEN_DOMAIN",
      message: "Only @illinois.edu email addresses are allowed.",
    });
  }

  if (!user.email_confirmed_at) {
    throw new AuthError({
      status: 403,
      code: "EMAIL_NOT_VERIFIED",
      message: "Email verification required.",
    });
  }

  return { authUserId: user.id };
}

export async function requireProfileComplete(authUserId: string): Promise<DomainUser> {
  const user = await prisma.user.findUnique({
    where: { auth_user_id: authUserId },
  });

  if (!user) {
    throw new AuthError({
      status: 403,
      code: "PROFILE_INCOMPLETE",
      message: "User profile is incomplete.",
    });
  }

  const hasProfile =
    !!user.first_name && !!user.last_name && !!user.username && !!user.profile_picture_url;

  if (!hasProfile) {
    throw new AuthError({
      status: 403,
      code: "PROFILE_INCOMPLETE",
      message: "User profile is incomplete.",
    });
  }

  return user;
}

export async function requireNotBanned(authUserId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { auth_user_id: authUserId },
    select: { is_banned: true },
  });

  if (!user) {
    throw new AuthError({
      status: 403,
      code: "PROFILE_INCOMPLETE",
      message: "User profile is incomplete.",
    });
  }

  if (user.is_banned) {
    throw new AuthError({
      status: 403,
      code: "BANNED",
      message: "User is banned.",
    });
  }
}

export async function requireAdmin(authUserId: string): Promise<DomainUser> {
  const user = await prisma.user.findUnique({
    where: { auth_user_id: authUserId },
  });

  if (!user) {
    throw new AuthError({
      status: 403,
      code: "PROFILE_INCOMPLETE",
      message: "User profile is incomplete.",
    });
  }

  if (user.is_banned) {
    throw new AuthError({
      status: 403,
      code: "BANNED",
      message: "User is banned.",
    });
  }

  if (user.role !== "ADMIN") {
    throw new AuthError({
      status: 403,
      code: "NOT_ADMIN",
      message: "Admin access required.",
    });
  }

  return user;
}

