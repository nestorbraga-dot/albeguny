import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json(db.productsList);
}

export async function POST(request: Request) {
  try {
    const updatedProds = await request.json();
    if (Array.isArray(updatedProds)) {
      db.productsList = updatedProds;
      return NextResponse.json({ success: true, count: db.productsList.length });
    }
    return NextResponse.json({ error: "Formato inválido para atualizar produtos." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
