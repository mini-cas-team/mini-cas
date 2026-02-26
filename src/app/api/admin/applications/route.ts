import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ApplicationRow = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  program: string;
  file_url: string | null;
  created_at: string | null;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const pageSize = 1000;
    let from = 0;
    const allRows: ApplicationRow[] = [];

    while (true) {
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("applications")
        .select("id, full_name, email, phone, program, file_url, created_at")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw error;
      }

      const rows = (data as ApplicationRow[]) ?? [];
      allRows.push(...rows);

      if (rows.length < pageSize) {
        break;
      }

      from += pageSize;
    }

    return NextResponse.json({ applications: allRows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Failed to fetch applications: ${message}` },
      { status: 500 },
    );
  }
}
