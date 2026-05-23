import { NextResponse } from "next/server";
import { decryptApiKey } from "@/lib/crypto/api-key";
import { generateWithProvider } from "@/lib/providers";
import { isMissingSupabaseTableError, missingSchemaMessage } from "@/lib/supabase/errors";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";
import type { GenerationParams, GenerationOperation } from "@/types/provider";

export const maxDuration = 300;

type GenerateBody = {
  requestId?: string;
  modelConfigId: string;
  operation: GenerationOperation;
  prompt: string;
  params: GenerationParams;
  referenceImagePaths?: string[];
};

const bucket = "generation-assets";

const uploadBase64Image = async (
  supabase: Awaited<ReturnType<typeof getCurrentUser>>["supabase"],
  userId: string,
  recordId: string,
  index: number,
  base64: string,
  mimeType: string,
) => {
  const extension = mimeType.includes("jpeg") ? "jpg" : "png";
  const path = `${userId}/outputs/${recordId}-${index}.${extension}`;
  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  return path;
};

const toPositiveInteger = (value: string | null, fallback: number, max: number) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
};

export const GET = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const model = searchParams.get("model");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const page = toPositiveInteger(searchParams.get("page"), 1, 10000);
  const pageSize = toPositiveInteger(searchParams.get("pageSize"), 10, 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("generation_records")
    .select("*", { count: "exact" })
    .eq("user_id", user.id);

  if (q) {
    query = query.or(`request_id.ilike.%${q}%,prompt.ilike.%${q}%`);
  }

  if (status && ["pending", "succeeded", "failed"].includes(status)) {
    query = query.eq("status", status);
  }

  if (model && model !== "all") {
    query = query.eq("provider", model);
  }

  if (start) {
    query = query.gte("created_at", start);
  }

  if (end) {
    query = query.lte("created_at", end);
  }

  const modelsQuery = supabase
    .from("generation_records")
    .select("provider")
    .eq("user_id", user.id);

  const [{ data, error, count }, { data: modelRows, error: modelsError }] = await Promise.all([
    query
    .order("created_at", { ascending: false })
      .range(from, to),
    modelsQuery,
  ]);

  if (error || modelsError) {
    const responseError = error ?? modelsError;

    if (isMissingSupabaseTableError(error)) {
      return NextResponse.json({ items: [], total: 0, page, pageSize, models: [] });
    }

    return NextResponse.json(
      { message: responseError?.message ?? "Failed to load generations." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    models: Array.from(new Set((modelRows ?? []).map((row) => row.provider))),
  });
};

export const POST = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as GenerateBody;

  if (!body.modelConfigId || !body.prompt) {
    return NextResponse.json({ message: "Model and prompt are required." }, { status: 400 });
  }

  const requestId = body.requestId ?? crypto.randomUUID();

  const { data: model, error: modelError } = await supabase
    .from("model_configs")
    .select("*")
    .eq("id", body.modelConfigId)
    .eq("user_id", user.id)
    .eq("enabled", true)
    .single();

  if (modelError || !model) {
    if (isMissingSupabaseTableError(modelError)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: modelError?.message ?? "Model not found." }, { status: 404 });
  }

  if (!model.api_key_encrypted) {
    return NextResponse.json({ message: "Model API key is missing." }, { status: 400 });
  }

  const { data: record, error: recordError } = await supabase
    .from("generation_records")
    .insert({
      user_id: user.id,
      request_id: requestId,
      model_config_id: model.id,
      provider: model.provider,
      model_id: model.model_id,
      operation: body.operation,
      prompt: body.prompt,
      params: body.params ?? {},
      reference_image_paths: body.referenceImagePaths ?? [],
      output_image_paths: [],
      status: "pending",
    })
    .select("id")
    .single();

  if (recordError || !record) {
    if (isMissingSupabaseTableError(recordError)) {
      return NextResponse.json({ message: missingSchemaMessage }, { status: 503 });
    }

    return NextResponse.json({ message: recordError?.message ?? "Failed to create record." }, { status: 500 });
  }

  try {
    const referenceImageUrls = await Promise.all(
      (body.referenceImagePaths ?? []).map(async (path) => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 20);

        if (error) {
          throw new Error(error.message);
        }

        return data.signedUrl;
      }),
    );

    const results = await generateWithProvider({
      provider: model.provider,
      requestId,
      apiKey: decryptApiKey(model.api_key_encrypted),
      baseUrl: model.base_url,
      modelId: model.model_id,
      operation: body.operation,
      prompt: body.prompt,
      params: body.params ?? {},
      referenceImageUrls,
    });

    const outputPaths = await Promise.all(
      results.map(async (result, index) => {
        if (!result.base64) {
          throw new Error("Provider returned a URL instead of base64 output.");
        }

        return uploadBase64Image(
          supabase,
          user.id,
          record.id,
          index,
          result.base64,
          result.mimeType,
        );
      }),
    );

    const { data: completed, error: completeError } = await supabase
      .from("generation_records")
      .update({
        status: "succeeded",
        output_image_paths: outputPaths,
      })
      .eq("id", record.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (completeError) {
      throw new Error(completeError.message);
    }

    return NextResponse.json({
      ...completed,
      upstreamImagesRequested: body.params?.n ?? 1,
      upstreamImagesReturned: results.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";

    await supabase
      .from("generation_records")
      .update({ status: "failed", error_message: message })
      .eq("id", record.id)
      .eq("user_id", user.id);

    return NextResponse.json({ message }, { status: 502 });
  }
};

export const DELETE = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "Record id is required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("generation_records")
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
