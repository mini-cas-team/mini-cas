# Mini-CAS Application Form

The Mini-CAS (Centralized Application Service) is a modernized, unified portal that allows students to draft and submit academic applications to various University programs, while providing complete administrative controls to manage the platform infrastructure.

This application is built on **Next.js (App Router)** and utilizes **Amazon Web Services (AWS)** for database storage and document hosting.

---

## Architecture & Technology Stack

* **Database:** **Amazon RDS (PostgreSQL)** hosting relations for students, schools, applications, and answers.
* **Object Storage:** **Amazon S3** hosting private documents (transcripts and recommendation letters). Access is secured via short-lived, cryptographically signed **Presigned URLs** (for browser-to-S3 uploads and downloads).
* **PDF Compilation:** Integrates `pdf-lib` to stream documents directly from S3, merging them server-side into a consolidated application PDF package.
* **Server-side Security:** Direct database queries are restricted to Server Actions and API endpoints, eliminating browser-side exposure of AWS credentials and database URIs.

---

## Local Setup & Development

Follow these steps to configure and run the application locally:

### 1. Clone the repository
```bash
git clone https://github.com/mini-cas-team/mini-cas.git
cd mini-cas
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Local Credentials
Create a `.env.local` file in the root directory and define the following variables:
```text
# RDS PostgreSQL Database Connection String
DATABASE_URL=postgresql://<username>:<password>@mini-cas-db.c0ryuu40u7jh.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require

# AWS Storage Configuration
S3_BUCKET_NAME=mini-cas-docs-5d904b5f
AWS_REGION=us-east-1

# S3 IAM Credentials (for local server actions)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### 4. Database Schema and Seeding
Before running the app, provision your RDS tables and seed the initial schools data:
```bash
# Create the RDS tables
node --env-file=.env.local setup-db-tables.js

# Seed the initial 10 universities
node --env-file=.env.local scripts/migrate-schools.js
```

### 5. Onboard Test Student Records (Optional)
To quickly populate your local RDS database and S3 bucket with test records, transcripts, and recommendation letters, you can run the student record onboarding scripts:
```bash
# Onboard a default student (Alice Smith)
node --env-file=.env.local create-transcript.js
node --env-file=.env.local create-recommendation-letters.js
```

### 6. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Portals & Usage

### 1. Student Portal (`/student`)
* Applicants input profile details and exam scores (GRE/GMAT).
* Uploaded PDFs are transferred directly to Amazon S3 using presigned upload URLs.
* PDF files are rendered as cards. Clicking them triggers a secure backend proxy (`/api/documents?key=...`) that generates short-lived, read-only S3 presigned URLs for in-browser preview.
* In the **Apply** tab, applicants select target programs, attach scores, pick transcripts/letters, and click **Preview**. Next.js pulls the files directly from S3 as memory buffers, normalizes, and merges them into a consolidated draft PDF.

### 2. School Portal (`/school`)
* Review dashboard where universities evaluate and track dynamic applications.

### 3. Admin Portal (`/admin`)
* Permits system administrators to provision RDS tables and verify connection health directly from the web interface.

---

## Deployment to AWS (Amplify Hosting)

AWS Amplify is the recommended method to deploy the Next.js SSR application.

### Step 1: Git Configuration
Amplify deploys directly from your code repository. Commit and push all code changes (excluding `.env.local`):
```bash
git add .
git commit -m "deploy: migrate to AWS RDS & S3"
git push origin main
```

### Step 2: Configure Environment Variables in AWS
Since `.env.local` is ignored by Git, you must configure secrets in the AWS Amplify Console:
1. Navigate to **AWS Amplify** in the AWS Console.
2. Select **Create New App** and connect your Git repository.
3. Select your branch (e.g. `main`).
4. In **App Settings > Environment variables**, click **Manage variables** and add the following keys matching your local `.env.local`:
   * `DATABASE_URL`
   * `S3_BUCKET_NAME`
   * `AWS_REGION`
   * `AWS_ACCESS_KEY_ID`
   * `AWS_SECRET_ACCESS_KEY`
5. Click **Save and Deploy**.

Amplify will automatically build, provision, and host the Next.js application at a secure public domain.
