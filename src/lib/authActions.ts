'use server';

import { query } from './db';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { sendResetEmail } from './email';


export async function verifyEmailAction(email: string, expectedType: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await query('SELECT status FROM "Login" WHERE email = $1 AND type = $2', [trimmedEmail, expectedType]);
    if (res.rows.length > 0) {
      const status = res.rows[0].status;
      return { exists: true, active: status === 'active' };
    }
    return { exists: false };
  } catch (error: any) {
    console.error('Failed to verify email:', error);
    return { exists: false, error: error.message };
  }
}

export async function loginAction(email: string, passwordIn: string, expectedType: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await query('SELECT name, type, password, status FROM "Login" WHERE email = $1 AND type = $2', [trimmedEmail, expectedType]);
    if (res.rows.length === 0) {
      return { success: false, error: 'User does not exist for this account type.' };
    }
    
    const { name, type, password: storedPassword, status } = res.rows[0];
    
    if (status !== 'active') {
      return { success: false, error: 'User account is not active.' };
    }
    
    // Verify password hash
    const parts = storedPassword.split(':');
    if (parts.length !== 2) {
      return { success: false, error: 'Invalid password format in database.' };
    }
    
    const salt = parts[0];
    const storedHash = parts[1];
    const hash = crypto.scryptSync(passwordIn, salt, 64).toString('hex');
    
    if (hash !== storedHash) {
      return { success: false, error: 'Incorrect password.' };
    }
    
    // Set cookies server-side using next/headers
    const cookieStore = await cookies();
    cookieStore.set('userName', name, { path: '/', maxAge: 86400 });
    cookieStore.set('userType', type, { path: '/', maxAge: 86400 });
    cookieStore.set('userEmail', trimmedEmail, { path: '/', maxAge: 86400 });

    return { success: true, name, type };
  } catch (error: any) {
    console.error('Login action error:', error);
    return { success: false, error: error.message };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('userName');
    cookieStore.delete('userType');
    cookieStore.delete('userEmail');
    return { success: true };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

export async function registerAction(email: string, name: string, type: string, passwordIn: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if email and type already exists
    const existRes = await query('SELECT email FROM "Login" WHERE email = $1 AND type = $2', [trimmedEmail, type]);
    if (existRes.rows.length > 0) {
      return { success: false, error: 'Email is already registered for this account type.' };
    }
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(passwordIn, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    await query(
      `INSERT INTO "Login" (email, name, type, password, status)
       VALUES ($1, $2, $3, $4, 'active')`,
      [trimmedEmail, name.trim(), type, hashedPassword]
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Registration failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendResetCodeAction(email: string, expectedType: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Check if the user exists and is active
    const userRes = await query('SELECT status FROM "Login" WHERE email = $1 AND type = $2', [trimmedEmail, expectedType]);
    if (userRes.rows.length === 0) {
      return { success: false, error: 'Email is not registered for this account type.' };
    }
    if (userRes.rows[0].status !== 'active') {
      return { success: false, error: 'Account is not active.' };
    }
    
    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration is 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Save to the database
    await query(
      'UPDATE "Login" SET reset_code = $1, reset_expires_at = $2 WHERE email = $3 AND type = $4',
      [code, expiresAt, trimmedEmail, expectedType]
    );
    
    // Send email (real or simulated)
    const emailSent = await sendResetEmail(trimmedEmail, code);
    if (!emailSent) {
      return { success: false, error: 'Failed to send reset email.' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send reset code:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyAndResetPasswordAction(email: string, expectedType: string, code: string, passwordIn: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();
    
    // Get the user record
    const userRes = await query(
      'SELECT password, reset_code, reset_expires_at FROM "Login" WHERE email = $1 AND type = $2',
      [trimmedEmail, expectedType]
    );
    
    if (userRes.rows.length === 0) {
      return { success: false, error: 'Email is not registered for this account type.' };
    }
    
    const { password: currentHashedPassword, reset_code: storedCode, reset_expires_at: expiresAt } = userRes.rows[0];
    
    if (!storedCode || !expiresAt) {
      return { success: false, error: 'No password reset has been requested for this email.' };
    }
    
    // Verify code
    if (storedCode !== trimmedCode) {
      return { success: false, error: 'Invalid identification code.' };
    }
    
    // Verify expiration (expiresAt is stored in DB, PG client returns a JS Date object)
    if (new Date() > new Date(expiresAt)) {
      return { success: false, error: 'Identification code has expired.' };
    }
    
    // Verify that the new password is not the same as the previous password
    const parts = currentHashedPassword.split(':');
    if (parts.length === 2) {
      const salt = parts[0];
      const storedHash = parts[1];
      const hash = crypto.scryptSync(passwordIn, salt, 64).toString('hex');
      if (hash === storedHash) {
        return { success: false, error: 'New password cannot be the same as your previous password.' };
      }
    }
    
    // Hash new password with a new salt
    const newSalt = crypto.randomBytes(16).toString('hex');
    const newHash = crypto.scryptSync(passwordIn, newSalt, 64).toString('hex');
    const newHashedPassword = `${newSalt}:${newHash}`;
    
    // Save new password and clear the reset fields
    await query(
      `UPDATE "Login" 
       SET password = $1, reset_code = NULL, reset_expires_at = NULL 
       WHERE email = $2 AND type = $3`,
      [newHashedPassword, trimmedEmail, expectedType]
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset password:', error);
    return { success: false, error: error.message };
  }
}

export async function checkResetStateAction(email: string, expectedType: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await query(
      'SELECT status, reset_code FROM "Login" WHERE email = $1 AND type = $2',
      [trimmedEmail, expectedType]
    );
    if (res.rows.length === 0) {
      return { success: false, exists: false, error: 'Email is not registered for this account type.' };
    }
    
    const { status, reset_code } = res.rows[0];
    const active = status === 'active';
    
    const smtpConfigured = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    );
    
    return {
      success: true,
      exists: true,
      active,
      smtpConfigured,
      devCode: smtpConfigured ? null : reset_code
    };
  } catch (error: any) {
    console.error('Failed to check reset state:', error);
    return { success: false, error: error.message };
  }
}


