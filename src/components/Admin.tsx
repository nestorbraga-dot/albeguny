"use client";
import React, { useState, useEffect } from 'react';
import { Settings, Edit2, Trash2, Plus, Image as ImageIcon, Save, X, PlusCircle, Lock, Store, LayoutGrid, BarChart3, TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';

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

type Order = {
  id: string;
  orderNumber: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  deliveryType: string;
  tableNumber?: string;
};

const INITIAL_CATEGORIES = ['Sorvetes', 'Lanches', 'Bebidas', 'Sobremesas'];

interface AdminProps {
  onNavigateToView?: (view: 'store' | 'kitchen' | 'admin') => void;
}

export default function Admin({ onNavigateToView }: AdminProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sorvefood_admin_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = 'realsalarios()*';
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sorvefood_admin_auth', 'true');
      }
    } else {
      alert('Senha incorreta');
    }
  };
  
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'stats' | 'settings'>('products');
  const [storeOpen, setStoreOpen] = useState(true);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    bannerImage: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=1200&auto=format&fit=crop&q=80',
    bannerTitle: 'O Melhor Sorvete da Cidade',
    bannerDescription: 'Sabor artesanal, ingredientes frescos e muito amor na receita.'
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadAllAdminData = async () => {
      try {
        const [resCats, resProds, resStatus, resSettings, resOrders] = await Promise.all([
          fetch('/api/categories').then(r => r.json()),
          fetch('/api/products?t=' + Date.now(), { method: 'GET', cache: 'no-store' }).then(r => r.json()),
          fetch('/api/store-status').then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
          fetch('/api/orders').then(r => r.json())
        ]);

        if (resCats) setCategories(resCats);
        if (resProds) {
          setProducts(resProds);
          localStorage.setItem('sorvefood_products', JSON.stringify(resProds));
        }
        if (resStatus && typeof resStatus.status === 'boolean') setStoreOpen(resStatus.status);
        if (resSettings) setStoreSettings(resSettings);
        if (resOrders) setOrders(resOrders);
      } catch (e) {
        console.warn("Offline ou sem conexão de rede com a API de administração", e);
        const savedCats = localStorage.getItem('sorvefood_categories');
        if (savedCats) setCategories(JSON.parse(savedCats));
        const savedProds = localStorage.getItem('sorvefood_products');
        if (savedProds) setProducts(JSON.parse(savedProds));
        const savedStatus = localStorage.getItem('sorvefood_store_status');
        if (savedStatus) setStoreOpen(JSON.parse(savedStatus));
        const savedSettings = localStorage.getItem('sorvefood_store_settings');
        if (savedSettings) setStoreSettings(JSON.parse(savedSettings));
        const savedOrders = localStorage.getItem('sorvefood_orders');
        if (savedOrders) setOrders(JSON.parse(savedOrders));
      }
    };

    loadAllAdminData();

    const interval = setInterval(async () => {
      try {
        const resOrders = await fetch('/api/orders').then(r => r.json());
        if (resOrders) setOrders(resOrders);
      } catch (err) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const toggleStoreStatus = async () => {
    const newState = !storeOpen;
    setStoreOpen(newState);
    localStorage.setItem('sorvefood_store_status', JSON.stringify(newState));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sorvefood_store_status' }));

    try {
      await fetch('/api/store-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newState })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addCategory = async () => {
    const newCat = window.prompt("Nome da nova Categoria:");
    if (newCat && newCat.trim()) {
      const updated = [...new Set([...categories, newCat.trim()])];
      setCategories(updated);
      localStorage.setItem('sorvefood_categories', JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: 'sorvefood_categories' }));

      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteCategory = async (cat: string) => {
    if (window.confirm(`Remover categoria "${cat}"? (Os produtos continuarão existindo mas sem essa categoria associada)`)) {
      const updated = categories.filter(c => c !== cat);
      setCategories(updated);
      localStorage.setItem('sorvefood_categories', JSON.stringify(updated));
      window.dispatchEvent(new StorageEvent('storage', { key: 'sorvefood_categories' }));

      try {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveProducts = async (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('sorvefood_products', JSON.stringify(newProducts));
    window.dispatchEvent(new StorageEvent('storage', { key: 'sorvefood_products' }));

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProducts)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleProductAvailability = (id: number) => {
    const updated = products.map(p => p.id === id ? { ...p, isAvailable: p.isAvailable === false ? true : false } : p);
    saveProducts(updated);
  };

  const toggleProductVisibility = (id: number) => {
    const updated = products.map(p => p.id === id ? { ...p, isHidden: p.isHidden === true ? false : true } : p);
    saveProducts(updated);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct({ ...product }); 
    if (product.extras) {
        setEditingProduct(prev => prev ? { ...prev, extras: [...product.extras!] } : null);
    }
    if (product.sizes) {
        setEditingProduct(prev => prev ? { ...prev, sizes: [...product.sizes!] } : null);
    }
  };

  const handleDeleteClick = (id: number) => {
    if (window.confirm("Certeza que deseja remover este produto definitivamente?")) {
      const updated = products.filter(p => p.id !== id);
      saveProducts(updated);
    }
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Date.now(),
      name: 'Novo Produto',
      description: 'Breve descrição do sorvete ou adicional',
      price: 15.00,
      category: categories[0] || 'Sorvetes',
      image: 'https://images.unsplash.com/photo-1501443715934-62e42b298451?w=400&auto=format&fit=crop&q=80',
      extras: [],
      sizes: [],
      isAvailable: true
    };
    setEditingProduct(newProduct);
  };

  const handleSaveModal = () => {
    if (editingProduct) {
      const exists = products.some(p => p.id === editingProduct.id);
      let updated: Product[];
      if (exists) {
        updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
      } else {
        updated = [...products, editingProduct];
      }
      saveProducts(updated);
      setEditingProduct(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-neutral-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-neutral-800 font-display">Painel Admin</h1>
          <p className="text-neutral-500 mb-6 text-xs">Digite a senha administrativa para configurar o cardápio e ver os relatórios.</p>
          <input 
            type="password" 
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 mb-4 focus:outline-hidden focus:border-amber-500 text-center text-sm font-mono"
            placeholder="Senha"
            autoFocus
          />
          <div className="flex gap-2">
            {onNavigateToView && (
              <button 
                type="button" 
                onClick={() => onNavigateToView('store')}
                className="flex-1 bg-neutral-100 hover:bg-neutral-250 text-neutral-600 font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors text-xs cursor-pointer">
               Acessar
            </button>
          </div>
        </form>
      </div>
    );
  }

  const totalRevenue = orders.filter(o => o.status === 'ENTREGUE').reduce((acc, o) => acc + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.status !== 'ENTREGUE').length;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans pb-20">
      <header className="bg-amber-500 text-white shadow-md p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Settings size={28} />
            <span className="text-xl font-extrabold tracking-tight font-display">ADMIN & CONTROLES</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleStoreStatus}
              className={`flex items-center gap-1 px-3.5 py-2 rounded-full font-bold text-xs transition-colors border shadow-xs cursor-pointer ${storeOpen ? 'bg-green-600 border-green-400 hover:bg-green-700' : 'bg-red-600 border-red-400 hover:bg-red-700'}`}
            >
              <Store size={14} />
              {storeOpen ? 'Loja Aberta' : 'Loja Pausada'}
            </button>
            <div className="h-6 w-px bg-amber-400/80 mx-1"></div>
            {onNavigateToView && (
              <div className="flex items-center gap-3 text-xs font-bold">
                <button onClick={() => onNavigateToView('store')} className="text-amber-100 hover:text-white transition-colors cursor-pointer">Loja Cliente</button>
                <span className="text-amber-300">|</span>
                <button onClick={() => onNavigateToView('kitchen')} className="text-amber-100 hover:text-white transition-colors cursor-pointer">Ver Cozinha</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* TAB NAVIGATION */}
        <div className="flex gap-1.5 mb-8 bg-white p-2 rounded-2xl shadow-xs border border-neutral-200 inline-flex flex-wrap">
           <button 
             onClick={() => setActiveTab('products')} 
             className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${activeTab === 'products' ? 'bg-amber-500 text-white shadow-xs' : 'text-neutral-500 hover:bg-neutral-50'}`}
           >
             <LayoutGrid size={15} /> Cardápio / Itens
           </button>
           <button 
             onClick={() => setActiveTab('categories')} 
             className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-amber-500 text-white shadow-xs' : 'text-neutral-500 hover:bg-neutral-50'}`}
           >
             <LayoutGrid size={15} /> Categorias
           </button>
           <button 
             onClick={() => setActiveTab('stats')} 
             className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${activeTab === 'stats' ? 'bg-amber-500 text-white shadow-xs' : 'text-neutral-500 hover:bg-neutral-50'}`}
           >
             <BarChart3 size={15} /> Faturamento
           </button>
           <button 
             onClick={() => setActiveTab('settings')} 
             className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${activeTab === 'settings' ? 'bg-amber-500 text-white shadow-xs' : 'text-neutral-500 hover:bg-neutral-50'}`}
           >
             <Settings size={15} /> Imagem / Banner
           </button>
        </div>

        {activeTab === 'settings' && (
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h1 className="text-xl font-bold mb-4 font-display">Aparência do Banner de Entrada</h1>
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-neutral-200">
               <div className="space-y-4">
                 <div>
                   <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Título do Banner</label>
                   <input 
                     type="text" 
                     value={storeSettings.bannerTitle}
                     onChange={e => setStoreSettings({...storeSettings, bannerTitle: e.target.value})}
                     className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500 text-neutral-900"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Descrição do Banner</label>
                   <textarea 
                     value={storeSettings.bannerDescription}
                     onChange={e => setStoreSettings({...storeSettings, bannerDescription: e.target.value})}
                     className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500 text-neutral-900 h-16 resize-none"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">URL da Imagem de Fundo</label>
                   <input 
                     type="text" 
                     value={storeSettings.bannerImage}
                     onChange={e => setStoreSettings({...storeSettings, bannerImage: e.target.value})}
                     className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500 text-neutral-900"
                   />
                 </div>
                 <button 
                    onClick={() => {
                      localStorage.setItem('sorvefood_store_settings', JSON.stringify(storeSettings));
                      window.dispatchEvent(new StorageEvent('storage', { key: 'sorvefood_store_settings' }));
                      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(storeSettings) }).catch(e => console.error(e));
                       alert('As alterações foram salvas com sucesso! Atualize a aba do cliente para visualizar.');
                    }}
                   className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-xs cursor-pointer text-xs"
                 >
                   Salvar Imagem e Textos
                 </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-bold font-display">Itens do Cardápio</h1>
              <button 
                onClick={handleAddProduct}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer text-xs"
              >
                <Plus size={16} /> Novo Produto
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xs border border-neutral-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4 w-16">Foto</th>
                      <th className="p-4">Nome / Detalhe</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Preço Base</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b border-neutral-150 hover:bg-neutral-50 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 bg-neutral-100 rounded-xl overflow-hidden relative border shadow-inner">
                             <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-neutral-800 leading-tight">{product.name}</p>
                          <p className="text-xs text-neutral-400 truncate max-w-[200px] mt-0.5">{product.description}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700-1 border border-amber-100 rounded-md text-[10px] font-bold">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-neutral-800">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              onClick={() => toggleProductAvailability(product.id)}
                              className={`px-2.5 py-1 rounded-lg transition-colors font-bold text-[10px] cursor-pointer ${product.isAvailable === false ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-250' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                            >
                              {product.isAvailable === false ? 'Esgotado' : 'Disponível'}
                            </button>
                            <button
                              onClick={() => toggleProductVisibility(product.id)}
                              className={`px-2.5 py-1 rounded-lg transition-colors font-bold text-[10px] cursor-pointer ${product.isHidden ? 'bg-neutral-100 text-neutral-500 hover:bg-neutral-250' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-250'}`}
                            >
                              {product.isHidden ? 'Oculto' : 'Visível'}
                            </button>
                            <button 
                              onClick={() => handleEditClick(product)}
                              className="p-1.5 text-neutral-500 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(product.id)}
                              className="p-1.5 text-neutral-550 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-neutral-250"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-400 font-medium">
                          Nenhum produto cadastrado no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-bold font-display">Categorias Cadastradas</h1>
              <button 
                onClick={addCategory}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-3.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer text-xs"
              >
                <Plus size={16} /> Nova Categoria
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-xs border border-neutral-200/85 overflow-hidden divide-y divide-neutral-100">
               {categories.map(cat => (
                 <div key={cat} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                    <span className="font-bold text-neutral-800 text-sm">{cat}</span>
                    <button 
                      onClick={() => deleteCategory(cat)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors bg-white border border-neutral-200 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-5 rounded-3xl shadow-xs border border-neutral-200">
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                     <DollarSign size={20} />
                     <h3 className="font-bold text-xs text-neutral-400 uppercase font-mono tracking-wider">Faturamento Entregue</h3>
                  </div>
                  <p className="text-3xl font-black text-neutral-900 font-display">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
               </div>
               <div className="bg-white p-5 rounded-3xl shadow-xs border border-neutral-200">
                  <div className="flex items-center gap-2 mb-2 text-blue-500">
                     <TrendingUp size={20} />
                     <h3 className="font-bold text-xs text-neutral-400 uppercase font-mono tracking-wider">Total de Pedidos</h3>
                  </div>
                  <p className="text-3xl font-black text-neutral-900 font-display">{orders.length}</p>
               </div>
               <div className="bg-white p-5 rounded-3xl shadow-xs border border-neutral-200">
                  <div className="flex items-center gap-2 mb-2 text-amber-500">
                     <Settings size={20} />
                     <h3 className="font-bold text-xs text-neutral-400 uppercase font-mono tracking-wider">Pedidos Ativos</h3>
                  </div>
                  <p className="text-3xl font-black text-neutral-900 font-display">{pendingOrdersCount}</p>
               </div>
             </div>
             
             <div className="bg-white rounded-3xl shadow-xs border border-neutral-200 p-6">
                <h3 className="font-bold text-sm mb-4 uppercase text-neutral-500 tracking-wider">Últimos Pedidos Processados</h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 text-neutral-400 border-b border-neutral-200 text-xs font-bold uppercase">
                          <th className="p-3">Painel</th>
                          <th className="p-3">Cliente</th>
                          <th className="p-3">Total do Pedido</th>
                          <th className="p-3">Fase</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map(o => (
                          <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                            <td className="p-3 font-bold font-mono">#{o.orderNumber}</td>
                            <td className="p-3">{o.customerName}</td>
                            <td className="p-3 font-bold text-neutral-850">R$ {o.total.toFixed(2).replace('.', ',')}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${o.status === 'ENTREGUE' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-neutral-400 font-medium">Não há registros de pedidos sincronizados.</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs" onClick={() => setEditingProduct(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-neutral-100 shrink-0">
               <h2 className="text-lg font-bold text-neutral-800">
                 {editingProduct.id.toString().length > 6 ? 'Cadastrar Item' : 'Alterar Item'}
               </h2>
               <button onClick={() => setEditingProduct(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 bg-neutral-100 rounded-full cursor-pointer"><X size={16}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
               {/* IMAGE PREVIEW */}
               <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200 shadow-inner">
                     <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                     <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Link da Foto</label>
                     <input 
                       type="text" 
                       value={editingProduct.image} 
                       onChange={e => setEditingProduct({...editingProduct, image: e.target.value})}
                       className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500"
                     />
                  </div>
               </div>

               {/* NOME E PREÇO */}
               <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Nome do Produto</label>
                    <input 
                       type="text" 
                       value={editingProduct.name} 
                       onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                       className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500"
                       placeholder="Ex: Taça Premium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Preço (R$)</label>
                    <input 
                       type="number" 
                       value={editingProduct.price} 
                       onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                       className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500 text-neutral-900 font-mono"
                       step="0.01"
                    />
                  </div>
               </div>

               {/* CATEGORIA E DESCRIÇÃO */}
               <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Categoria</label>
                  <div className="flex gap-2">
                    <select 
                       value={editingProduct.category}
                       onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                       className="flex-1 text-sm border border-neutral-300 rounded-xl px-3 py-2 focus:outline-hidden focus:border-amber-500 text-neutral-900 bg-white"
                     >
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={addCategory} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3.5 rounded-xl font-bold transition-colors text-xs shrink-0 cursor-pointer">
                       + Nova
                    </button>
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-neutral-500 mb-1 uppercase">Descrição Detalhada</label>
                 <textarea 
                    value={editingProduct.description} 
                    onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full text-sm border border-neutral-300 rounded-xl px-3 py-2 h-16 focus:outline-hidden focus:border-amber-500 text-neutral-900 resize-none leading-normal"
                    placeholder="Descrição para seduzir o paladar do cliente..."
                 />
               </div>
               
               {/* TAMANHOS */}
               <div className="border-t border-neutral-100 pt-4 mt-2">
                 <div className="flex justify-between items-center mb-2">
                   <label className="block text-xs font-bold text-neutral-500 uppercase">Tamanhos / Copos / Porções</label>
                   <button 
                     onClick={() => setEditingProduct(prev => prev ? {...prev, sizes: [...(prev.sizes||[]), {id: 's'+Date.now(), name: '', price: 0}]} : prev)}
                     className="text-[10px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                   >
                     <PlusCircle size={12} /> Novo Tamanho
                   </button>
                 </div>
                 
                 <div className="space-y-1.5">
                    {editingProduct.sizes?.map((size, idx) => (
                       <div key={size.id} className="flex gap-2">
                          <input 
                            type="text" 
                            value={size.name}
                            onChange={(e) => {
                              const updatedSizes = [...(editingProduct.sizes || [])];
                              updatedSizes[idx].name = e.target.value;
                              setEditingProduct({...editingProduct, sizes: updatedSizes});
                            }}
                            className="flex-[2] text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:outline-hidden" 
                            placeholder="Ex: Caprichado 500ml"
                          />
                          <input 
                            type="number" 
                            value={size.price}
                            onChange={(e) => {
                              const updatedSizes = [...(editingProduct.sizes || [])];
                              updatedSizes[idx].price = parseFloat(e.target.value) || 0;
                              setEditingProduct({...editingProduct, sizes: updatedSizes});
                            }}
                            className="flex-1 text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:outline-hidden font-mono" 
                            placeholder="R$ Preço"
                            step="0.01"
                          />
                          <button 
                            onClick={() => {
                              const updatedSizes = (editingProduct.sizes || []).filter((_, i) => i !== idx);
                              setEditingProduct({...editingProduct, sizes: updatedSizes});
                            }}
                            className="w-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg shrink-0 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                       </div>
                    ))}
                    {(!editingProduct.sizes || editingProduct.sizes.length === 0) && (
                       <p className="text-[11px] text-neutral-400 italic">Preço fixado no anúncio principal.</p>
                    )}
                 </div>
               </div>
               
               {/* EXTRAS */}
               <div className="border-t border-neutral-100 pt-4 mt-2">
                 <div className="flex justify-between items-center mb-2">
                   <label className="block text-xs font-bold text-neutral-500 uppercase">Acompanhamentos / Adicionais</label>
                   <button 
                     onClick={() => setEditingProduct(prev => prev ? {...prev, extras: [...(prev.extras||[]), {id: 'e'+Date.now(), name: '', price: 0}]} : prev)}
                     className="text-[10px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                   >
                     <PlusCircle size={12} /> Novo Extra
                   </button>
                 </div>
                 
                 <div className="space-y-1.5">
                    {editingProduct.extras?.map((extra, idx) => (
                       <div key={extra.id} className="flex gap-2">
                          <input 
                            type="text" 
                            value={extra.name}
                            onChange={(e) => {
                              const updatedExtras = [...(editingProduct.extras || [])];
                              updatedExtras[idx].name = e.target.value;
                              setEditingProduct({...editingProduct, extras: updatedExtras});
                            }}
                            className="flex-[2] text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:outline-hidden" 
                            placeholder="Ex: Calda de Chocolate"
                          />
                          <input 
                            type="number" 
                            value={extra.price}
                            onChange={(e) => {
                              const updatedExtras = [...(editingProduct.extras || [])];
                              updatedExtras[idx].price = parseFloat(e.target.value) || 0;
                              setEditingProduct({...editingProduct, extras: updatedExtras});
                            }}
                            className="flex-1 text-xs border border-neutral-300 rounded-lg px-2 py-1.5 focus:outline-hidden font-mono" 
                            placeholder="R$ Preço"
                            step="0.01"
                          />
                          <button 
                            onClick={() => {
                              const updatedExtras = (editingProduct.extras || []).filter((_, i) => i !== idx);
                              setEditingProduct({...editingProduct, extras: updatedExtras});
                            }}
                            className="w-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg shrink-0 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                       </div>
                    ))}
                    {(!editingProduct.extras || editingProduct.extras.length === 0) && (
                       <p className="text-[11px] text-neutral-400 italic">Disponível em versão natural básica.</p>
                    )}
                 </div>
               </div>

            </div>

            <div className="p-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
               <button 
                 onClick={handleSaveModal}
                 className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-xs text-sm cursor-pointer"
               >
                  Gravar Item no Cardápio
               </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
