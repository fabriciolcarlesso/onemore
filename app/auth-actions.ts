"use server";

import { and, eq, gt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { emailVerificationTokens, sessions, studentPlans, users } from "@/db/schema";
import { createToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/crypto";
import { sendVerificationEmail } from "@/lib/auth/email";
import { createSession, deleteCurrentSession, getCurrentUser } from "@/lib/auth/session";

export type AuthFormState = {
  message: string;
};

export async function resendVerificationEmail() {
  const user = await getCurrentUser();
  if (!user) return { message: "Sua sessão expirou." };
  if (user.emailVerifiedAt) return { message: "Seu e-mail já está confirmado." };
  try {
    const [recent] = await db.select({ id: emailVerificationTokens.id }).from(emailVerificationTokens).where(and(eq(emailVerificationTokens.userId, user.id), gt(emailVerificationTokens.expiresAt, new Date(Date.now() + 59 * 60000)))).limit(1);
    if (recent) return { message: "Aguarde um minuto antes de solicitar outro link." };
    const token = createToken();
    const [created] = await db.insert(emailVerificationTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600000) }).returning({ id: emailVerificationTokens.id });
    try { await sendVerificationEmail({ name: user.name, email: user.email, token }); }
    catch { await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, created.id)); throw new Error("EMAIL_DELIVERY_FAILED"); }
    return { message: "Link de confirmação enviado. Confira sua caixa de entrada." };
  } catch { return { message: "Não foi possível enviar o link. Tente novamente mais tarde." }; }
}

export async function updatePreferredTeacher(preferredTeacher: "romeu" | "julieta") {
  const user = await getCurrentUser();
  if (!user || user.role !== "aluno") return { ok: false, message: "Entre com sua conta de aluno para escolher o assistente." };
  if (preferredTeacher !== "romeu" && preferredTeacher !== "julieta") return { ok: false, message: "Selecione um assistente válido." };
  try {
    await db.update(users).set({ preferredTeacher, updatedAt: new Date() }).where(eq(users.id, user.id));
    revalidatePath("/perfil");
    revalidatePath("/treinos", "layout");
    return { ok: true, message: "Assistente salvo com sucesso." };
  } catch {
    return { ok: false, message: "Não foi possível salvar o assistente. Tente novamente." };
  }
}

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
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    return { message: "E-mail ou senha inválidos." };
  }


  const [chosenPlan] = user.role === "aluno"
    ? await db.select({ studentId: studentPlans.studentId }).from(studentPlans).where(eq(studentPlans.studentId, user.id)).limit(1)
    : [];
  await createSession(user.id);
  if (user.mustChangePassword) redirect("/trocar-senha");
  redirect(user.role === "aluno" && !chosenPlan ? "/planos" : "/dashboard");
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
  const weightValue = readField(formData, "weight");
  const heightValue = readField(formData, "height");
  const weight = weightValue ? Number(weightValue.replace(",", ".")) : null;
  const height = heightValue ? Number(heightValue) : null;
  if (name.length < 2 || name.length > 120) return { message: "Informe um nome válido." };
  if (weight !== null && (!Number.isFinite(weight) || weight <= 0 || weight > 500)) return { message: "Informe um peso válido em kg." };
  if (height !== null && (!Number.isInteger(height) || height <= 0 || height > 300)) return { message: "Informe uma altura válida em cm." };

  await db.update(users).set({ name, weight: weight === null ? null : weight.toFixed(2), height, updatedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/exercicios");
  return { message: "Dados pessoais atualizados com sucesso." };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const user = await getCurrentUser({ allowTemporaryPassword: true });
  if (!user) return { message: "Sua sessão expirou. Entre novamente." };

  const currentPassword = readPassword(formData, "currentPassword");
  const newPassword = readPassword(formData, "newPassword");
  const confirmation = readPassword(formData, "passwordConfirmation");
  const [record] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);

  if (!record || !(await verifyPassword(currentPassword, record.passwordHash))) return { message: "A senha atual está incorreta." };
  if (newPassword.length < 8 || newPassword.length > 128) return { message: "A nova senha deve ter entre 8 e 128 caracteres." };
  if (newPassword !== confirmation) return { message: "As senhas não coincidem." };

  const newHash = await hashPassword(newPassword);
  await db.batch([
    db.update(users).set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() }).where(eq(users.id, user.id)),
    db.delete(sessions).where(eq(sessions.userId, user.id)),
  ]);
  await createSession(user.id);
  if (user.mustChangePassword) redirect("/dashboard");
  return { message: "Senha alterada com sucesso." };
}
