import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.productsList);
}

export async function POST(request: Request) {
  try {
    const updatedProds = await request.json();
    if (Array.isArray(updatedProds)) {
      const db = await getDb();
      db.productsList = updatedProds;
      await saveDb(db);
      return NextResponse.json({ success: true, count: db.productsList.length });
    }
    return NextResponse.json({ error: "Formato inválido para atualizar produtos." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
