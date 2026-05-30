import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.categoriesSet);
}

export async function POST(request: Request) {
  try {
    const newCats = await request.json();
    if (Array.isArray(newCats)) {
      const db = await getDb();
      db.categoriesSet = newCats;
      await saveDb(db);
      return NextResponse.json({ success: true, categories: db.categoriesSet });
    }
    return NextResponse.json({ error: "Formato incorreto. Deve ser uma lista de strings." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
