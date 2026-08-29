import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createSettingsService } from '@/services';
import { decryptSensitiveData, isEncrypted } from '@/lib/crypto';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface EmailSettings {
  email_smtp_host: string;
  email_smtp_port: string;
  email_smtp_user: string;
  email_smtp_password: string;
  email_from_address: string;
  email_from_name: string;
  email_use_tls: string;
}

const emailSettingKeys = [
  'email_smtp_host',
  'email_smtp_port',
  'email_smtp_user',
  'email_smtp_password',
  'email_from_address',
  'email_from_name',
  'email_use_tls',
];

const settingsService = createSettingsService();
const MAX_REQUEST_SIZE = 12 * 1024;

async function loadEmailSettings(): Promise<EmailSettings | null> {
  try {
    const settingsResult = await settingsService.getAllAsMap();
    if (settingsResult.isFailure()) {
      throw settingsResult.error;
    }
    const settingsMap = settingsResult.data;

    const emailSettings: Partial<EmailSettings> = {};
    for (const key of emailSettingKeys) {
      emailSettings[key as keyof EmailSettings] = settingsMap[key] || '';
    }

    if (emailSettings.email_smtp_password && isEncrypted(emailSettings.email_smtp_password)) {
      emailSettings.email_smtp_password = decryptSensitiveData(emailSettings.email_smtp_password);
    }

    return emailSettings as EmailSettings;
  } catch (error) {
    console.error('Error loading email settings:', error);
    return null;
  }
}

function validateEmailSettings(settings: EmailSettings): string | null {
  if (!settings.email_smtp_host) return 'SMTP host not configured';
  if (!settings.email_smtp_port) return 'SMTP port not configured';
  if (!settings.email_smtp_user) return 'SMTP user not configured';
  if (!settings.email_smtp_password) return 'SMTP password not configured';
  if (!settings.email_from_address) return 'From address not configured';
  const port = Number(settings.email_smtp_port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return 'Invalid SMTP port';
  return null;
}

function validateContactForm(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Invalid request body';
  const formData = data as Partial<Record<keyof ContactFormData, unknown>>;
  if (typeof formData.name !== 'string' || !formData.name.trim()) return 'Name is required';
  if (typeof formData.email !== 'string' || !formData.email.trim()) return 'Email is required';
  if (typeof formData.subject !== 'string' || !formData.subject.trim()) return 'Subject is required';
  if (typeof formData.message !== 'string' || !formData.message.trim()) return 'Message is required';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) return 'Invalid email format';

  if (formData.name.length > 100) return 'Name too long';
  if (formData.subject.length > 200) return 'Subject too long';
  if (formData.message.length > 5000) return 'Message too long';

  return null;
}

function sanitizeSingleLine(input: string): string {
  return input.replace(/[\r\n]+/g, ' ').trim();
}

function sanitizeMessage(input: string): string {
  return input.replace(/\r\n?/g, '\n').trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validationError = validateContactForm(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const formData = body as ContactFormData;
    const sanitizedData = {
      name: sanitizeSingleLine(formData.name),
      email: sanitizeSingleLine(formData.email),
      subject: sanitizeSingleLine(formData.subject),
      message: sanitizeMessage(formData.message),
    };
    const escapedData = {
      name: escapeHtml(sanitizedData.name),
      email: escapeHtml(sanitizedData.email),
      subject: escapeHtml(sanitizedData.subject),
      message: escapeHtml(sanitizedData.message),
    };

    const emailSettings = await loadEmailSettings();
    if (!emailSettings) {
      return NextResponse.json({ error: 'Email configuration not found' }, { status: 500 });
    }

    const settingsError = validateEmailSettings(emailSettings);
    if (settingsError) {
      return NextResponse.json({ error: 'Email not configured properly' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: emailSettings.email_smtp_host,
      port: Number(emailSettings.email_smtp_port),
      secure: Number(emailSettings.email_smtp_port) === 465,
      requireTLS: emailSettings.email_use_tls === 'true',
      auth: {
        user: emailSettings.email_smtp_user,
        pass: emailSettings.email_smtp_password,
      },
      tls: {
        rejectUnauthorized: true,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });

    const clientIp = escapeHtml(
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'Unknown'
    );
    const userAgent = escapeHtml(request.headers.get('user-agent') || 'Unknown');

    const mailOptions = {
      from: `${emailSettings.email_from_name} <${emailSettings.email_from_address}>`,
      to: emailSettings.email_from_address,
      replyTo: sanitizedData.email,
      subject: `Formularz kontaktowy: ${sanitizedData.subject}`,
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                        Nowa wiadomość z formularza kontaktowego
                    </h2>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 15px;">Dane nadawcy:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; background: #f9fafb; font-weight: bold; width: 120px;">Imię i nazwisko:</td>
                                <td style="padding: 8px; background: #f9fafb;">${escapedData.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold;">Email:</td>
                                <td style="padding: 8px;">${escapedData.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; background: #f9fafb; font-weight: bold;">Temat:</td>
                                <td style="padding: 8px; background: #f9fafb;">${escapedData.subject}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 15px;">Treść wiadomości:</h3>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; white-space: pre-wrap; font-family: 'Courier New', monospace;">
${escapedData.message}
                        </div>
                    </div>

                    <div style="margin-top: 30px; padding: 15px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <p style="margin: 0; color: #1e40af; font-size: 14px;">
                            <strong>Informacja:</strong> Ta wiadomość została wysłana przez formularz kontaktowy na stronie internetowej.
                            Możesz odpowiedzieć bezpośrednio na ten email, odpowiedź zostanie wysłana na adres: ${escapedData.email}
                        </p>
                    </div>

                    <div style="margin-top: 20px; padding: 10px; background: #f9fafb; border-radius: 4px; font-size: 12px; color: #6b7280;">
                        <p style="margin: 0;">Data wysłania: ${new Date().toLocaleString('pl-PL')}</p>
                        <p style="margin: 0;">IP: ${clientIp}</p>
                        <p style="margin: 0;">User-Agent: ${userAgent}</p>
                    </div>
                </div>
            `,
      text: `
Nowa wiadomość z formularza kontaktowego

Dane nadawcy:
Imię i nazwisko: ${sanitizedData.name}
Email: ${sanitizedData.email}
Temat: ${sanitizedData.subject}

Treść wiadomości:
${sanitizedData.message}

---
Data wysłania: ${new Date().toLocaleString('pl-PL')}
Ta wiadomość została wysłana przez formularz kontaktowy na stronie internetowej.
            `,
    };

    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Wiadomość została wysłana pomyślnie. Skontaktujemy się z Tobą wkrótce.',
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Error sending contact form email:', {
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    let errorMessage = 'Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.';

    if (error.code === 'EAUTH') {
      errorMessage = 'Błąd konfiguracji email. Skontaktuj się z administratorem.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Nie można nawiązać połączenia z serwerem email. Spróbuj ponownie później.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Przekroczono czas oczekiwania. Sprawdź połączenie internetowe.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Błąd konfiguracji serwera email. Skontaktuj się z administratorem.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
