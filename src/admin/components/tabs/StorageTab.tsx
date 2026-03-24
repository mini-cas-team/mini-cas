'use client';

import { ProvisionBlock } from '@/admin/components/ProvisionBlock';

export default function StorageTab() {
    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Storage Buckets</h2>
            <p className="text-slate-500 mb-8">Click run to check existence or provision Supabase Storage buckets.</p>

            <div className="grid gap-6">
                <ProvisionBlock title="Transcripts Documents" targetName="transcripts" type="bucket" />
                <ProvisionBlock title="Recommendation Letters" targetName="recommendationLetter" type="bucket" />
            </div>
        </div>
    );
}
