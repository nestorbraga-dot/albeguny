import { NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getDb();
  return NextResponse.json(db.storeSettings);
}

export async function POST(request: Request) {
  try {
    const { bannerImage, bannerTitle, bannerDescription } = await request.json();
    if (bannerTitle) {
      const db = await getDb();
      db.storeSettings = { bannerImage, bannerTitle, bannerDescription };
      await saveDb(db);
      return NextResponse.json({ success: true, settings: db.storeSettings });
    }
    return NextResponse.json({ error: "Título do banner é obrigatório." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
