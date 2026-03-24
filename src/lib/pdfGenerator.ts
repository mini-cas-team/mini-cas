'use server';

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateApplicationPdf(data: any): Promise<{ url: string, error?: string }> {
    try {
        const { school, studentData, selectedTranscripts, selectedLetters, includeGre, includeGmat } = data;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let page = pdfDoc.addPage([595, 842]);
        let y = 780;

        const drawText = (text: string, size = 12, isBold = false) => {
            page.drawText(text, { x: 50, y, size, font: isBold ? boldFont : font, color: rgb(0.1, 0.1, 0.1) });
            y -= (size + 12);
        };

        drawText(`${school.name} Application`, 22, true);
        y -= 20;

        drawText('Personal Information', 16, true);
        drawText(`Name: ${studentData.name}`);
        drawText(`Email: ${studentData.email || 'N/A'}`);
        drawText(`Address: ${studentData.address || 'N/A'}`);
        drawText(`College: ${studentData.college_university || 'N/A'}`);
        drawText(`Major: ${studentData.major || 'N/A'}`);
        y -= 20;

        if (includeGre || includeGmat) {
            drawText('Exam Scores', 16, true);
            if (includeGre) drawText(`GRE: ${studentData.exams?.gre || 'N/A'}`);
            if (includeGmat) drawText(`GMAT: ${studentData.exams?.gmat || 'N/A'}`);
            y -= 20;
        }

        const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qhaatabhigldcliavkgr.supabase.co';

        for (const transcript of selectedTranscripts) {
            try {
                const url = `${SUPABASE_URL}/storage/v1/object/public/transcripts/${transcript.path}`;
                const res = await fetch(url);
                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    const embeddedPages = await pdfDoc.embedPdf(buf);

                    for (const embeddedPage of embeddedPages) {
                        const page = pdfDoc.addPage([595, 842]); // Standard A4
                        const { width, height } = embeddedPage;

                        // Scale proportionally to fit within A4
                        const scale = Math.min(595 / width, 842 / height);
                        const scaledWidth = width * scale;
                        const scaledHeight = height * scale;

                        // Center horizontally & vertically on A4 page
                        const x = (595 - scaledWidth) / 2;
                        const y = (842 - scaledHeight) / 2;

                        page.drawPage(embeddedPage, {
                            x,
                            y,
                            width: scaledWidth,
                            height: scaledHeight,
                        });
                    }
                }
            } catch (e) {
                console.error("Transcripts error:", e);
            }
        }

        for (const letter of selectedLetters) {
            try {
                const url = `${SUPABASE_URL}/storage/v1/object/public/recommendationLetter/${letter.path}`;
                const res = await fetch(url);
                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    const embeddedPages = await pdfDoc.embedPdf(buf);

                    for (const embeddedPage of embeddedPages) {
                        const page = pdfDoc.addPage([595, 842]); // Standard A4
                        const { width, height } = embeddedPage;

                        // Scale proportionally to fit within A4
                        const scale = Math.min(595 / width, 842 / height);
                        const scaledWidth = width * scale;
                        const scaledHeight = height * scale;

                        // Center horizontally & vertically on A4 page
                        const x = (595 - scaledWidth) / 2;
                        const y = (842 - scaledHeight) / 2;

                        page.drawPage(embeddedPage, {
                            x,
                            y,
                            width: scaledWidth,
                            height: scaledHeight,
                        });
                    }
                }
            } catch (e) {
                console.error("Letter error:", e);
            }
        }

        const pdfBytes = await pdfDoc.save();

        // Save to public/sample
        const sampleDir = path.join(process.cwd(), 'public', 'sample');
        if (!fs.existsSync(sampleDir)) {
            fs.mkdirSync(sampleDir, { recursive: true });
        }

        // Remove spaces for clean URLs
        const safeName = school.name.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${safeName}_Application.pdf`;
        const filePath = path.join(sampleDir, fileName);

        fs.writeFileSync(filePath, Buffer.from(pdfBytes));

        return { url: `/sample/${fileName}` };
    } catch (e: any) {
        console.error(e);
        return { url: '', error: e.message };
    }
}
