import { NextResponse } from "next/server";
import { decryptApiKey } from "@/lib/crypto/api-key";
import { generateWithProvider } from "@/lib/providers";
import { isMissingSupabaseTableError, missingSchemaMessage } from "@/lib/supabase/errors";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";

type TestModelBody = {
  modelId: string;
  prompt?: string;
};

export const POST = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as TestModelBody;

  const { data: model, error } = await supabase
    .from("model_configs")
    .select("provider,model_id,base_url,api_key_encrypted")
    .eq("id", body.modelId)
    .eq("user_id", user.id)
    .eq("provider", "openai")
    .single();

  if (error || !model) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: error?.message ?? "Model not found." }, { status: 404 });
  }

  try {
    if (!model.api_key_encrypted) {
      throw new Error("API key is missing.");
    }

    await generateWithProvider({
      provider: model.provider,
      apiKey: decryptApiKey(model.api_key_encrypted),
      baseUrl: model.base_url,
      modelId: model.model_id,
      operation: "generation",
      prompt: body.prompt ?? "A minimal studio product photo of a ceramic cup",
      params: { n: 1, size: "1024x1024" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model test failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
};
