import { NextResponse } from "next/server";
import { decryptApiKey, encryptApiKey } from "@/lib/crypto/api-key";
import { isMissingSupabaseTableError, missingSchemaMessage } from "@/lib/supabase/errors";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";
import { generateWithProvider } from "@/lib/providers";
import type { ModelConfig, ModelConfigInput } from "@/types/provider";

export const GET = async () => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { data, error } = await supabase
    .from("model_configs")
    .select("id,user_id,model_option_id,provider,provider_label,provider_icon,display_name,model_id,model_label,base_url,enabled,notes,created_at,updated_at")
    .eq("user_id", user.id)
    .eq("provider", "openai")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json([]);
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
};

export const POST = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as ModelConfigInput;

  if (!body.display_name || !body.model_option_id || !body.base_url) {
    return NextResponse.json({ message: "Missing required model fields." }, { status: 400 });
  }

  const { data: option, error: optionError } = await supabase
    .from("model_options")
    .select("id,provider_key,provider_label,icon,model_id,model_label")
    .eq("id", body.model_option_id)
    .eq("provider_key", "openai")
    .eq("enabled", true)
    .single();

  if (optionError || !option) {
    if (isMissingSupabaseTableError(optionError)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: optionError?.message ?? "Model option not found." }, { status: 404 });
  }

  const insertPayload = {
    user_id: user.id,
    model_option_id: option.id,
    provider: option.provider_key,
    provider_label: option.provider_label,
    provider_icon: option.icon ?? null,
    display_name: body.display_name,
    model_id: option.model_id,
    model_label: option.model_label,
    base_url: body.base_url,
    api_key_encrypted: body.api_key ? encryptApiKey(body.api_key) : null,
    enabled: body.enabled,
    notes: body.notes ?? null,
  };

  const { data, error } = await supabase
    .from("model_configs")
    .insert(insertPayload)
    .select("id,user_id,model_option_id,provider,provider_label,provider_icon,display_name,model_id,model_label,base_url,enabled,notes,created_at,updated_at")
    .single<ModelConfig>();

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
};

export const PATCH = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as ModelConfigInput & { id: string };

  if (!body.id) {
    return NextResponse.json({ message: "Model id is required." }, { status: 400 });
  }

  if (!body.model_option_id) {
    return NextResponse.json({ message: "Model option id is required." }, { status: 400 });
  }

  const { data: option, error: optionError } = await supabase
    .from("model_options")
    .select("id,provider_key,provider_label,icon,model_id,model_label")
    .eq("id", body.model_option_id)
    .eq("provider_key", "openai")
    .eq("enabled", true)
    .single();

  if (optionError || !option) {
    if (isMissingSupabaseTableError(optionError)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: optionError?.message ?? "Model option not found." }, { status: 404 });
  }

  const updatePayload = {
    model_option_id: option.id,
    provider: option.provider_key,
    provider_label: option.provider_label,
    provider_icon: option.icon ?? null,
    display_name: body.display_name,
    model_id: option.model_id,
    model_label: option.model_label,
    base_url: body.base_url,
    enabled: body.enabled,
    notes: body.notes ?? null,
    ...(body.api_key ? { api_key_encrypted: encryptApiKey(body.api_key) } : {}),
  };

  const { data, error } = await supabase
    .from("model_configs")
    .update(updatePayload)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("id,user_id,model_option_id,provider,provider_label,provider_icon,display_name,model_id,model_label,base_url,enabled,notes,created_at,updated_at")
    .single<ModelConfig>();

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
};

export const DELETE = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Model id is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("model_configs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
};

export const testModelConfig = async (model: ModelConfig, prompt = "A simple test image") => {
  if (!model.api_key_encrypted) {
    throw new Error("API key is required to test this model.");
  }

  return generateWithProvider({
    provider: model.provider,
    apiKey: decryptApiKey(model.api_key_encrypted),
    baseUrl: model.base_url,
    modelId: model.model_id,
    operation: "generation",
    prompt,
    params: { n: 1, size: model.provider === "seedream" ? "2K" : "1024x1024" },
  });
};
