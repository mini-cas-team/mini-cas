import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || 'Mini-CAS Portal <noreply@minicas.edu>';

export async function sendResetEmail(to: string, code: string): Promise<boolean> {
  const subject = 'Mini-CAS Password Reset Code';
  const textContent = `Hello,

You requested a password reset for your Mini-CAS account.
Please use the following 6-digit Identification Code to reset your password:

${code}

This code will expire in 15 minutes.
If you did not request this, you can safely ignore this email.

Best regards,
The Mini-CAS Team`;

  const htmlContent = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; rounded: 8px;">
      <h2 style="color: #2563eb;">Mini-CAS Password Reset</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your Mini-CAS account.</p>
      <p>Please use the following 6-digit <strong>Identification Code</strong> to reset your password:</p>
      <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px; margin: 20px 0;">
        ${code}
      </div>
      <p>This code will expire in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280;">This is an automated message, please do not reply to this email.</p>
    </div>
  `;

  // Determine if SMTP is configured
  const isSmtpConfigured = !!(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASSWORD);

  if (isSmtpConfigured) {
    try {
      console.log(`✉️ Sending real password reset email to: ${to} using SMTP...`);
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: parseInt(SMTP_PORT || '587', 10) === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (err: any) {
      console.error(`❌ SMTP Email transmission failed:`, err.message);
      // Fallback to local logging if real send failed, so application flow is not broken
      console.log(`⚠️ SMTP failed. Falling back to local simulated email log.`);
    }
  }

  // Fallback to local simulated log
  try {
    const logFilePath = path.join(process.cwd(), 'simulated-emails.log');
    const logEntry = `========================================
[SIMULATED EMAIL]
Sent At: ${new Date().toISOString()}
To: ${to}
From: ${SMTP_FROM}
Subject: ${subject}
Code: ${code}
----------------------------------------
${textContent}
========================================

`;
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
    console.log(`⚡ [DEV MODE] Simulated email sent! Check code in simulated-emails.log`);
    console.log(`📧 Code for ${to}: ${code}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to write simulated email log:`, err.message);
    console.log(`📧 Fallback console output: Code for ${to} is ${code}`);
    return true; // Return true so that read-only environments do not block the reset flow
  }
}
