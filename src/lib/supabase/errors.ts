export const isMissingSupabaseTableError = (error?: { message?: string; code?: string } | null) =>
  error?.code === "42P01" ||
  error?.message?.includes("Could not find the table") ||
  error?.message?.includes("schema cache");

export const missingSchemaMessage =
  "Supabase tables are not initialized. Run the SQL in supabase/migrations/001_initial_schema.sql in the Supabase SQL Editor, then refresh the page.";

