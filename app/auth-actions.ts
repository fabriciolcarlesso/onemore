"use server";

import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { createToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/crypto";
import { sendVerificationEmail } from "@/lib/auth/email";
import { createSession, deleteCurrentSession, getCurrentUser } from "@/lib/auth/session";

export type AuthFormState = {
  message: string;
};

function readField(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function readPassword(formData: FormData, field: string) {
  return String(formData.get(field) ?? "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function signUp(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = readField(formData, "name");
  const email = readField(formData, "email").toLowerCase();
  const password = readPassword(formData, "password");
  const passwordConfirmation = readPassword(formData, "passwordConfirmation");

  if (name.length < 2 || name.length > 120) {
    return { message: "Informe um nome válido." };
  }

  if (!isValidEmail(email) || email.length > 255) {
    return { message: "Informe um e-mail válido." };
  }

  if (password.length < 8 || password.length > 128) {
    return { message: "A senha deve ter entre 8 e 128 caracteres." };
  }

  if (password !== passwordConfirmation) {
    return { message: "As senhas não coincidem." };
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.APP_URL) {
    return {
      message: "O envio de confirmação ainda não está configurado.",
    };
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return { message: "Não foi possível criar a conta com esse e-mail." };
  }

  let createdUserId: string | undefined;

  try {
    const passwordHash = await hashPassword(password);
    const [createdUser] = await db
      .insert(users)
      .values({ name, email, passwordHash })
      .returning({ id: users.id });

    createdUserId = createdUser.id;

    const token = createToken();
    await db.insert(emailVerificationTokens).values({
      userId: createdUser.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await sendVerificationEmail({ email, name, token });
  } catch {
    if (createdUserId) {
      try {
        await db.delete(users).where(eq(users.id, createdUserId));
      } catch {
        // Mantém a falha original de entrega como resposta do formulário.
      }
    }

    return { message: "Não foi possível enviar o e-mail de confirmação." };
  }

  redirect("/cadastro/sucesso");
}

export async function signIn(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email").toLowerCase();
  const password = readPassword(formData, "password");

  if (!isValidEmail(email) || !password) {
    return { message: "E-mail ou senha inválidos." };
  }

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      emailVerifiedAt: users.emailVerifiedAt,
      active: users.active,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { message: "E-mail ou senha inválidos." };
  }

  if (!user.emailVerifiedAt) {
    return { message: "Confirme seu e-mail antes de entrar." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function verifyEmailToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return false;
  }

  const [verification] = await db
    .select({ userId: emailVerificationTokens.userId })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, hashToken(token)),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!verification) {
    return false;
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, verification.userId));

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, verification.userId));

  return true;
}

export async function signOut() {
  await deleteCurrentSession();
  redirect("/login");
}

export async function updateProfile(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };

  const name = readField(formData, "name");
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome válido." };

  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/exercicios");
  return { message: "Dados pessoais atualizados com sucesso." };
}
