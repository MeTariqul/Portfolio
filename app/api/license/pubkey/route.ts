import { NextResponse } from "next/server";
import { RECHECK_DAYS, publicKeyPem } from "@/lib/licensing";

// GET /api/license/pubkey
//
// The public half of the signing pair, for apps that verify tokens
// offline. Not a secret — publishing it is the point — so this endpoint
// needs no authentication.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      algorithm: "ed25519",
      publicKey: await publicKeyPem(),
      recheckDays: RECHECK_DAYS,
    },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
