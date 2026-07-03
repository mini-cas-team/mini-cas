'use server';

import { query } from './db';
import { checkFileExists } from './s3';

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
    const res = await query(
      `SELECT a.*, s.name AS school_name, s.location AS school_location
       FROM applications a
       LEFT JOIN schools s ON a.school_id = s.id
       WHERE a.student_id = $1`,
      [studentId]
    );
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

export async function submitApplication(studentId: string, schoolId: number) {
  try {
    const res = await query(
      `UPDATE applications SET status = 'submitted', updated_at = NOW()
       WHERE student_id = $1 AND school_id = $2 RETURNING *`,
      [studentId, schoolId]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to submit application:', error);
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

export async function createProvider(name: string, email: string, studentId: string) {
  try {
    const res = await query(
      `INSERT INTO providers (provider, provider_email, student_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, email || null, studentId]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to create provider:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProvider(providerId: number) {
  try {
    await query('DELETE FROM providers WHERE id = $1', [providerId]);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete provider:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteProviderLettersExcluding(providerId: number, schoolsToKeep: string[]) {
  try {
    if (schoolsToKeep.length > 0) {
      await query(
        `DELETE FROM provider_letter 
         WHERE provider_id = $1 AND school != '' AND school NOT IN (${schoolsToKeep.map((_, i) => `$${i + 2}`).join(',')})`,
        [providerId, ...schoolsToKeep]
      );
    } else {
      await query(
        `DELETE FROM provider_letter WHERE provider_id = $1 AND school != ''`,
        [providerId]
      );
    }
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete provider letters:', error);
    return { success: false, error: error.message };
  }
}

export async function addProviderLetter(providerId: number, studentId: string, schoolName: string, lettersPath: string, accView = false) {
  try {
    const res = await query(
      `INSERT INTO provider_letter (provider_id, student_id, school, letters, acc_view)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider_id, student_id, school)
       DO UPDATE SET letters = EXCLUDED.letters, acc_view = EXCLUDED.acc_view
       RETURNING *`,
      [providerId, studentId, schoolName || '', lettersPath, accView]
    );
    return { success: true, data: res.rows[0] };
  } catch (error: any) {
    console.error('Failed to add provider letter:', error);
    return { success: false, error: error.message };
  }
}

export async function getProviders(studentEmail: string, schoolName?: string) {
  try {
    let res;
    if (schoolName) {
      res = await query(
        `SELECT DISTINCT p.* FROM providers p
         JOIN students s ON p.student_id = s.id
         LEFT JOIN provider_letter pl ON p.id = pl.provider_id
         WHERE s.email = $1 AND (pl.school = $2 OR pl.school = '' OR pl.school IS NULL)`,
        [studentEmail.trim().toLowerCase(), schoolName]
      );
    } else {
      res = await query(
        `SELECT p.* FROM providers p
         JOIN students s ON p.student_id = s.id
         WHERE s.email = $1`,
        [studentEmail.trim().toLowerCase()]
      );
    }
    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error('Failed to get providers:', error);
    return { success: false, error: error.message };
  }
}

export async function getProviderLetters(providerId: number, studentEmail: string) {
  try {
    const res = await query(
      `SELECT pl.* FROM provider_letter pl
       JOIN students s ON pl.student_id = s.id
       WHERE pl.provider_id = $1 AND s.email = $2`,
      [providerId, studentEmail.trim().toLowerCase()]
    );
    
    const mappedRows = [];
    for (const row of res.rows) {
      const exists = await checkFileExists(row.letters);
      mappedRows.push({ ...row, uploaded: exists });
    }
    
    return { success: true, data: mappedRows };
  } catch (error: any) {
    console.error('Failed to get provider letters:', error);
    return { success: false, error: error.message };
  }
}

export async function getProviderLettersByStudentId(providerId: number, studentId: string) {
  try {
    const res = await query(
      `SELECT * FROM provider_letter
       WHERE provider_id = $1 AND student_id = $2`,
      [providerId, studentId]
    );
    
    const mappedRows = [];
    for (const row of res.rows) {
      const exists = await checkFileExists(row.letters);
      mappedRows.push({ ...row, uploaded: exists });
    }
    
    return { success: true, data: mappedRows };
  } catch (error: any) {
    console.error('Failed to get provider letters by student ID:', error);
    return { success: false, error: error.message };
  }
}

export async function updateProviderLetterView(providerId: number, studentId: string, schoolName: string, accView: boolean) {
  try {
    await query(
      `UPDATE provider_letter 
       SET acc_view = $1 
       WHERE provider_id = $2 AND student_id = $3 AND school = $4`,
      [accView, providerId, studentId, schoolName || '']
    );
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update provider letter view:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyProviderLogin(providerName: string, studentEmail: string) {
  try {
    const res = await query(
      `SELECT p.*, s.email as student_email, s.id as student_id 
       FROM providers p
       JOIN students s ON p.student_id = s.id
       WHERE LOWER(TRIM(p.provider)) = LOWER(TRIM($1)) 
         AND LOWER(TRIM(s.email)) = LOWER(TRIM($2))`,
      [providerName, studentEmail]
    );
    if (res.rows.length === 0) {
      return { success: false, error: "Invalid provider name and/or student email" };
    }
    return { success: true, provider: res.rows[0] };
  } catch (error: any) {
    console.error("Failed to verify provider login:", error);
    return { success: false, error: error.message };
  }
}

export async function getLettersForStudentAndSchool(studentId: string, schoolName: string) {
  try {
    const res = await query(
      `SELECT pl.*, p.provider as provider_name 
       FROM provider_letter pl
       JOIN providers p ON pl.provider_id = p.id
       WHERE pl.student_id = $1 AND pl.school = $2`,
      [studentId, schoolName]
    );
    
    const mappedRows = [];
    for (const row of res.rows) {
      const exists = await checkFileExists(row.letters);
      mappedRows.push({ ...row, uploaded: exists });
    }
    
    return { success: true, data: mappedRows };
  } catch (error: any) {
    console.error('Failed to get letters for student and school:', error);
    return { success: false, error: error.message };
  }
}
