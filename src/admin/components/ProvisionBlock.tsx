'use client';

import { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { provisionTable, provisionBucket } from '@/admin/actions';

interface ProvisionBlockProps {
    title: string;
    targetName: string;
    type: 'table' | 'bucket';
}

export function ProvisionBlock({ title, targetName, type }: ProvisionBlockProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    const handleRun = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const result = type === 'table'
                ? await provisionTable(targetName)
                : await provisionBucket(targetName);
            setStatus(result);
        } catch (err: any) {
            setStatus({ success: false, message: err.message || 'Unknown error occurred.' });
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xl uppercase shadow-inner border border-slate-200/50">
                        {title.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                        <p className="text-sm text-slate-500 font-mono mt-0.5">{type === 'table' ? 'Table:' : 'Bucket:'} <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-1">{targetName}</span></p>
                    </div>
                </div>
                <button
                    onClick={handleRun}
                    disabled={loading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all shadow-sm ${loading
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow hover:-translate-y-0.5 ring-offset-2 focus:ring-2 focus:ring-indigo-500'
                        }`}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {loading ? 'Running...' : 'Run Provision'}
                </button>
            </div>

            {/* Status Display */}
            {status && (
                <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-300 ${status.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {status.success ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />}
                    <div>
                        <p className="text-sm font-medium leading-relaxed">{status.message}</p>
                        {status.success && status.count !== undefined && (
                            <div className="text-xs mt-2 px-2.5 py-1 bg-white/60 rounded border border-emerald-100 inline-block font-medium">
                                Records/Files found: <span className="font-bold text-emerald-900">{status.count}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
