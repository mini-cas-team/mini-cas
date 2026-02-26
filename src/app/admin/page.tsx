import Link from "next/link";
import AdminApplicationsTable from "@/components/AdminApplicationsTable";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Review all submitted Mini-CAS applications.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex w-fit items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
          >
            Back to applicant form
          </Link>
        </div>

        <AdminApplicationsTable />
      </div>
    </main>
  );
}
