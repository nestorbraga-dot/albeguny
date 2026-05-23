import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ status: db.storeOpenStatus });
}

export async function POST(request: Request) {
  try {
    const { status } = await request.json();
    if (typeof status === "boolean") {
      db.storeOpenStatus = status;
      return NextResponse.json({ success: true, status: db.storeOpenStatus });
    }
    return NextResponse.json({ error: "Status precisa ser um valor booleano." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
