import { NextResponse } from "next/server";

import { AuthError, requireVerified } from "@/lib/auth/helpers";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  BUCKET_PROFILE_PICTURES,
  MAX_PROFILE_PICTURE_SIZE_BYTES,
} from "@/lib/storage/constants";

type AllowedMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export async function POST(request: Request) {
  try {
    const { authUserId } = await requireVerified();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Image file is required under the 'file' field.",
          },
        },
        { status: 400 }
      );
    }

    const mimeType = file.type as AllowedMimeType;
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Unsupported image type.",
          },
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_PROFILE_PICTURE_SIZE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Image file is too large.",
          },
        },
        { status: 400 }
      );
    }

    const originalName = file.name || "profile";
    const ext = (originalName.split(".").pop() || "jpg").toLowerCase();
    const timestamp = Date.now();
    const path = `${authUserId}/${timestamp}.${ext}`;

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase.storage
      .from(BUCKET_PROFILE_PICTURES)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (error || !data?.path) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SERVER_ERROR",
            message: "Failed to upload profile picture.",
          },
        },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET_PROFILE_PICTURES)
      .getPublicUrl(data.path);

    const profile_picture_url = publicData.publicUrl;

    return NextResponse.json(
      { ok: true, data: { profile_picture_url } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.status === 401) {
        return NextResponse.json(
          { ok: false, error: { code: err.code, message: err.message } },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}

