import { NextResponse } from "next/server";

import { expireListingsJob } from "@/lib/listings/helpers";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const xCronSecret = request.headers.get("X-CRON-SECRET");
    const expected = process.env.CRON_SECRET;

    const isValid =
      expected &&
      (authHeader === `Bearer ${expected}` || xCronSecret === expected);

    if (!isValid) {
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
