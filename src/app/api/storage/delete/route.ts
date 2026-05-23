import { NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";

const bucket = "generation-assets";

export const POST = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { path } = (await request.json()) as { path?: string };

  if (!path || !path.startsWith(`${user.id}/inputs/`)) {
    return NextResponse.json({ message: "Invalid storage path." }, { status: 400 });
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
};
