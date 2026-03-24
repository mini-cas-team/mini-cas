'use client';

import { ProvisionBlock } from '@/admin/components/ProvisionBlock';

export default function TableTab() {
    return (
        <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Database Tables</h2>
            <p className="text-slate-500 mb-8">Click run to check existence or instantly provision Postgres tables.</p>

            <div className="space-y-6">
                <ProvisionBlock title="Student Entity" targetName="students" type="table" />
            </div>
        </div>
    );
}
