import { NextResponse } from "next/server";
import { db, Order, Size, Extra } from "@/lib/db";
import crypto from "crypto";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(db.ordersList);
}

export async function POST(request: Request) {
  if (!db.storeOpenStatus) {
    return NextResponse.json({ error: "A loja está fechada no momento." }, { status: 400 });
  }

  try {
    const { items, customerName, customerPhone, paymentMethod, deliveryType, tableNumber } = await request.json();

    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "O nome do cliente é obrigatório." }, { status: 400 });
    }

    if (deliveryType === "MESA" && (!tableNumber || !tableNumber.trim())) {
      return NextResponse.json({ error: "O número da mesa é obrigatório." }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Nenhum item adicionado ao pedido." }, { status: 400 });
    }

    let orderTotalCalculated = 0;
    const validatedItems = [];

    for (const item of items) {
      const serverProduct = db.productsList.find(p => p.id === item.product.id);
      if (!serverProduct) {
        return NextResponse.json({ error: `O produto com ID ${item.product.id} não existe mais no cardápio.` }, { status: 400 });
      }

      if (serverProduct.isAvailable === false) {
        return NextResponse.json({ error: `O produto '${serverProduct.name}' está esgotado no momento.` }, { status: 400 });
      }

      let selectedSize: Size | undefined = undefined;
      let itemBasePrice = serverProduct.price;

      if (item.selectedSize) {
        const foundSize = serverProduct.sizes?.find(s => s.id === item.selectedSize.id);
        if (!foundSize) {
          return NextResponse.json({ error: `O tamanho selecionado para o produto ${serverProduct.name} é inválido.` }, { status: 400 });
        }
        selectedSize = foundSize;
        itemBasePrice = foundSize.price;
      }

      const validatedExtras: Extra[] = [];
      if (item.selectedExtras && Array.isArray(item.selectedExtras)) {
        for (const ext of item.selectedExtras) {
          const foundExtra = serverProduct.extras?.find(e => e.id === ext.id);
          if (!foundExtra) {
            return NextResponse.json({ error: `O adicional '${ext.name}' não é válido para o produto ${serverProduct.name}.` }, { status: 400 });
          }
          validatedExtras.push(foundExtra);
        }
      }

      const extrasSum = validatedExtras.reduce((acc, current) => acc + current.price, 0);
      const unitTotal = itemBasePrice + extrasSum;
      const itemSubtotal = unitTotal * item.quantity;

      orderTotalCalculated += itemSubtotal;

      const extrasIdsSuffix = validatedExtras.map(e => e.id).sort().join(',');
      const sizeIdSuffix = selectedSize ? selectedSize.id : 'base';
      const cartItemId = `${serverProduct.id}-${sizeIdSuffix}-${extrasIdsSuffix}`;

      validatedItems.push({
        cartItemId,
        product: serverProduct,
        quantity: item.quantity,
        selectedExtras: validatedExtras,
        selectedSize: selectedSize
      });
    }

    const randomBuffer = crypto.randomBytes(2);
    const orderNumberInt = 1000 + (randomBuffer.readUInt16BE(0) % 9000);
    const orderNumberStr = orderNumberInt.toString();

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: orderNumberStr,
      items: validatedItems,
      total: orderTotalCalculated,
      status: 'PREPARANDO',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      customerName: customerName.trim(),
      customerPhone: customerPhone ? customerPhone.trim() : undefined,
      paymentMethod,
      deliveryType,
      tableNumber: deliveryType === 'MESA' ? tableNumber.trim() : undefined,
    };

    db.ordersList = [newOrder, ...db.ordersList];
    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao processar pedido.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
