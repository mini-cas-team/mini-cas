// "use client";

// import { useState, useEffect, ChangeEvent } from "react";
"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "../lib/supabase"; // <--- ADD THIS
export default function ApplicationForm() {
  // 1. STATE MANAGEMENT
  const [isDev, setIsDev] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    program: "Computer Science",
    file: null as File | null,
  });

  // Check if we are in development mode to show the Auto-fill button
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  // 2. HELPER FUNCTIONS
  const autoFill = () => {
    setFormData({
      fullName: "Test Student",
      email: "test@example.com",
      phone: "+1 555-0199",
      program: "Data Science",
      file: null, // Files cannot be auto-filled for security reasons
    });
    setUploadSuccess(false);
  };

  // const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const selectedFile = e.target.files[0];
  //     setFormData((prev) => ({ ...prev, file: selectedFile }));

  //     // Simulate Upload
  //     setIsUploading(true);
  //     setUploadSuccess(false);
  //     setTimeout(() => {
  //       setIsUploading(false);
  //       setUploadSuccess(true);
  //     }, 1500);
  //   }
  // };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFormData((prev) => ({ ...prev, file: selectedFile }));
      setUploadSuccess(true); // Mark as ready immediately
    }
  };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!uploadSuccess && formData.file) {
  //     alert("Please wait for the file to finish uploading.");
  //     return;
  //   }
  //   console.log("Final Submission Data:", formData);
  //   alert(
  //     `Application submitted for ${formData.fullName}! Check the console for details.`,
  //   );
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let publicUrl = "";

      // A. Upload File to Supabase Storage
      if (formData.file) {
        const fileExt = formData.file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("transcripts")
          .upload(fileName, formData.file);

        if (uploadError) throw uploadError;

        // Get the URL so we can store it in the database
        const { data: urlData } = supabase.storage
          .from("transcripts")
          .getPublicUrl(fileName);

        publicUrl = urlData.publicUrl;
      }

      // B. Save Data to Supabase Database
      const { error: dbError } = await supabase.from("applications").insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          program: formData.program,
          file_url: publicUrl,
        },
      ]);

      if (dbError) throw dbError;

      alert("Success! Your application is in the cloud.");
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        program: "Computer Science",
        file: null,
      });
      setUploadSuccess(false);
    } catch (error: unknown) {
      console.error("Submission Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      alert("Error: " + message);
    } finally {
      setIsUploading(false);
    }
  };
  console.log("TESTING SUPABASE CONNECTION:");
  console.log("URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 relative">
      {/* DEV TOOL: AUTO-FILL BUTTON */}
      {isDev && (
        <button
          onClick={autoFill}
          type="button"
          className="absolute -top-12 right-0 bg-amber-100 text-amber-700 px-3 py-1 rounded-md text-xs font-bold border border-amber-200 hover:bg-amber-200 transition-colors"
        >
          ⚡ DEV: AUTO-FILL FIELDS
        </button>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Application Details
        </h2>
        <p className="text-sm text-gray-500">
          Provide your info and transcripts below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border transition-all"
            placeholder="John Doe"
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
        </div>

        {/* Email & Phone */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              required
              value={formData.email}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              placeholder="john@example.com"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              placeholder="+1 (555) 000-0000"
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>
        </div>

        {/* Program Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Academic Program
          </label>
          <select
            value={formData.program}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white cursor-pointer"
            onChange={(e) =>
              setFormData({ ...formData, program: e.target.value })
            }
          >
            <option>Computer Science</option>
            <option>Business Administration</option>
            <option>Data Science</option>
            <option>Mechanical Engineering</option>
          </select>
        </div>

        {/* File Upload Section */}
        <div className="mt-2">
          <label className="block text-sm font-semibold text-gray-700">
            Upload Transcript (PDF)
          </label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all duration-300 ${
              uploadSuccess
                ? "border-green-500 bg-green-50"
                : isUploading
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300"
            }`}
          >
            <div className="space-y-1 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                </div>
              ) : uploadSuccess ? (
                <div className="flex flex-col items-center">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="mt-1 text-sm text-green-700 font-medium">
                    Ready!
                  </p>
                  <p className="text-xs text-green-600">
                    {formData.file?.name}
                  </p>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-10 w-10 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 italic">PDF required</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all font-bold shadow-md active:scale-95 disabled:bg-gray-400 disabled:scale-100"
          disabled={isUploading}
        >
          {isUploading ? "Please wait..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
