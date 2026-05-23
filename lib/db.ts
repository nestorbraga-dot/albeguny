import crypto from "crypto";

// Tipos de dados idênticos ao do frontend
export type Size = {
  id: string;
  name: string;
  price: number;
};

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type Product = {
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

export type StoreSettings = {
  bannerImage: string;
  bannerTitle: string;
  bannerDescription: string;
};

export type Order = {
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

// Banco de dados em memória inicial
export const INITIAL_CATEGORIES = ['Sorvetes', 'Lanches', 'Bebidas', 'Sobremesas'];

export const INITIAL_PRODUCTS: Product[] = [
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

export interface GlobalDb {
  categoriesSet: string[];
  productsList: Product[];
  storeOpenStatus: boolean;
  storeSettings: StoreSettings;
  ordersList: Order[];
}

const globalForDb = globalThis as unknown as { db: GlobalDb };

if (!globalForDb.db) {
  globalForDb.db = {
    categoriesSet: [...INITIAL_CATEGORIES],
    productsList: [...INITIAL_PRODUCTS],
    storeOpenStatus: true,
    storeSettings: {
      bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
      bannerTitle: 'O Melhor Sorvete da Cidade',
      bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
    },
    ordersList: []
  };
}

export const db = globalForDb.db;
