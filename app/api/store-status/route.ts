import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/supabase-kv";

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = await getKV('sorvefood_store_status', true);
  return NextResponse.json({ status });
}

export async function POST(request: Request) {
  try {
    const { status } = await request.json();
    if (typeof status === "boolean") {
      await setKV('sorvefood_store_status', status);
      return NextResponse.json({ success: true, status });
    }
    return NextResponse.json({ error: "Status precisa ser um valor booleano." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
