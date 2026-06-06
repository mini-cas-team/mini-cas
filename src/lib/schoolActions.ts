'use server';

import { query } from './db';

export async function getSchools() {
  try {
    const res = await query('SELECT * FROM schools ORDER BY name');
    return res.rows || [];
  } catch (e) {
    console.error("Failed to load schools from database:", e);
    return [];
  }
}

export async function getSchoolByName(name: string) {
  try {
    const res = await query('SELECT * FROM schools WHERE name = $1 LIMIT 1', [name]);
    return { success: true, data: res.rows[0] || null };
  } catch (e: any) {
    console.error("Failed to load school by name:", e);
    return { success: false, error: e.message };
  }
}

export async function getFirstSchool() {
  try {
    const res = await query('SELECT * FROM schools LIMIT 1');
    return { success: true, data: res.rows[0] || null };
  } catch (e: any) {
    console.error("Failed to load first school:", e);
    return { success: false, error: e.message };
  }
}

export async function addSchoolQuestion(schoolId: number, content: string, sortOrder: number) {
  try {
    const res = await query(
      `INSERT INTO school_questions (school_id, content, sort_order) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [schoolId, content, sortOrder]
    );
    return { success: true, data: res.rows[0] };
  } catch (e: any) {
    console.error("Failed to add question:", e);
    return { success: false, error: e.message };
  }
}

export async function deleteSchoolQuestion(id: number) {
  try {
    await query('DELETE FROM school_questions WHERE id = $1', [id]);
    return { success: true };
  } catch (e: any) {
    console.error("Failed to delete question:", e);
    return { success: false, error: e.message };
  }
}

export async function createNewSchool(name: string, location: string) {
  try {
    const idRes = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM schools');
    const nextId = parseInt(idRes.rows[0].next_id, 10);
    
    const res = await query(
      'INSERT INTO schools (id, name, location) VALUES ($1, $2, $3) RETURNING *',
      [nextId, name, location]
    );
    return { success: true, data: res.rows[0] };
  } catch (e: any) {
    console.error("Failed to create new school:", e);
    return { success: false, error: e.message };
  }
}

export async function fetchPdfAsBase64(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  } catch (error) {
    console.error("Failed to fetch PDF:", error);
    throw error;
  }
}
