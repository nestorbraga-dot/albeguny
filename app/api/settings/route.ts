import { NextResponse } from "next/server";
import { getKV, setKV } from "@/lib/supabase-kv";

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await getKV('sorvefood_store_settings', {
    bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
    bannerTitle: 'O Melhor Sorvete da Cidade',
    bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
  });
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  try {
    const { bannerImage, bannerTitle, bannerDescription } = await request.json();
    if (bannerTitle) {
      const newSettings = { bannerImage, bannerTitle, bannerDescription };
      await setKV('sorvefood_store_settings', newSettings);
      return NextResponse.json({ success: true, settings: newSettings });
    }
    return NextResponse.json({ error: "Título do banner é obrigatório." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
