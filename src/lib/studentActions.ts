'use server';

import { query } from './db';

export async function getStudentByName(name: string) {
  try {
    const res = await query('SELECT * FROM students WHERE name = $1', [name]);
    return { success: true, data: res.rows[0] || null };
  } catch (error: any) {
    console.error('Failed to get student by name:', error);
    return { success: false, error: error.message };
  }
}

export async function getStudentByEmail(email: string) {
  try {
    const res = await query('SELECT * FROM students WHERE email = $1', [email.trim().toLowerCase()]);
    return { success: true, data: res.rows[0] || null };
  } catch (error: any) {
    console.error('Failed to get student by email:', error);
    return { success: false, error: error.message };
  }
}

export async function createStudent(name: string, email: string) {
  try {
    const res = await query('INSERT INTO students (name, email) VALUES ($1, $2) RETURNING *', [name, email.trim().toLowerCase()]);
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to create student:', error);
    return { success: false, error: error.message, code: error.code };
  }
}

export async function updateStudent(id: string, data: any) {
  try {
    const res = await query(
      `UPDATE students SET 
        email = $1, 
        address = $2, 
        college_university = $3, 
        major = $4, 
        exams = $5, 
        recommendation_letters = $6, 
        transcripts = $7 
      WHERE id = $8 RETURNING *`,
      [
        data.email,
        data.address,
        data.college_university,
        data.major,
        JSON.stringify(data.exams),
        JSON.stringify(data.recommendation_letters),
        JSON.stringify(data.transcripts),
        id
      ]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to update student:', error);
    return { success: false, error: error.message };
  }
}

export async function getApplications(studentId: string) {
  try {
    const res = await query('SELECT * FROM applications WHERE student_id = $1', [studentId]);
    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error('Failed to get applications:', error);
    return { success: false, error: error.message };
  }
}

export async function addApplication(studentId: string, schoolId: number) {
  try {
    const res = await query(
      `INSERT INTO applications (student_id, school_id, status) 
       VALUES ($1, $2, 'draft') 
       RETURNING *`,
      [studentId, schoolId]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to add application:', error);
    return { success: false, error: error.message };
  }
}

export async function removeApplication(studentId: string, schoolId: number) {
  try {
    await query('DELETE FROM applications WHERE student_id = $1 AND school_id = $2', [studentId, schoolId]);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to remove application:', error);
    return { success: false, error: error.message };
  }
}

export async function updateApplicationAction(studentId: string, schoolId: number, updates: any) {
  try {
    const res = await query(
      `UPDATE applications SET 
        include_gre = $1, 
        include_gmat = $2, 
        selected_letter_paths = $3, 
        selected_transcript_paths = $4,
        updated_at = NOW()
      WHERE student_id = $5 AND school_id = $6 
      RETURNING *`,
      [
        updates.include_gre,
        updates.include_gmat,
        JSON.stringify(updates.selected_letter_paths),
        JSON.stringify(updates.selected_transcript_paths),
        studentId,
        schoolId
      ]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to update application:', error);
    return { success: false, error: error.message };
  }
}

export async function getSchoolQuestions(schoolId: number) {
  try {
    const res = await query('SELECT * FROM school_questions WHERE school_id = $1 ORDER BY sort_order ASC', [schoolId]);
    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error('Failed to get school questions:', error);
    return { success: false, error: error.message };
  }
}

export async function getApplicationAnswers(applicationId: number) {
  try {
    const res = await query('SELECT * FROM application_answers WHERE application_id = $1', [applicationId]);
    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error('Failed to get application answers:', error);
    return { success: false, error: error.message };
  }
}

export async function saveApplicationAnswers(answers: { application_id: number; question_id: number; answer: string }[]) {
  try {
    for (const ans of answers) {
      await query(
        `INSERT INTO application_answers (application_id, question_id, answer, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (application_id, question_id) 
         DO UPDATE SET answer = EXCLUDED.answer, updated_at = NOW()`,
        [ans.application_id, ans.question_id, ans.answer]
      );
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save answers:', error);
    return { success: false, error: error.message };
  }
}

// Landing page application submission
export async function submitLandingApplication(formData: any) {
  try {
    const res = await query(
      `INSERT INTO applications (full_name, email, phone, program, file_url, status) 
       VALUES ($1, $2, $3, $4, $5, 'submitted') 
       RETURNING *`,
      [
        formData.fullName,
        formData.email,
        formData.phone,
        formData.program,
        formData.file_url,
      ]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to submit landing application:', error);
    return { success: false, error: error.message };
  }
}
