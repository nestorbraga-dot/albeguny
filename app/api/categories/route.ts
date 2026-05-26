import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/supabase-kv";
import { INITIAL_CATEGORIES } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const cats = await getKV('sorvefood_categories', INITIAL_CATEGORIES);
  return NextResponse.json(cats);
}

export async function POST(request: Request) {
  try {
    const newCats = await request.json();
    if (Array.isArray(newCats)) {
      await setKV('sorvefood_categories', newCats);
      return NextResponse.json({ success: true, categories: newCats });
    }
    return NextResponse.json({ error: "Formato incorreto. Deve ser uma lista de strings." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
