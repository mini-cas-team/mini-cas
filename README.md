# Mini-CAS Application Form

## Getting Started

1. Clone the repo https://github.com/mini-cas-team/mini-cas.git
2. Run `npm install`
3. Create a `.env.local` file in the root and add:
   ```text
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

> Codex note: README test update on codex branch.


- `SUPABASE_SERVICE_ROLE_KEY` is required for the admin dashboard API (`/api/admin/applications`) to retrieve all application rows.
