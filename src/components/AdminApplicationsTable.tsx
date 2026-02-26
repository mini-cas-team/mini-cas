"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Application = {
  id?: number;
  full_name: string;
  email: string;
  phone: string | null;
  program: string;
  file_url: string | null;
  created_at?: string;
};

export default function AdminApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("applications")
        .select("id, full_name, email, phone, program, file_url, created_at")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setApplications((data as Application[]) ?? []);
      setLoading(false);
    };

    void fetchApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) return applications;

    return applications.filter((application) =>
      [application.full_name, application.email, application.program]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [applications, searchTerm]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm text-red-700">Failed to load applications: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Search applicants
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or program"
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Program</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Transcript</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredApplications.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={5}>
                  No applications found.
                </td>
              </tr>
            ) : (
              filteredApplications.map((application) => (
                <tr key={`${application.email}-${application.created_at ?? "no-date"}`}>
                  <td className="px-4 py-3 text-gray-800">{application.full_name}</td>
                  <td className="px-4 py-3 text-gray-700">{application.email}</td>
                  <td className="px-4 py-3 text-gray-700">{application.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{application.program}</td>
                  <td className="px-4 py-3">
                    {application.file_url ? (
                      <a
                        href={application.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Open file
                      </a>
                    ) : (
                      <span className="text-gray-500">No file</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
