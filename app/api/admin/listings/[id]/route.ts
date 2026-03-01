import { NextResponse } from "next/server";

import {
  AuthError,
  requireAdmin,
  requireNotBanned,
  requireProfileComplete,
  requireVerified,
} from "@/lib/auth/helpers";
import { ListingError, softDeleteListing } from "@/lib/listings/helpers";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    await requireProfileComplete(authUserId);
    const adminUser = await requireAdmin(authUserId);

    const { id } = await params;

    const updated = await softDeleteListing(adminUser, id);

    return NextResponse.json(
      { ok: true, data: { status: updated.status } },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    if (err instanceof ListingError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
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
