import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const { status } = await request.json();

    const order = db.ordersList.find(o => o.orderNumber === orderNumber);
    if (!order) {
      return NextResponse.json({ error: "Pedido não localizado." }, { status: 404 });
    }

    if (status === "PREPARANDO" || status === "PRONTO" || status === "ENTREGUE") {
      order.status = status;
      return NextResponse.json({ success: true, order });
    }
    
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao processar requisição." }, { status: 500 });
  }
}
