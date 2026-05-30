import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

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
    name: 'cachorro quente coreano',
    description: 'temos um novo cachorro quente na área experimente!.',
    price: 22.90,
    category: 'lanche',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&auto=format&fit=crop&q=80',
    extras: [{ id: 'e1', name: 'Calda Extra', price: 2.50 }, { id: 'e2', name: 'Nutella', price: 4.0 }, { id: 'e3', name: 'Granulado', price: 1.5 }],
    isHidden: true,
  },
  {
    id: 3,
    name: 'Hambúrguer Caseiro Duplo',
    description: 'Pão brioche, 2 carnes 150g, queijo cheddar, alface e bacon.',
    price: 32.00,
    category: 'Lanches',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    extras: [{ id: 'e4', name: 'Bacon Extra', price: 4.5 }, { id: 'e5', name: 'Queijo Extra', price: 3.0 }],
    isHidden: false,
  },
  { id: 2, name: 'SorveTudo de Chocolate', description: 'Três bolas de chocolate, calda e granulado.', price: 18.50, category: 'Sorvetes', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&auto=format&fit=crop&q=80', isHidden: false },
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

// -------------------------------------------------------------------------
// Persistência em arquivo JSON (sobrevive a reinicializações do servidor)
// -------------------------------------------------------------------------

const DATA_FILE = path.join(process.cwd(), "data", "db.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadFromDisk(): GlobalDb | null {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw) as GlobalDb;
    }
  } catch (e) {
    console.error("[db] Falha ao ler db.json, usando dados iniciais:", e);
  }
  return null;
}

export function saveToDisk(data: GlobalDb) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[db] Falha ao salvar db.json:", e);
  }
}

// Inicializa singleton na memória global do processo (para hot-reload do Next.js dev)
const globalForDb = globalThis as unknown as { db: GlobalDb };

if (!globalForDb.db) {
  const persisted = loadFromDisk();

  // Se houver dados persistidos válidos por campo, carrega-os; caso contrário, usa o padrão
  globalForDb.db = {
    categoriesSet: persisted?.categoriesSet && Array.isArray(persisted.categoriesSet) && persisted.categoriesSet.length > 0
      ? persisted.categoriesSet
      : [...INITIAL_CATEGORIES],
    // Sempre usa os dados persistidos; INITIAL_PRODUCTS é apenas para primeira inicialização sem dados
    productsList: persisted?.productsList && Array.isArray(persisted.productsList) && persisted.productsList.length > 0
      ? persisted.productsList
      : [...INITIAL_PRODUCTS],
    storeOpenStatus: persisted?.storeOpenStatus !== undefined
      ? persisted.storeOpenStatus
      : true,
    storeSettings: persisted?.storeSettings && persisted.storeSettings.bannerTitle
      ? persisted.storeSettings
      : {
        bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
        bannerTitle: 'um sorvete bom de verdade',
        bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
      },
    ordersList: persisted?.ordersList && Array.isArray(persisted.ordersList)
      ? persisted.ordersList
      : []
  };
}

export const db = globalForDb.db;

// Funções assíncronas de integração com Supabase
export async function getDb(): Promise<GlobalDb> {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "menu_db")
      .maybeSingle();

    if (error) {
      console.error("[supabase db] Erro ao buscar menu_db:", error);
    } else if (data && data.value) {
      const persisted = data.value as any;
      // Sincroniza o singleton local na memória do processo e retorna
      // Supabase tem dados: usa diretamente sem sobrescrever com INITIAL_PRODUCTS
      globalForDb.db = {
        categoriesSet: persisted.categoriesSet && Array.isArray(persisted.categoriesSet) && persisted.categoriesSet.length > 0
          ? persisted.categoriesSet
          : [...INITIAL_CATEGORIES],
        productsList: persisted.productsList && Array.isArray(persisted.productsList) && persisted.productsList.length > 0
          ? persisted.productsList
          : [...INITIAL_PRODUCTS],
        storeOpenStatus: persisted.storeOpenStatus !== undefined
          ? persisted.storeOpenStatus
          : true,
        storeSettings: persisted.storeSettings && persisted.storeSettings.bannerTitle
          ? persisted.storeSettings
          : {
            bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
            bannerTitle: 'O Melhor Sorvete da Cidade',
            bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
          },
        ordersList: persisted.ordersList && Array.isArray(persisted.ordersList)
          ? persisted.ordersList
          : []
      };
      return globalForDb.db;
    }
  } catch (e) {
    console.error("[supabase db] Exceção ao buscar do Supabase:", e);
  }

  // Fallback para os dados em memória ou do disco local
  const localPersisted = loadFromDisk() ?? globalForDb.db;
  return localPersisted;
}

export async function saveDb(data: GlobalDb): Promise<void> {
  // Atualiza localmente
  globalForDb.db = data;
  saveToDisk(data);

  try {
    const { error } = await supabase
      .from("store_settings")
      .upsert({
        key: "menu_db",
        value: data as any,
        description: "Estado completo do cardápio e pedidos"
      }, { onConflict: "key" });

    if (error) {
      console.error("[supabase db] Erro ao salvar no Supabase:", error);
    }
  } catch (e) {
    console.error("[supabase db] Exceção ao salvar no Supabase:", e);
  }
}
