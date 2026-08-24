import { AdminAccessError, requireAdminEmail } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

const noStoreHeaders = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    await requireAdminEmail();
    return NextResponse.json({ isAdmin: true }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof AdminAccessError && error.status !== 500) {
      return NextResponse.json({ isAdmin: false }, { headers: noStoreHeaders });
    }

    return NextResponse.json(
      { error: "Unable to check admin access" },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
