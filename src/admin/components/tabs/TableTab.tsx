'use client';

import { ProvisionBlock } from '@/admin/components/ProvisionBlock';

export default function TableTab() {
    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Database Tables</h2>
            <p className="text-slate-500 mb-8">Click run to check existence or instantly provision Postgres tables.</p>

            <div className="space-y-6">
                <ProvisionBlock title="Student Profiles" targetName="students" type="table" />
                <ProvisionBlock title="Academic Institutions" targetName="schools" type="table" />
                <ProvisionBlock title="Academic Applications" targetName="applications" type="table" />
                <ProvisionBlock title="Institutional Questions" targetName="school_questions" type="table" />
                <ProvisionBlock title="Recommendation Letter Providers" targetName="providers" type="table" />
                <ProvisionBlock title="Provider Recommendation Letters" targetName="provider_letter" type="table" />
            </div>
        </div>
    );
}
