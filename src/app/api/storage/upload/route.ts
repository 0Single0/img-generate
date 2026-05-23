import { NextResponse } from "next/server";
import { getCurrentUser, unauthorizedResponse } from "@/lib/supabase/auth";

const bucket = "generation-assets";
const maxFileSize = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const getExtension = (type: string) => {
  if (type === "image/jpeg") {
    return "jpg";
  }

  if (type === "image/webp") {
    return "webp";
  }

  return "png";
};

export const POST = async (request: Request) => {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Image file is required." }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ message: "Only JPG, PNG, and WebP images are supported." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ message: "Image must be 10MB or smaller." }, { status: 400 });
  }

  const extension = getExtension(file.type);
  const path = `${user.id}/inputs/${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
};
