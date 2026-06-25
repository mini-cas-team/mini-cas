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
Before running the app, provision your RDS PostgreSQL tables and seed the initial schools data. You can do this quickly using the following npm commands:
```bash
# Create the RDS tables
npm run db:setup

# Seed the initial 10 universities
npm run db:seed

# Or execute both in one command
npm run db:reset
```

### 5. Onboard Test Student Records (Optional)
To quickly populate your AWS RDS database and S3 bucket with test records, transcripts, and recommendation letters, run the onboarding script command:
```bash
npm run db:onboard
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

AWS Amplify Hosting is a fully managed service for deploying Next.js Server-Side Rendered (SSR) applications directly from your Git repository.

### 1. How Git Pushes Trigger Auto-Deployment
AWS Amplify integrates with GitHub using webhooks. 
* Once you connect your GitHub repository to AWS Amplify, AWS sets up a webhook on your GitHub repository.
* Every time you execute `git push` to your connected branch (e.g. `main`), GitHub automatically notifies AWS Amplify.
* AWS Amplify immediately spawns a new build pipeline container to pull your latest code, build it, and deploy it.

---

### 2. First-Time Setup in AWS Management Console

1. Open the [AWS Management Console](https://console.aws.aws.amazon.com/) and search for **AWS Amplify**.
2. Click **Create New App** (or **Host web app**).
3. Select **GitHub** as the source repository provider and click **Next**.
4. Authorize AWS Amplify to access your GitHub account. Select your organization and choose the `mini-cas` repository.
5. Select the branch you want to track (e.g. `main`) and click **Next**.
6. On the **App Settings** page:
   * Amplify will automatically detect that this is a Next.js application and populate the correct build commands.
   * Expand the **Advanced settings** section to configure environment variables immediately, or configure them later as described below.
7. Click **Next** to review, then click **Save and Deploy**.

---

### 3. Watching the Deployment Process

Once the deployment starts, you can monitor its progress in real-time in the AWS Amplify Console:

1. Select your app from the AWS Amplify home page.
2. Click on the branch (e.g., `main`) under progress.
3. You will see a visual 4-stage pipeline tracker:
   * **Provision**: AWS allocates a secure build container to run the deployment.
   * **Build**: Runs `npm run build`. 
     * *Tip*: You can click directly on the **Build** card to view the live stdout/stderr console logs. This is extremely helpful to debug compile errors, TypeScript errors, or Next.js static page generation issues.
   * **Deploy**: Distributes your Next.js application, API routes, and Server Actions globally.
   * **Verify**: Runs screenshots on multiple browsers to verify the homepage loaded correctly.

---

### 4. Configuring and Updating Environment Variables

Since `.env.local` is ignored by Git, you must define your environment variables in the Amplify Console so they are injected at build/runtime.

#### To Add or Update Variables:
1. In the AWS Amplify sidebar, navigate to **App settings > Environment variables**.
2. Click **Manage variables** / **Add variable**.
3. Add the following keys matching your configurations:
   * `DATABASE_URL`: Your AWS RDS connection string.
   * `S3_BUCKET_NAME`: Your Amazon S3 bucket name.
   * `MINI_CAS_AWS_REGION`: Your S3 region (e.g. `us-east-1`). *(Note: Amplify reserves `AWS_` prefix, hence the custom prefix).*
   * `MINI_CAS_AWS_ACCESS_KEY_ID`: Your S3 access key.
   * `MINI_CAS_AWS_SECRET_ACCESS_KEY`: Your S3 secret access key.
   * `SMTP_HOST`: Your SMTP server hostname (optional, for email notifications).
   * `SMTP_PORT`: Your SMTP server port (e.g., `587` or `465`).
   * `SMTP_USER`: Your SMTP username.
   * `SMTP_PASSWORD`: Your SMTP password.
   * `SMTP_FROM`: Your sender name and email (e.g., `"Mini-CAS <noreply@yourdomain.com>"`).
4. Click **Save**.
5. ⚠️ **IMPORTANT**: After updating environment variables, you **must trigger a new deployment** for Next.js to compile the new values. Go to your branch page and click **Redeploy this version** (or push a new commit to GitHub).

---

### 5. Finding Your Deployed URL

Once the pipeline successfully finishes the **Deploy** or **Verify** stage:
1. Navigate back to the branch page of your app in the Amplify Console.
2. Directly below the branch name (e.g. `main`), you will see a clickable public link (e.g., `https://main.d1a2b3c4d5e6f.amplifyapp.com`).
3. Click this link to access your live production app! You can also configure a custom domain (e.g., `portal.minicas.edu`) under **App settings > Domain management**.
