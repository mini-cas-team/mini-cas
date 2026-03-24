'use server';

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function getSchools() {
    try {
        const fileContents = fs.readFileSync(path.join(process.cwd(), 'src', 'config', 'school.yml'), 'utf8');
        const data = yaml.load(fileContents) as any;
        return data.schools || [];
    } catch (e) {
        console.error("Failed to load schools:", e);
        return [];
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
