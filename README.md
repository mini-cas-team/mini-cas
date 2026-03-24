# Mini-CAS Application Form

The Mini-CAS (Centralized Application Service) is a modernized, unified portal that allows students to draft and submit academic applications to various University programs, while providing complete administrative controls to manage the platform infrastructure.

## Getting Started

Follow these steps to get the application running locally:

1. Clone the repository: `git clone https://github.com/mini-cas-team/mini-cas.git`
2. Install dependencies: `npm install`
3. Create a `.env.local` file in the root directory and add your Supabase credentials along with the Postgres connection string (required for Admin provisioning):
   ```text
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   DATABASE_URL=your_postgres_connection_string_here
   ```
4. Start the development server: `npm run dev`

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the portals.

---

## Application Document (User Guide)

The Mini-CAS platform is conceptually divided into three distinct role-based portals, built seamlessly on Next.js Server Actions and Supabase logic.

### 1. Student Portal (`/student`)
The Student Portal is the pristine, user-facing environment where applicants build their portfolio profiles.
- **Usage:** Navigate to `http://localhost:3000` (The default landing page routes automatically).
- **Session Management:** Entering a student name seamlessly loads or creates a persistent state profile from the Postgres backend.
- **Personal & Exam Tabs:** Quickly define standard meta application data (Name, College, Address) alongside self-reported testing performance (GRE/GMAT).
- **Documents Tabs (Transcripts & Recommendations):** A visually compelling drag-and-drop interface for uploading binary PDF resources up to the Supabase Cloud. Attached files render as custom dynamic cards with one-click preview links explicitly hooked into the cloud native URLs.
- **Apply Tab:** The capstone application generation step. Students conditionally select their target Programs from configured `yml` libraries, optionally attach Exam Scores, and select which uploaded Transcripts and Recommendation Letters define the package.
- **Application Compilation:** Clicking the **Preview** button triggers a secure Server Action proxy. The backend circumvents browser CORS limitations to aggressively fetch the binary chunks for every attached Document format. It mathematically normalizes every page dimension statically applying them onto an A4 PDF wrapper, merges them consecutively into a monolithic draft, and returns the file directly cleanly into the browser via the `/sample` static directory structure.

### 2. School Portal (`/school`)
The School Portal represents the secure incoming review dashboard where Universities receive, classify, and evaluate the compiled monolithic Application PDFs sent by active students. 
- *(Note: The School applicant tracking UI is currently pending structural logic in the project roadmap).*

### 3. Admin Portal (`/admin`)
The Admin Portal is the infrastructure control center. It permits system administrators to instantly provision necessary database tables and storage buckets natively bypassing the standard Supabase dashboard.
- **Usage:** Upon first installation, navigate to `http://localhost:3000/admin`.
- **Database Provisioning:** Click the execution button under the Table Provisioning tab to automatically generate the robust `students` SQL schema which synchronizes application states, exams, and JSON references for physical documents.
- **Storage Provisioning:** Utilize the Storage tab to automatically generate identical, public-facing bucket wrappers (`transcripts` and `recommendationLetter`) required by the Student portal interface.
