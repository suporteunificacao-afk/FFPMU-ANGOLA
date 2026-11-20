import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/admin";
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = safeNextPath(searchParams.get("next") || (type === "recovery" ? "/redefinir-senha" : null));
  const supabase = await createClient();

  if (supabase) {
    // Supabase pode enviar o link como PKCE (?code=...) ou como token_hash + type.
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } else if (tokenHash && (type === "recovery" || type === "email")) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "recovery" | "email",
      });
      if (!error) return NextResponse.redirect(new URL(next, origin));
    } else {
      // Alguns modelos de e-mail devolvem os tokens no fragmento (#), que não chega ao servidor.
      return NextResponse.redirect(new URL("/redefinir-senha?verify=required", origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=recovery_link", origin));
}
