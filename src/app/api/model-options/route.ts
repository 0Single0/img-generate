import { NextResponse } from "next/server";
import { defaultModelOptions } from "@/lib/providers/config";
import { isMissingSupabaseTableError } from "@/lib/supabase/errors";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";
import type { ModelOption } from "@/types/provider";

export const GET = async () => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { data, error } = await supabase
    .from("model_options")
    .select("*")
    .eq("provider_key", "openai")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<ModelOption[]>();

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json(defaultModelOptions);
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
};
