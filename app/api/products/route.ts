import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/supabase-kv";
import { INITIAL_PRODUCTS } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getKV('sorvefood_products', INITIAL_PRODUCTS);
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const updatedProds = await request.json();
    if (Array.isArray(updatedProds)) {
      await setKV('sorvefood_products', updatedProds);
      return NextResponse.json({ success: true, count: updatedProds.length });
    }
    return NextResponse.json({ error: "Formato inválido para atualizar produtos." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
