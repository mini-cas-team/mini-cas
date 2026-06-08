const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Run: node --env-file=.env.local create-transcript.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const s3Config = {
  region: process.env.MINI_CAS_AWS_REGION || process.env.AWS_REGION || 'us-east-1',
};

if (process.env.MINI_CAS_AWS_ACCESS_KEY_ID && process.env.MINI_CAS_AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.MINI_CAS_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MINI_CAS_AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mini-cas-docs-5d904b5f';

async function generateTranscriptPdf() {
  console.log('Generating PDF transcript using pdf-lib...');
  const pdfDoc = await PDFDocument.create();
  
  // Standard Letter page size (612 x 792)
  const page = pdfDoc.addPage([612, 792]);
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let y = 730;
  const drawText = (text, size = 11, isBold = false) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0.1, 0.1, 0.1)
    });
    y -= (size + 12);
  };

  // Header Title
  drawText('OFFICIAL ACADEMIC TRANSCRIPT', 20, true);
  y -= 10;
  
  // Student Details
  drawText('Student Profile Details:', 14, true);
  drawText('Name: Alice Smith');
  drawText('Institution: Columbia University');
  drawText('Major: Data Science');
  y -= 15;

  // Header for courses
  drawText('Course Code & Description               Grade       Class GPA', 12, true);
  drawText('-----------------------------------------------------------------------------------------', 10);
  
  // Course rows
  drawText('COMS 4771: Machine Learning             A           4.00');
  drawText('CSOR 4246: Algorithms for Data Science  A-          3.67');
  drawText('STAT 4203: Probability Theory           A           4.00');
  drawText('COMS 4111: Database Systems             B+          3.33');
  drawText('-----------------------------------------------------------------------------------------', 10);
  y -= 10;

  // Cumulative GPA
  drawText('Cumulative Total GPA: 3.75 / 4.00', 14, true);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function run() {
  try {
    // 1. Generate the PDF buffer
    const pdfBuffer = await generateTranscriptPdf();
    const fileName = `alice_smith_transcript_${Date.now()}.pdf`;
    const fileKey = `transcripts/${fileName}`;

    // 2. Upload the PDF buffer directly to S3
    console.log(`Uploading PDF to S3 bucket "${BUCKET_NAME}" at key "${fileKey}"...`);
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: pdfBuffer,
      ContentType: 'application/pdf'
    });
    await s3.send(uploadCommand);
    console.log('✅ PDF uploaded successfully to S3!');

    // 3. Retrieve Alice Smith's student record from RDS
    console.log('Fetching Alice Smith record from PostgreSQL RDS...');
    const selectRes = await pool.query('SELECT * FROM students WHERE name = $1', ['Alice Smith']);
    
    if (selectRes.rows.length === 0) {
      console.error('❌ Error: Could not find student "Alice Smith" in database.');
      process.exit(1);
    }
    
    const student = selectRes.rows[0];
    const transcripts = student.transcripts || [];

    // 4. Create new transcript metadata item
    const newTranscript = {
      name: 'Academic Transcript (Columbia).pdf',
      path: fileKey,
      size: (pdfBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
      date: new Date().toLocaleDateString()
    };
    
    // Append the new transcript
    const updatedTranscripts = [...transcripts, newTranscript];

    // 5. Update the student record in RDS
    console.log('Updating student transcripts in PostgreSQL RDS...');
    await pool.query(
      'UPDATE students SET transcripts = $1 WHERE id = $2',
      [JSON.stringify(updatedTranscripts), student.id]
    );

    console.log('✅ Alice Smith student record updated with new transcript metadata!');
    console.log('Transcript linked path:', fileKey);
  } catch (err) {
    console.error('❌ Script failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
