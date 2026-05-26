import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(db.categoriesSet);
}

export async function POST(request: Request) {
  try {
    const newCats = await request.json();
    if (Array.isArray(newCats)) {
      db.categoriesSet = newCats;
      return NextResponse.json({ success: true, categories: db.categoriesSet });
    }
    return NextResponse.json({ error: "Formato incorreto. Deve ser uma lista de strings." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
