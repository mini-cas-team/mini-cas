const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Run: node --env-file=.env.local create-recommendation-letters.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const s3Config = {
  region: process.env.NEXT_AWS_REGION || process.env.AWS_REGION || 'us-east-1',
};

if (process.env.NEXT_AWS_ACCESS_KEY_ID && process.env.NEXT_AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  };
}

const s3 = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mini-cas-docs-5d904b5f';

async function createLetterPdf(author, title, bodyParagraphs) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Standard Letter
  
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
  drawText('LETTER OF RECOMMENDATION', 16, true);
  y -= 10;
  
  // Date and Subject
  drawText(`Date: ${new Date().toLocaleDateString()}`);
  drawText(`Author: ${author} (${title})`, 11, true);
  drawText('Subject: Reference for Student Alice Smith');
  y -= 15;

  // Body paragraphs
  for (const para of bodyParagraphs) {
    // Basic text wrap: split paragraph into lines of max ~85 chars for simple formatting
    const words = para.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length > 85) {
        drawText(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    }
    if (currentLine) {
      drawText(currentLine.trim());
    }
    y -= 10; // Extra spacing between paragraphs
  }

  y -= 15;
  drawText('Sincerely,', 11, true);
  y -= 10;
  drawText(author, 11, true);
  drawText(title);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function run() {
  const lettersToCreate = [
    {
      author: 'Dr. John Watson',
      title: 'Professor of Computer Science, Columbia University',
      fileName: 'recommendation_watson.pdf',
      displayName: 'Academic Reference - Dr. Watson.pdf',
      paragraphs: [
        'It is my distinct pleasure to write this letter of recommendation for Alice Smith, who was a student in my Advanced Machine Learning course this past semester. She ranked in the top 3% of a highly competitive class of seventy students.',
        'Alice demonstrated an exceptional conceptual grasp of mathematical algorithms and was a leader in class discussions. Her term project on neural network optimization was published in the department review. I recommend her to your graduate program without reservation.'
      ]
    },
    {
      author: 'Dr. Elizabeth Bennett',
      title: 'Dean of Data Science, Columbia University',
      fileName: 'recommendation_bennett.pdf',
      displayName: 'Academic Reference - Dr. Bennett.pdf',
      paragraphs: [
        'I am writing to express my strongest support for Alice Smith\'s application to your institution. As her academic advisor and instructor for Probability Theory, I have observed her exceptional commitment to academic excellence.',
        'Alice is mathematically rigorous, detail-oriented, and possesses an insatiable curiosity. She is highly motivated and is exactly the caliber of student that thrives in high-stakes research environments.'
      ]
    },
    {
      author: 'Sarah Jenkins',
      title: 'Director of Engineering, Tech Solutions Inc.',
      fileName: 'recommendation_jenkins.pdf',
      displayName: 'Professional Reference - Sarah Jenkins.pdf',
      paragraphs: [
        'I am pleased to provide a professional reference for Alice Smith. Alice worked under my direct supervision as a Data Engineering Intern during the summer, where she developed large-scale data pipelines.',
        'Her technical skills in SQL, Python, and data integration are outstanding. Alice demonstrated mature problem-solving abilities and a strong work ethic. She worked seamlessly with our engineering team and would be a valuable asset to any technical program.'
      ]
    }
  ];

  try {
    // Retrieve Alice Smith's student record from RDS
    console.log('Fetching Alice Smith record from PostgreSQL RDS...');
    const selectRes = await pool.query('SELECT * FROM students WHERE name = $1', ['Alice Smith']);
    
    if (selectRes.rows.length === 0) {
      console.error('❌ Error: Could not find student "Alice Smith" in database.');
      process.exit(1);
    }
    
    const student = selectRes.rows[0];
    const recommendationLetters = student.recommendation_letters || [];
    const newLettersList = [...recommendationLetters];

    for (const letter of lettersToCreate) {
      // 1. Generate the PDF buffer
      const pdfBuffer = await createLetterPdf(letter.author, letter.title, letter.paragraphs);
      const uniqueFileName = `${student.id}_${Date.now()}_${letter.fileName}`;
      const fileKey = `recommendationLetter/${uniqueFileName}`;

      // 2. Upload the PDF buffer to S3
      console.log(`Uploading letter by ${letter.author} to S3 at key "${fileKey}"...`);
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: pdfBuffer,
        ContentType: 'application/pdf'
      });
      await s3.send(uploadCommand);
      console.log('✅ Letter uploaded successfully to S3!');

      // 3. Create recommendation letter metadata item
      const newLetterItem = {
        name: letter.displayName,
        path: fileKey,
        size: (pdfBuffer.length / 1024 / 1024).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString()
      };
      
      newLettersList.push(newLetterItem);
    }

    // 4. Update the student record in RDS
    console.log('Updating student recommendation letters in PostgreSQL RDS...');
    await pool.query(
      'UPDATE students SET recommendation_letters = $1 WHERE id = $2',
      [JSON.stringify(newLettersList), student.id]
    );

    console.log('✅ Alice Smith student record updated with three new recommendation letters!');
  } catch (err) {
    console.error('❌ Script failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
