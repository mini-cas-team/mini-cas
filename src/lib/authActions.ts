'use server';

import { query } from './db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function verifyEmailAction(email: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await query('SELECT status FROM "Login" WHERE email = $1', [trimmedEmail]);
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

export async function loginAction(email: string, passwordIn: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase();
    const res = await query('SELECT name, type, password, status FROM "Login" WHERE email = $1', [trimmedEmail]);
    if (res.rows.length === 0) {
      return { success: false, error: 'User does not exist.' };
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
    
    // Check if email already exists
    const existRes = await query('SELECT email FROM "Login" WHERE email = $1', [trimmedEmail]);
    if (existRes.rows.length > 0) {
      return { success: false, error: 'Email is already registered.' };
    }
    
    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(passwordIn, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    await query(
      `INSERT INTO "Login" (email, name, type, password, status)
       VALUES ($1, $2, $3, $4, \'active\')`,
      [trimmedEmail, name.trim(), type, hashedPassword]
    );
    
    return { success: true };
  } catch (error: any) {
    console.error('Registration failed:', error);
    return { success: false, error: error.message };
  }
}
