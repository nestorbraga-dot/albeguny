import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// Tipos de dados idênticos ao do frontend
type Size = {
  id: string;
  name: string;
  price: number;
};

type Extra = {
  id: string;
  name: string;
  price: number;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  extras?: Extra[];
  sizes?: Size[];
  isAvailable?: boolean;
  isHidden?: boolean;
};

type StoreSettings = {
  bannerImage: string;
  bannerTitle: string;
  bannerDescription: string;
};

type CartItemInput = {
  productId: number;
  selectedSizeId?: string;
  selectedExtrasIds: string[];
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  items: Array<{
    cartItemId: string;
    product: Product;
    quantity: number;
    selectedExtras: Extra[];
    selectedSize?: Size;
  }>;
  total: number;
  status: 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: 'DINHEIRO' | 'CARTAO' | 'PIX';
  deliveryType: 'BALCAO' | 'MESA';
  tableNumber?: string;
};

// Banco de dados em memória seguro no Servidor (inicializado com os itens originais)
const INITIAL_CATEGORIES = ['Sorvetes', 'Lanches', 'Bebidas', 'Sobremesas'];

const INITIAL_PRODUCTS: Product[] = [
  { 
    id: 1, 
    name: 'Taça de Morango Especial', 
    description: 'Sorvete artesanal com pedaços de morango e chantilly.', 
    price: 22.90, 
    category: 'Sorvetes', 
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&auto=format&fit=crop&q=80',
    extras: [{ id: 'e1', name: 'Calda Extra', price: 2.50 }, { id: 'e2', name: 'Nutella', price: 4.0 }, { id: 'e3', name: 'Granulado', price: 1.5 }]
  },
  { 
    id: 3, 
    name: 'Hambúrguer Caseiro Duplo', 
    description: 'Pão brioche, 2 carnes 150g, queijo cheddar, alface e bacon.', 
    price: 32.00, 
    category: 'Lanches', 
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    extras: [{ id: 'e4', name: 'Bacon Extra', price: 4.5 }, { id: 'e5', name: 'Queijo Extra', price: 3.0 }]
  },
  { id: 2, name: 'SorveTudo de Chocolate', description: 'Três bolas de chocolate, calda e granulado.', price: 18.50, category: 'Sorvetes', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80' },
  { id: 4, name: 'Smashed Burger Simples', description: 'Pão brioche, carne 90g e queijo prato.', price: 19.90, category: 'Lanches', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop&q=80' },
  { id: 5, name: 'Milkshake de Ovomaltine', description: 'Milkshake cremoso de 500ml feito na hora.', price: 16.00, category: 'Bebidas', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80' }
];

let categoriesSet = [...INITIAL_CATEGORIES];
let productsList = [...INITIAL_PRODUCTS];
let storeOpenStatus = true;
let storeSettings: StoreSettings = {
  bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
  bannerTitle: 'O Melhor Sorvete da Cidade',
  bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
};

let ordersList: Order[] = [];

// ================== ENDPOINTS DE API SEGUROS ==================

// Categoria
app.get("/api/categories", (req, res) => {
  res.json(categoriesSet);
});

app.post("/api/categories", (req, res) => {
  const newCats = req.body;
  if (Array.isArray(newCats)) {
    categoriesSet = newCats;
    res.json({ success: true, categories: categoriesSet });
  } else {
    res.status(400).json({ error: "Formato incorreto. Deve ser uma lista de strings." });
  }
});

// Configurações do Banner/Loja
app.get("/api/settings", (req, res) => {
  res.json(storeSettings);
});

app.post("/api/settings", (req, res) => {
  const { bannerImage, bannerTitle, bannerDescription } = req.body;
  if (bannerTitle) {
    storeSettings = { bannerImage, bannerTitle, bannerDescription };
    res.json({ success: true, settings: storeSettings });
  } else {
    res.status(400).json({ error: "Título do banner é obrigatório." });
  }
});

// Status de Loja Aberta/Fechada
app.get("/api/store-status", (req, res) => {
  res.json({ status: storeOpenStatus });
});

app.post("/api/store-status", (req, res) => {
  const { status } = req.body;
  if (typeof status === "boolean") {
    storeOpenStatus = status;
    res.json({ success: true, status: storeOpenStatus });
  } else {
    res.status(400).json({ error: "Status precisa ser um valor booleano." });
  }
});

// Listagem de Produtos
app.get("/api/products", (req, res) => {
  res.json(productsList);
});

app.post("/api/products", (req, res) => {
  const updatedProds = req.body;
  if (Array.isArray(updatedProds)) {
    productsList = updatedProds;
    res.json({ success: true, count: productsList.length });
  } else {
    res.status(400).json({ error: "Formato inválido para atualizar produtos." });
  }
});

// Listagem Geral de Pedidos
app.get("/api/orders", (req, res) => {
  res.json(ordersList);
});

// Mudança de status do pedido
app.put("/api/orders/:orderNumber/status", (req, res) => {
  const { orderNumber } = req.params;
  const { status } = req.body;

  const order = ordersList.find(o => o.orderNumber === orderNumber);
  if (!order) {
    res.status(404).json({ error: "Pedido não localizado." });
    return;
  }

  if (status === "PREPARANDO" || status === "PRONTO" || status === "ENTREGUE") {
    order.status = status;
    res.json({ success: true, order });
  } else {
    res.status(400).json({ error: "Status inválido." });
  }
});

/**
 * CRITICAL / SECURITY AUDIT (OPÇÃO 3):
 * Criação de pedido com validação severa de preços e total no servidor.
 * O cliente envia os itens com as escolhas, o servidor busca do seu próprio
 * catálogo e calcula o valor real, eliminando qualquer alteração feita no cliente.
 */
app.post("/api/orders", (req, res) => {
  if (!storeOpenStatus) {
    res.status(400).json({ error: "A loja está fechada no momento." });
    return;
  }

  const { items, customerName, customerPhone, paymentMethod, deliveryType, tableNumber } = req.body;

  if (!customerName || !customerName.trim()) {
    res.status(400).json({ error: "O nome do cliente é obrigatório." });
    return;
  }

  if (deliveryType === "MESA" && (!tableNumber || !tableNumber.trim())) {
    res.status(400).json({ error: "O número da mesa é obrigatório." });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Nenhum item adicionado ao pedido." });
    return;
  }

  try {
    let orderTotalCalculated = 0;
    const validatedItems = [];

    for (const item of items) {
      // Busca o produto real cadastrado no banco de dados do servidor
      const serverProduct = productsList.find(p => p.id === item.product.id);
      if (!serverProduct) {
        res.status(400).json({ error: `O produto com ID ${item.product.id} não existe mais no cardápio.` });
        return;
      }

      if (serverProduct.isAvailable === false) {
        res.status(400).json({ error: `O produto '${serverProduct.name}' está esgotado no momento.` });
        return;
      }

      // Validação de Tamanho
      let selectedSize: Size | undefined = undefined;
      let itemBasePrice = serverProduct.price;

      if (item.selectedSize) {
        const foundSize = serverProduct.sizes?.find(s => s.id === item.selectedSize.id);
        if (!foundSize) {
          res.status(400).json({ error: `O tamanho selecionado para o produto ${serverProduct.name} é inválido.` });
          return;
        }
        selectedSize = foundSize;
        itemBasePrice = foundSize.price;
      }

      // Validação de Extras
      const validatedExtras: Extra[] = [];
      if (item.selectedExtras && Array.isArray(item.selectedExtras)) {
        for (const ext of item.selectedExtras) {
          const foundExtra = serverProduct.extras?.find(e => e.id === ext.id);
          if (!foundExtra) {
            res.status(400).json({ error: `O adicional '${ext.name}' não é válido para o produto ${serverProduct.name}.` });
            return;
          }
          validatedExtras.push(foundExtra);
        }
      }

      // Calcula o preço total deste item com base estritamente no preço do Servidor
      const extrasSum = validatedExtras.reduce((acc, current) => acc + current.price, 0);
      const unitTotal = itemBasePrice + extrasSum;
      const itemSubtotal = unitTotal * item.quantity;

      orderTotalCalculated += itemSubtotal;

      // Gera o ID do item
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

    // Geração segura do número de pedido de 4 dígitos no servidor
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

    ordersList = [newOrder, ...ordersList];
    res.json({ success: true, order: newOrder });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido ao processar pedido.";
    res.status(500).json({ error: errorMsg });
  }
});

// ================== MIDDLEWARE VITE / ESTÁTICO ==================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ALBETIGUN BACKEND SECURE] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
