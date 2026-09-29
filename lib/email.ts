import { env } from 'cloudflare:workers';

export type EmailLanguage = 'en' | 'fr' | 'es' | 'pt';

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  JFCARS_FROM_EMAIL?: string;
  JFCARS_PUBLIC_URL?: string;
};

type SendVerificationInput = {
  to: string;
  name: string;
  token: string;
  language: EmailLanguage;
};

const copy = {
  en: {
    subject: 'Verify your JFcars email',
    heading: 'Verify your email',
    greeting: (name: string) => `Hello ${name},`,
    body: 'Confirm this email address before signing in to your JFcars account.',
    action: 'Verify email',
    expiry: 'This secure link expires in 60 minutes. If you did not create this account, you can ignore this message.',
  },
  fr: {
    subject: 'Vérifiez votre adresse e-mail JFcars',
    heading: 'Vérifiez votre adresse e-mail',
    greeting: (name: string) => `Bonjour ${name},`,
    body: 'Confirmez cette adresse e-mail avant de vous connecter à votre compte JFcars.',
    action: 'Vérifier mon e-mail',
    expiry: 'Ce lien sécurisé expire dans 60 minutes. Si vous n’avez pas créé ce compte, ignorez ce message.',
  },
  es: {
    subject: 'Verifica tu correo de JFcars',
    heading: 'Verifica tu correo electrónico',
    greeting: (name: string) => `Hola ${name},`,
    body: 'Confirma esta dirección antes de iniciar sesión en tu cuenta de JFcars.',
    action: 'Verificar correo',
    expiry: 'Este enlace seguro caduca en 60 minutos. Si no creaste esta cuenta, puedes ignorar el mensaje.',
  },
  pt: {
    subject: 'Verifique o seu e-mail JFcars',
    heading: 'Verifique o seu e-mail',
    greeting: (name: string) => `Olá ${name},`,
    body: 'Confirme este endereço antes de iniciar sessão na sua conta JFcars.',
    action: 'Verificar e-mail',
    expiry: 'Este link seguro expira em 60 minutos. Se não criou esta conta, pode ignorar a mensagem.',
  },
} satisfies Record<EmailLanguage, object>;

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] || character,
  );
}

export function publicSiteUrl(environment = env as EmailEnvironment) {
  const fallback = 'https://jfcars.4rbl.com';
  try {
    const url = new URL(environment.JFCARS_PUBLIC_URL || fallback);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
      return fallback;
    return url.origin;
  } catch {
    return fallback;
  }
}

export function verificationEmailContent(
  input: SendVerificationInput,
  environment: EmailEnvironment = env as EmailEnvironment,
) {
  const language = copy[input.language] ? input.language : 'en';
  const text = copy[language];
  const verificationUrl = new URL('/api/auth/verify', publicSiteUrl(environment));
  verificationUrl.searchParams.set('token', input.token);
  verificationUrl.searchParams.set('lang', language);
  const verificationHref = verificationUrl.toString();
  const safeUrl = escapeHtml(verificationHref);
  return {
    subject: text.subject,
    verificationUrl: verificationHref,
    text: `${text.greeting(input.name)}\n\n${text.body}\n\n${verificationHref}\n\n${text.expiry}`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f2e8;color:#143d35;font-family:Arial,sans-serif"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="font-size:25px;font-weight:800"><span style="color:#e45b2c">JF</span>cars<span style="color:#e3b632">.</span></p><div style="background:#fff;border:1px solid #dce4df;border-radius:16px;padding:32px"><h1 style="font-family:Georgia,serif;font-size:32px">${escapeHtml(text.heading)}</h1><p>${escapeHtml(text.greeting(input.name))}</p><p style="line-height:1.6">${escapeHtml(text.body)}</p><p style="margin:28px 0"><a href="${safeUrl}" style="background:#1e7356;color:#fff;text-decoration:none;padding:14px 22px;border-radius:9px;font-weight:700">${escapeHtml(text.action)}</a></p><p style="color:#64756f;font-size:13px;line-height:1.5">${escapeHtml(text.expiry)}</p></div></div></body></html>`,
  };
}

export async function sendVerificationEmail(
  input: SendVerificationInput,
  fetcher: typeof fetch = fetch,
  environment: EmailEnvironment = env as EmailEnvironment,
) {
  const apiKey = environment.RESEND_API_KEY?.trim();
  const from = environment.JFCARS_FROM_EMAIL?.trim();
  if (!apiKey || !from)
    throw new Error('Email delivery is not configured on this server.');
  const content = verificationEmailContent(input, environment);
  const response = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`Email delivery failed (${response.status}): ${detail}`);
  }
}
