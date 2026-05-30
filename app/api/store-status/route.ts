import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  return NextResponse.json({ status: db.storeOpenStatus });
}

export async function POST(request: Request) {
  try {
    const { status } = await request.json();
    if (typeof status === "boolean") {
      const db = await getDb();
      db.storeOpenStatus = status;
      await saveDb(db);
      return NextResponse.json({ success: true, status: db.storeOpenStatus });
    }
    return NextResponse.json({ error: "Status precisa ser um valor booleano." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
