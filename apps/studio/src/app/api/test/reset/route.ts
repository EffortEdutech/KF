import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resetWorkspaceForRuntimeTests } from "../../../workspace-store";

function isLocalRequest(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

export async function POST(request: NextRequest) {
  const expectedToken = process.env.KF_TEST_RESET_TOKEN ?? "kf-local-runtime-reset";
  const providedToken = request.headers.get("x-kf-test-reset-token");

  if (providedToken !== expectedToken || !isLocalRequest(request)) {
    return NextResponse.json({ error: "Test reset is disabled" }, { status: 404 });
  }

  if (process.env.KF_ENABLE_TEST_RESET !== "1" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test reset is disabled" }, { status: 404 });
  }

  try {
    await resetWorkspaceForRuntimeTests();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Runtime reset failed" },
      { status: 409 }
    );
  }

  return NextResponse.json({ status: "reset" });
}
