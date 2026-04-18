'use server';

import { supabase } from '@/lib/supabase';

export async function getSchools() {
    try {
        const { data, error } = await supabase
            .from('schools')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    } catch (e) {
        console.error("Failed to load schools from database:", e);
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
