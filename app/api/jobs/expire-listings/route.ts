import { NextResponse } from "next/server";

import { expireListingsJob } from "@/lib/listings/helpers";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-CRON-SECRET");
    const expected = process.env.CRON_SECRET;

    if (!expected || secret !== expected) {
      return NextResponse.json(
        { ok: false, error: { code: "FORBIDDEN", message: "Invalid cron secret." } },
        { status: 403 }
      );
    }

    const { expiredCount } = await expireListingsJob();

    return NextResponse.json(
      { ok: true, data: { expired_count: expiredCount } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}
