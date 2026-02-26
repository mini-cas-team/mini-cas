// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center p-24">
//       <h1 className="text-4xl font-bold text-blue-600">Mini-CAS System</h1>
//       <p className="mt-4 text-gray-600">Starting the vibe coding journey...</p>
//     </main>
//   );
// }

import ApplicationForm from "@/components/ApplicationForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900">
          Mini-CAS Portal
        </h1>
        <p className="text-gray-500 mt-2">
          Apply to your dream program in seconds.
        </p>
      </div>

      <div className="mb-6 text-center">
        <a
          href="/admin"
          className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
        >
          View applicants (Admin)
        </a>
      </div>

      <ApplicationForm />
    </main>
  );
}
