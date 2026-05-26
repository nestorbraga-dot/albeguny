"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, IceCream, Search, Plus, X, Minus, ClipboardList, Home as HomeIcon, Monitor } from 'lucide-react';

const INITIAL_CATEGORIES = ['Sorvetes', 'Lanches', 'Bebidas', 'Sobremesas'];

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

type CartItem = {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedExtras: Extra[];
  selectedSize?: Size;
};

type Order = {
  id: string;
  orderNumber: string;
  items: CartItem[];
  total: number;
  status: 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: 'DINHEIRO' | 'CARTAO' | 'PIX';
  deliveryType: 'BALCAO' | 'MESA';
  tableNumber?: string;
};

// Next.js Image Component Replacement for pure React Vite compatibility
function Image({ src, alt, className, fill }: { src: string; alt: string; className?: string; fill?: boolean }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`${className || ''} ${fill ? 'absolute inset-0 w-full h-full object-cover' : 'object-cover'}`}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

interface LojaProps {
  onNavigateToView?: (view: 'store' | 'kitchen' | 'admin') => void;
}

export default function Loja({ onNavigateToView }: LojaProps) {
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'orders'>('menu');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_categories');
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    }
    return INITIAL_CATEGORIES;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_products');
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    }
    return INITIAL_PRODUCTS;
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<{orderNumber: string} | null>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tempExtras, setTempExtras] = useState<Extra[]>([]);
  const [tempSize, setTempSize] = useState<Size | undefined>(undefined);
  const [tempQuantity, setTempQuantity] = useState(1);

  const [customerName, setCustomerName] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_customer');
      if (saved) {
        try { return JSON.parse(saved).name || ''; } catch { return ''; }
      }
    }
    return '';
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_customer');
      if (saved) {
        try { return JSON.parse(saved).phone || ''; } catch { return ''; }
      }
    }
    return '';
  });
  const [paymentMethod, setPaymentMethod] = useState<'DINHEIRO' | 'CARTAO' | 'PIX'>('PIX');
  const [deliveryType, setDeliveryType] = useState<'BALCAO' | 'MESA'>('BALCAO');
  const [tableNumber, setTableNumber] = useState('');
  const [storeOpen, setStoreOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_store_status');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
    bannerTitle: 'Cardápio Digital - Albeguny',
    bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
  });

  const [myOrders, setMyOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_orders');
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });

  useEffect(() => {
    // Carrega dados iniciais da API
    const loadApiData = async () => {
      try {
        const [resCats, resProds, resStatus, resSettings] = await Promise.all([
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/products').then(r => r.json()),
          fetch('/api/store-status').then(r => r.json()),
          fetch('/api/settings').then(r => r.json())
        ]);
        
        if (resCats) {
          setCategories(resCats);
          localStorage.setItem('sorvefood_categories', JSON.stringify(resCats));
        }
        if (resProds) {
          setProducts(resProds);
          localStorage.setItem('sorvefood_products', JSON.stringify(resProds));
        }
        if (resStatus && typeof resStatus.status === 'boolean') {
          setStoreOpen(resStatus.status);
          localStorage.setItem('sorvefood_store_status', JSON.stringify(resStatus.status));
        }
        if (resSettings) {
          setStoreSettings(resSettings);
          localStorage.setItem('sorvefood_store_settings', JSON.stringify(resSettings));
        }
      } catch (e) {
        console.warn("Sem conexão direta com servidor local - usando cache", e);
      }
    };
    loadApiData();

    // Sincronização via localStorage se as abas atualizarem localmente
    const handleCatsChange = (e: StorageEvent) => {
      if (e.key === 'sorvefood_categories') {
        const updated = localStorage.getItem('sorvefood_categories');
        if (updated) setCategories(JSON.parse(updated));
      }
      if (e.key === 'sorvefood_store_settings') {
        const updated = localStorage.getItem('sorvefood_store_settings');
        if (updated) setStoreSettings(JSON.parse(updated));
      }
      if (e.key === 'sorvefood_store_status') {
        const updated = localStorage.getItem('sorvefood_store_status');
        if (updated) setStoreOpen(JSON.parse(updated));
      }
    };
    window.addEventListener('storage', handleCatsChange);

    return () => {
      window.removeEventListener('storage', handleCatsChange);
    };
  }, []);

  useEffect(() => {
    const handleProductsChange = (e: StorageEvent) => {
      if (e.key === 'sorvefood_products') {
        const updated = localStorage.getItem('sorvefood_products');
        if (updated) setProducts(JSON.parse(updated));
      }
    };
    window.addEventListener('storage', handleProductsChange);

    return () => window.removeEventListener('storage', handleProductsChange);
  }, []);

  useEffect(() => {
    const handleSyncOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const serverOrders: Order[] = await res.json();
        if (serverOrders && Array.isArray(serverOrders)) {
          // Mantém as ordens do usuário do servidor atualizadas no localStorage
          setMyOrders(prev => {
            const updated = serverOrders.filter(so => 
              prev.some(po => po.orderNumber === so.orderNumber)
            );
            if (updated.length > 0) {
              const ids = updated.map(u => u.orderNumber);
              const remaining = prev.filter(p => !ids.includes(p.orderNumber));
              const combined = [...updated, ...remaining];
              localStorage.setItem('sorvefood_orders', JSON.stringify(combined));
              return combined;
            }
            return prev;
          });
        }
      } catch (e) {
        // Fallback para ler do localStorage
        const saved = localStorage.getItem('sorvefood_orders');
        if (saved) {
          try { setMyOrders(JSON.parse(saved)); } catch (err) {}
        }
      }
    };

    handleSyncOrders();

    const interval = setInterval(handleSyncOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => {
    const basePrice = item.selectedSize ? item.selectedSize.price : item.product.price;
    return acc + ((basePrice + item.selectedExtras.reduce((sum, ext) => sum + ext.price, 0)) * item.quantity);
  }, 0);

  const filteredProducts = products.filter(product => {
    if (product.isHidden) return false;
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openProductCustomization = (product: Product) => {
    setSelectedProduct(product);
    setTempExtras([]);
    setTempSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined);
    setTempQuantity(1);
  };

  const toggleTempExtra = (extra: Extra) => {
    setTempExtras(prev => {
      const exists = prev.find(e => e.id === extra.id);
      if (exists) return prev.filter(e => e.id !== extra.id);
      return [...prev, extra];
    });
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    const extrasIds = tempExtras.map(e => e.id).sort().join(',');
    const sizeId = tempSize ? tempSize.id : 'base';
    const cartItemId = `${selectedProduct.id}-${sizeId}-${extrasIds}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + tempQuantity } : item);
      }
      return [...prev, { cartItemId, product: selectedProduct, selectedExtras: tempExtras, selectedSize: tempSize, quantity: tempQuantity }];
    });
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const handleAppCheckout = async () => {
    if (cartItems.length === 0 || !customerName.trim()) return;
    if (deliveryType === 'MESA' && !tableNumber.trim()) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod,
          deliveryType,
          tableNumber: deliveryType === 'MESA' ? tableNumber.trim() : undefined,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || "Erro ao realizar pedido.");
        return;
      }

      const data = await response.json();
      if (data.success && data.order) {
        const validatedOrder: Order = data.order;
        
        localStorage.setItem('sorvefood_customer', JSON.stringify({ name: customerName.trim(), phone: customerPhone.trim() }));
        setMyOrders(prev => {
          const updated = [validatedOrder, ...prev];
          localStorage.setItem('sorvefood_orders', JSON.stringify(updated));
          return updated;
        });
        setOrderSuccessMsg({ orderNumber: validatedOrder.orderNumber });
        setCartItems([]);
        setActiveTab('orders');
      }
    } catch (e) {
      console.error("Erro de checkout:", e);
      alert("Não foi possível enviar o seu pedido ao servidor. Verifique sua conexão.");
    }
  };

  const simulateOrderStatusChange = (orderNumber: string) => {
    setMyOrders(prev => {
      const updated = prev.map(order => {
        if (order.orderNumber === orderNumber) {
          if (order.status === 'PREPARANDO') return { ...order, status: 'PRONTO' as const };
          if (order.status === 'PRONTO') return { ...order, status: 'ENTREGUE' as const };
        }
        return order;
      });
      localStorage.setItem('sorvefood_orders', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-28">
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-30 bg-white shadow-xs border-b border-neutral-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-2xl">
            <IceCream size={26} /> Doce Sabor
          </div>
          {/* Foco na limpeza: Removido botão de atalho de cozinha do cabeçalho do cliente */}
        </div>
      </header>

      {/* CONTEÚDOS DAS ABAS */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        
        {/* ABA: CARDÁPIO */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <section className="relative rounded-3xl p-6 text-white overflow-hidden shadow-xs min-h-[160px] flex items-center bg-amber-500">
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                <Image src={storeSettings.bannerImage} alt="Banner" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/45" />
              </div>
              <div className="relative z-10 max-w-sm">
                <h1 className="text-2xl md:text-3xl font-extrabold mb-1 text-amber-500">{storeSettings.bannerTitle}</h1>
                <p className="text-white/90 text-sm">{storeSettings.bannerDescription}</p>
              </div>
            </section>

            {/* Busca */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar sorvetes, lanches, sobremesas..."
                className="w-full bg-white border border-neutral-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:border-amber-500"
              />
            </div>

            {/* Categorias */}
            <section>
              <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
                {['Todos', ...categories].map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all text-xs ${
                      activeCategory === category 
                        ? 'bg-amber-500 text-white shadow-xs' 
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* Produtos */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProducts.map(product => {
                const available = product.isAvailable !== false;
                return (
                  <div 
                    key={product.id} 
                    className={`bg-white rounded-2xl p-3 shadow-xs transition-shadow border border-neutral-200/80 flex gap-4 overflow-hidden items-center relative ${available ? 'hover:shadow-md cursor-pointer' : 'opacity-60 grayscale cursor-not-allowed'}`} 
                    onClick={() => available && openProductCustomization(product)}
                  >
                    {!available && (
                       <div className="absolute top-2 left-2 bg-neutral-800 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-wider z-10 shadow-xs">ESGOTADO</div>
                    )}
                    <div className="relative h-20 w-20 shrink-0 bg-neutral-100 rounded-xl overflow-hidden shadow-inner">
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                    <div className="flex flex-col flex-1 py-1 pr-2">
                      <h3 className="font-bold text-sm leading-tight mb-1">{product.name}</h3>
                      <p className="text-neutral-500 text-xs mb-2 line-clamp-2 leading-tight">{product.description}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className={`font-extrabold text-sm ${available ? 'text-neutral-900' : 'text-neutral-500'}`}>
                           {product.sizes && product.sizes.length > 0 ? `a partir de R$ ${Math.min(...product.sizes.map(s => s.price)).toFixed(2).replace('.', ',')}` : `R$ ${product.price.toFixed(2).replace('.', ',')}`}
                        </span>
                        {available && <div className="bg-amber-50 text-amber-600 p-1 rounded-md"><Plus size={14} /></div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Rodapé discreto e profissional para acesso do lojista */}
            {onNavigateToView && (
              <div className="text-center pt-8 pb-4 border-t border-neutral-200/50 mt-12 bg-neutral-55 rounded-2xl p-4">
                <p className="text-neutral-400 text-[11px] font-sans">© 2026 Doce Sabor App - Cardápio & Delivery Online.</p>
                <button 
                  onClick={() => onNavigateToView('admin')} 
                  className="text-neutral-500 hover:text-amber-500 transition-colors text-[11px] font-mono mt-1.5 underline cursor-pointer"
                >
                  Área do Lojista
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA: CARRINHO */}
        {activeTab === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ShoppingCart className="text-amber-500"/> MEU carrinho</h2>
            
            <div className="space-y-4">
               {cartItems.map(item => (
                 <div key={item.cartItemId} className="bg-white p-4 rounded-3xl shadow-xs border border-neutral-200 flex gap-4 items-center">
                   <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 shadow-inner">
                     <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-start mb-1">
                       <p className="font-bold text-sm leading-tight pr-2">{item.product.name}</p>
                       <button onClick={() => removeFromCart(item.cartItemId)} className="text-neutral-400 hover:text-amber-500 bg-neutral-50 rounded-full p-1">
                         <X size={14} />
                       </button>
                     </div>
                     {item.selectedSize && <p className="text-xs text-neutral-500 mb-0.5">Tamanho: {item.selectedSize.name}</p>}
                     {item.selectedExtras.length > 0 && <p className="text-xs text-neutral-500 mb-2">Com: {item.selectedExtras.map(e => e.name).join(', ')}</p>}
                     <div className="flex justify-between items-center mt-2">
                       <p className="font-bold text-amber-500 text-base">R$ {(((item.selectedSize ? item.selectedSize.price : item.product.price) + item.selectedExtras.reduce((s,e)=>s+e.price,0))*item.quantity).toFixed(2).replace('.', ',')}</p>
                       <div className="flex items-center gap-3">
                         <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200"><Minus size={14}/></button>
                         <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-7 h-7 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200"><Plus size={14}/></button>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
               {cartItems.length === 0 && (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-300">
                   <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300"><ShoppingCart size={24}/></div>
                   <p className="text-neutral-500 font-medium font-display">Seu carrinho está vazio!</p>
                   <button onClick={() => setActiveTab('menu')} className="text-amber-500 font-bold mt-2 text-xs hover:underline">Adicionar itens do cardápio</button>
                 </div>
               )}
            </div>

            {cartItems.length > 0 && (
              <div className="bg-white p-6 rounded-3xl shadow-xs border border-neutral-200/80">
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase font-mono tracking-wider">Seu Nome *</label>
                    <input 
                      type="text" 
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Como vamos te chamar?"
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1.5 uppercase font-mono tracking-wider">WhatsApp (Opcional)</label>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="(DD) 99999-9999"
                      className="w-full text-sm border border-neutral-300 rounded-xl px-4 py-3 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="mb-6 space-y-4 pt-4 border-t border-neutral-100">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase font-mono tracking-wider">Como vai receber?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setDeliveryType('BALCAO')}
                        className={`py-3 rounded-xl font-bold border-2 transition-colors text-sm cursor-pointer ${deliveryType === 'BALCAO' ? 'bg-amber-50 text-amber-600 border-amber-500' : 'bg-white text-neutral-500 border-neutral-200 hover:border-amber-300'}`}
                      >
                        No Balcão
                      </button>
                      <button 
                        onClick={() => setDeliveryType('MESA')}
                        className={`py-3 rounded-xl font-bold border-2 transition-colors text-sm cursor-pointer ${deliveryType === 'MESA' ? 'bg-amber-50 text-amber-600 border-amber-500' : 'bg-white text-neutral-500 border-neutral-200 hover:border-amber-300'}`}
                      >
                        Na Mesa
                      </button>
                    </div>
                  </div>
                  
                  {deliveryType === 'MESA' && (
                    <div className="animate-in slide-in-from-top-2">
                       <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase font-mono tracking-wider">Número da Mesa *</label>
                       <input 
                         type="text" 
                         value={tableNumber}
                         onChange={e => setTableNumber(e.target.value)}
                         placeholder="Ex: 12"
                         className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-amber-500 bg-amber-50/20"
                       />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase font-mono tracking-wider">Forma de Pagamento</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['PIX', 'CARTAO', 'DINHEIRO'] as const).map(pm => (
                        <button 
                          key={pm}
                          onClick={() => setPaymentMethod(pm)}
                          className={`py-3 rounded-xl font-bold border-2 transition-colors text-xs cursor-pointer ${paymentMethod === pm ? 'bg-green-50 text-green-700 border-green-500' : 'bg-white text-neutral-500 border-neutral-200 hover:border-green-300'}`}
                        >
                          {pm === 'CARTAO' ? 'Cartão' : pm === 'DINHEIRO' ? 'Dinheiro' : 'PIX'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6 pt-4 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium pt-1">Total do pedido</span>
                  <span className="text-2xl font-black text-neutral-900 font-display">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <button 
                  onClick={handleAppCheckout} 
                  disabled={!customerName.trim() || !storeOpen || (deliveryType === 'MESA' && !tableNumber.trim())}
                  className="w-full bg-amber-500 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white hover:bg-amber-600 font-bold py-4 rounded-2xl transition-colors shadow-lg cursor-pointer"
                >
                  {!storeOpen ? 'Loja Fechada' : 'Confirmar e Pedir'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA: HISTÓRICO DE PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ClipboardList className="text-amber-500"/> Seus Pedidos</h2>
             <div className="space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-300">
                   <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300"><ClipboardList size={24}/></div>
                   <p className="text-neutral-500 font-medium">Você ainda não fez nenhum pedido.</p>
                </div>
              ) : myOrders.map(order => (
                <div key={order.orderNumber} className="bg-white rounded-3xl p-5 shadow-xs border border-neutral-200/60">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-100">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono font-bold block">Nº DO PEDIDO</span>
                      <span className="font-extrabold text-lg text-amber-500">#{order.orderNumber}</span>
                    </div>
                    <span 
                      className={`text-xs px-3.5 py-1.5 rounded-full font-bold tracking-tight border ${
                        order.status === 'PREPARANDO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        order.status === 'PRONTO' ? 'bg-green-50 text-green-600 border-green-200' :
                        'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                    >
                      {order.status === 'PREPARANDO' ? '🍳 Preparando...' : order.status === 'PRONTO' ? '✅ Retirar no Balcão' : '📦 Entregue'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {order.items.map(item => (
                      <div key={item.cartItemId} className="flex justify-between text-sm">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-neutral-400">{item.quantity}x</span>
                          <span className="text-neutral-700 font-medium">
                            {item.product.name} {item.selectedSize && `(${item.selectedSize.name})`}
                            {item.selectedExtras.length > 0 && <span className="block text-xs text-neutral-400 font-normal">Com {item.selectedExtras.map(e => e.name).join(', ')}</span>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-start pt-4 border-t border-neutral-100 gap-4">
                    <span className="text-neutral-400 text-xs font-sans leading-tight">
                      {order.status === 'PREPARANDO' && 'Seu pedido já está em preparação na nossa cozinha!'}
                      {order.status === 'PRONTO' && 'Oba! Seu pedido está pronto para ser retirado.'}
                      {order.status === 'ENTREGUE' && 'Processo finalizado. Bom apetite!'}
                    </span>
                    <span className="font-bold text-neutral-900 text-lg shrink-0">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* FLOAT BOTTOM NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
         <div className="bg-neutral-950/95 shadow-2xl rounded-full p-2 flex justify-between items-center border border-white/10 backdrop-blur-md">
            
            <button 
              onClick={() => { setActiveTab('menu'); setOrderSuccessMsg(null); }}
              className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-full transition-all duration-300 cursor-pointer ${activeTab === 'menu' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
               <HomeIcon size={18} className={activeTab === 'menu' ? 'mb-0.5' : ''}/>
               {activeTab === 'menu' && <span className="text-[10px] font-bold font-display">Cardápio</span>}
            </button>
            
            <button 
              onClick={() => { setActiveTab('cart'); setOrderSuccessMsg(null); }}
              className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-full transition-all duration-300 relative cursor-pointer ${activeTab === 'cart' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
               <div className="relative">
                 <ShoppingCart size={18} className={activeTab === 'cart' ? 'mb-0.5' : ''}/>
                 {cartCount > 0 && activeTab !== 'cart' && (
                   <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-neutral-900">
                     {cartCount}
                   </span>
                 )}
               </div>
               {activeTab === 'cart' && <span className="text-[10px] font-bold font-display">Carrinho</span>}
            </button>
            
            <button 
              onClick={() => { setActiveTab('orders'); setOrderSuccessMsg(null); }}
              className={`flex-1 flex flex-col items-center justify-center p-2.5 rounded-full transition-all duration-300 relative cursor-pointer ${activeTab === 'orders' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
               <div className="relative">
                   <ClipboardList size={18} className={activeTab === 'orders' ? 'mb-0.5' : ''}/>
                   {myOrders.filter(o => o.status !== 'ENTREGUE').length > 0 && activeTab !== 'orders' && (
                     <span className="absolute -top-0.5 -right-0.5 bg-amber-500 w-2 h-2 rounded-full border border-neutral-900"></span>
                   )}
               </div>
               {activeTab === 'orders' && <span className="text-[10px] font-bold font-display">Pedidos</span>}
            </button>
            
         </div>
      </div>

      {/* MODAL ADICIONAIS DE PRODUTO */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 bg-white/90 p-2 rounded-full text-neutral-600 hover:text-black shadow-sm backdrop-blur-xs cursor-pointer"><X size={16} /></button>
            <div className="overflow-y-auto overflow-x-hidden w-full flex-1">
              <div className="relative h-44 w-full bg-neutral-100 shrink-0 overflow-hidden shadow-inner">
                <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-cover" />
              </div>
              
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1 leading-tight">{selectedProduct.name}</h2>
                <p className="text-neutral-500 text-xs mb-6Leading-tight">{selectedProduct.description}</p>
              
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-extrabold text-neutral-900 mb-3 text-xs uppercase font-mono tracking-wider">Escolha o Tamanho</h3>
                  <div className="space-y-2">
                    {selectedProduct.sizes.map(size => {
                      const isSelected = tempSize?.id === size.id;
                      return (
                        <div key={size.id} onClick={() => setTempSize(size)} className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-50/30' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'border-amber-500' : 'border-neutral-300'}`}>
                              {isSelected && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                            </div>
                            <span className="font-medium text-xs text-neutral-700">{size.name}</span>
                          </div>
                          <span className={`font-bold text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-500'}`}>R$ {size.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-extrabold text-neutral-900 mb-3 text-xs uppercase font-mono tracking-wider">Turbine seu pedido</h3>
                  <div className="space-y-2">
                    {selectedProduct.extras.map(ex => {
                      const isSelected = tempExtras.some(e => e.id === ex.id);
                      return (
                        <div key={ex.id} onClick={() => toggleTempExtra(ex)} className={`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'border-amber-500 bg-amber-50/30' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-neutral-300'}`}>
                              {isSelected && <X size={10} className="text-white" style={{ transform: 'rotate(45deg)' }} />}
                            </div>
                            <span className="font-medium text-xs text-neutral-700">{ex.name}</span>
                          </div>
                          <span className={`font-bold text-xs ${isSelected ? 'text-amber-600' : 'text-neutral-500'}`}>+R$ {ex.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 mb-2">
                <span className="font-bold text-xs text-neutral-700">Quantidade</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setTempQuantity(q => Math.max(1, q-1))} className="w-8 h-8 flex items-center justify-center border border-neutral-200 shadow-xs rounded-lg bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"><Minus size={14}/></button>
                  <span className="w-4 text-center font-black text-sm">{tempQuantity}</span>
                  <button onClick={() => setTempQuantity(q => q+1)} className="w-8 h-8 flex items-center justify-center border border-neutral-200 shadow-xs rounded-lg bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"><Plus size={14}/></button>
                </div>
              </div>
            </div>
            </div>
            
            <div className="p-4 border-t border-neutral-100 shrink-0 bg-white sm:rounded-b-3xl">
              <button 
                onClick={confirmAddToCart} 
                className="w-full bg-amber-500 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-between px-6 cursor-pointer text-sm"
                disabled={!storeOpen}
              >
                <span>{!storeOpen ? 'Fechado' : 'Adicionar ao Carrinho'}</span>
                <span>R$ {(((tempSize ? tempSize.price : selectedProduct.price) + tempExtras.reduce((s,e)=>s+e.price,0))*tempQuantity).toFixed(2).replace('.', ',')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL (GERAÇÃO DE SENHA) */}
      {orderSuccessMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs" onClick={() => setOrderSuccessMsg(null)} />
           <div className="relative bg-white p-7 rounded-3xl text-center z-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-neutral-100">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                 <ClipboardList size={28} />
                 <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold" style={{transform: 'rotate(45deg)'}}>+</span>
                 </div>
              </div>
              <h2 className="text-xl font-bold mb-1 text-neutral-900">Pedido na Cozinha!</h2>
              <p className="mb-4 text-xs text-neutral-500">Sua senha de retirada é:</p>
              
              <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-2xl py-4 mb-6">
                 <h1 className="text-4xl font-black text-amber-500 tracking-wider">#{orderSuccessMsg.orderNumber}</h1>
              </div>
              
              <button 
                onClick={() => setOrderSuccessMsg(null)} 
                className="w-full bg-neutral-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-colors cursor-pointer text-sm"
              >
                Acompanhar Fila
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
