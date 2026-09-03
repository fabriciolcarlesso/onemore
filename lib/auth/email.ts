type VerificationEmail = {
  email: string;
  name: string;
  token: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character]!,
  );
}

export async function sendVerificationEmail({
  email,
  name,
  token,
}: VerificationEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!apiKey || !from || !appUrl) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }

  const verificationUrl = new URL("/verificar-email", appUrl);
  verificationUrl.searchParams.set("token", token);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Confirme seu e-mail na OneMore",
      html: `<p>Olá, ${escapeHtml(name)}.</p><p>Confirme seu e-mail para acessar a OneMore:</p><p><a href="${verificationUrl.toString()}">Confirmar meu e-mail</a></p><p>Este link expira em 1 hora.</p>`,
      text: `Olá, ${name}. Confirme seu e-mail para acessar a OneMore: ${verificationUrl.toString()} O link expira em 1 hora.`,
    }),
  });

  if (!response.ok) {
    throw new Error("EMAIL_DELIVERY_FAILED");
  }
}
