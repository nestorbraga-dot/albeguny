"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, CheckCircle, Clock, Package, Check, Trash2, ArrowLeft } from 'lucide-react';

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
  category: string;
};

type CartItem = {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedExtras: Extra[];
  selectedSize?: Size;
};

type Order = {
  orderNumber: string;
  items: CartItem[];
  total: number;
  status: 'PREPARANDO' | 'PRONTO' | 'ENTREGUE';
  createdAt: string;
  id: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  deliveryType: string;
  tableNumber?: string;
};

interface CozinhaProps {
  onNavigateToView?: (view: 'store' | 'kitchen' | 'admin') => void;
}

export default function Cozinha({ onNavigateToView }: CozinhaProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sorvefood_cozinha_auth') === 'true';
    }
    return false;
  });
  const [passwordInput, setPasswordInput] = useState('');
  
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sorvefood_orders');
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  const [soundEnabled, setSoundEnabled] = useState(false);
  const isInitialLoad = useRef(true);
  const prevOrderIds = useRef<string[]>([]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, time: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
         osc.start(time);
         osc.stop(time + dur);
      };
      playTone(523.25, ctx.currentTime, 0.5); // C5
      playTone(659.25, ctx.currentTime + 0.15, 0.5); // E5
    } catch(e) {}
  };

  useEffect(() => {
    const currentIds = orders.map(o => o.id);
    if (isInitialLoad.current) {
        if (orders.length > 0) isInitialLoad.current = false;
        prevOrderIds.current = currentIds;
        return;
    }

    const hasNewOrder = currentIds.some(id => !prevOrderIds.current.includes(id));
    if (hasNewOrder && soundEnabled) {
        playChime();
    }
    prevOrderIds.current = currentIds;
  }, [orders, soundEnabled]);

  // Load from API to keep sync across all browsers and devices
  useEffect(() => {
    const listOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
          localStorage.setItem('sorvefood_orders', JSON.stringify(data));
        }
      } catch (e) {
        // Fallback para ler do localStorage se offline
        const saved = localStorage.getItem('sorvefood_orders');
        if (saved) {
          try { setOrders(JSON.parse(saved)); } catch (err) {}
        }
      }
    };

    listOrders();

    const interval = setInterval(listOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: 'PREPARANDO' | 'PRONTO' | 'ENTREGUE') => {
    const orderObj = orders.find(o => o.id === orderId);
    if (!orderObj) return;

    try {
      const res = await fetch(`/api/orders/${orderObj.orderNumber}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          setOrders(prev => prev.map(o => o.orderNumber === orderObj.orderNumber ? data.order : o));
          return;
        }
      }
    } catch (e) {
      console.warn("Sem conexão com o servidor de validação - atualizando localmente", e);
    }

    // Fallback de atualização puramente local
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem('sorvefood_orders', JSON.stringify(updated));
      return updated;
    });
  };

  const clearDelivered = () => {
    setOrders(prev => {
      const filtered = prev.filter(o => o.status !== 'ENTREGUE');
      localStorage.setItem('sorvefood_orders', JSON.stringify(filtered));
      return filtered;
    });
  };

  const preparingOrders = orders.filter(o => o.status === 'PREPARANDO');
  const readyOrders = orders.filter(o => o.status === 'PRONTO');
  const deliveredOrders = orders.filter(o => o.status === 'ENTREGUE');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'realsalarios()*') {
       setIsAuthenticated(true);
       sessionStorage.setItem('sorvefood_cozinha_auth', 'true');
    } else {
       alert('Senha incorreta!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-neutral-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-neutral-700">
          <div className="w-16 h-16 bg-neutral-700 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white font-display">Painel da Cozinha</h1>
          <p className="text-neutral-400 mb-6 text-xs">Digite a credencial para gerenciar a fila de pedidos.</p>
          <input 
            type="password" 
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            className="w-full border-2 border-neutral-600 bg-neutral-900 text-white rounded-xl px-4 py-3 mb-4 focus:outline-hidden focus:border-amber-500 text-center text-sm font-mono"
            placeholder="Senha"
            autoFocus
          />
          <div className="flex gap-2">
            {onNavigateToView && (
              <button 
                type="button" 
                onClick={() => onNavigateToView('store')}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={14} /> Voltar
              </button>
            )}
            <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors text-xs cursor-pointer">
               Agressar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col pb-10">
      {/* Header */}
      <header className="bg-neutral-900 text-white shadow-md z-10 p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ChefHat size={32} className="text-amber-500" />
            <span className="text-xl font-bold tracking-wider font-mono">PAINEL DA COZINHA</span>
          </div>
          <div className="flex items-center gap-4">
            {onNavigateToView && (
              <div className="flex gap-3 text-xs font-bold text-neutral-400 mr-2">
                <button onClick={() => onNavigateToView('store')} className="hover:text-white transition-colors cursor-pointer">Ver Loja</button>
                <span>|</span>
                <button onClick={() => onNavigateToView('admin')} className="hover:text-white transition-colors cursor-pointer">Gerenciar Cardápio</button>
              </div>
            )}
            <div className="flex gap-4 text-sm font-medium">
              <button 
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playChime();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-xs ${soundEnabled ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-neutral-700 text-neutral-400 hover:text-neutral-300'}`}
              >
                  {soundEnabled ? '🔔 Chime Ativo' : '🔕 Chime Mudo'}
              </button>
              <div className="flex items-center gap-1.5 text-xs text-green-400"><div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></div>Fila Ativa</div>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-max max-w-7xl mx-auto items-start">
          
          {/* Column: PREPARANDO */}
          <div className="w-96 flex flex-col bg-neutral-200/50 rounded-2xl p-4 min-h-[500px]">
             <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-bold text-base flex items-center gap-2 text-neutral-700"><Clock className="text-orange-500" size={18}/> Preparando</h2>
                <span className="bg-neutral-300 text-neutral-700 text-xs font-black px-2.5 py-0.5 rounded-full">{preparingOrders.length}</span>
             </div>
             <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4">
                {preparingOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-xs border border-orange-200 p-5 animate-in slide-in-from-top-2">
                     <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-3">
                        <span className="font-black text-2xl font-display text-neutral-800">#{order.orderNumber}</span>
                        <span className="text-xs font-mono font-bold text-neutral-400">{order.createdAt}</span>
                     </div>
                     <div className="mb-4 bg-amber-50/70 rounded-xl p-3 border border-amber-100/60">
                        <p className="font-bold text-amber-950 text-xs leading-none">Cliente: {order.customerName || 'Não identificado'}</p>
                        {order.customerPhone && <p className="text-[10px] text-amber-800 mt-1 font-mono">{order.customerPhone}</p>}
                        
                        <div className="flex flex-col gap-1 mt-2.5 pt-2 border-t border-amber-200/50">
                          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                            Entrega: {order.deliveryType === 'MESA' ? `Mesa (${order.tableNumber})` : 'Balcão'}
                          </p>
                          <p className="text-[10px] font-medium text-amber-800 uppercase tracking-wider">
                            Pagamento: {order.paymentMethod}
                          </p>
                        </div>
                     </div>
                     
                     <div className="space-y-2 mb-5">
                       {order.items.map(item => (
                         <div key={item.cartItemId} className="flex gap-2.5 text-sm leading-tight border-b border-neutral-100 last:border-0 pb-2 last:pb-0">
                           <span className="font-black text-amber-600 font-mono text-base">{item.quantity}x</span>
                           <div>
                              <p className="font-bold text-neutral-800">{item.product.name}</p>
                              {item.selectedSize && (
                                <p className="text-[9px] font-bold text-amber-700 bg-amber-50 inline-block px-1.5 py-0.5 rounded-sm mt-1 uppercase mr-1">
                                  {item.selectedSize.name}
                                </p>
                              )}
                              {item.selectedExtras.length > 0 && (
                                <p className="text-[9px] font-bold text-amber-700 bg-amber-50 inline-block px-1.5 py-0.5 rounded-sm mt-1 uppercase">
                                  + {item.selectedExtras.map(e => e.name).join(', ')}
                                </p>
                              )}
                           </div>
                         </div>
                       ))}
                     </div>
                     
                     <button 
                        onClick={() => updateOrderStatus(order.id, 'PRONTO')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-xs cursor-pointer text-sm"
                     >
                        <CheckCircle size={16} />
                        Pronto para Retirada
                     </button>
                  </div>
                ))}
                {preparingOrders.length === 0 && <div className="text-center text-neutral-400 py-10 font-medium text-xs">Nenhum pedido na fila de produção.</div>}
             </div>
          </div>

          {/* Column: PRONTO PARA RETIRADA */}
          <div className="w-96 flex flex-col bg-green-50/50 rounded-2xl p-4 min-h-[500px] border border-green-100">
             <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-bold text-base flex items-center gap-2 text-green-700"><Package size={18}/> Pronto (Aguardando)</h2>
                <span className="bg-green-250 text-green-800 text-xs font-black px-2.5 py-0.5 rounded-full">{readyOrders.length}</span>
             </div>
             <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-4">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl shadow-xs border border-green-200 p-5">
                     <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-3xl text-green-600 font-display">#{order.orderNumber}</span>
                        <span className="text-[9px] font-mono font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">PRONTO</span>
                     </div>
                     <div className="mb-4 bg-green-50/70 rounded-xl p-3 border border-green-100/60">
                        <p className="font-bold text-green-950 text-xs">Chamar: {order.customerName}</p>
                        <p className="text-[10px] font-bold text-green-800 mt-1 uppercase tracking-wider">
                          {order.deliveryType === 'MESA' ? `Mesa ${order.tableNumber}` : 'Retirada no Balcão'}
                        </p>
                     </div>
                     <p className="text-xs text-neutral-400 mb-5 font-medium">{order.items.length} itens no pedido</p>
                     
                     <div className="flex gap-2">
                        <button 
                           onClick={() => updateOrderStatus(order.id, 'PREPARANDO')}
                           className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2 rounded-xl transition-colors text-xs cursor-pointer"
                        >
                           Voltar
                        </button>
                        <button 
                           onClick={() => updateOrderStatus(order.id, 'ENTREGUE')}
                           className="flex-[2] bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition-colors flex justify-center items-center gap-1.5 shadow-xs cursor-pointer text-xs"
                        >
                           <Check size={16} />
                           Entregue
                        </button>
                     </div>
                  </div>
                ))}
                {readyOrders.length === 0 && <div className="text-center text-green-700/55 py-10 font-medium text-xs">Aguardando novos preparos ficarem prontos.</div>}
             </div>
          </div>

          {/* Column: ENTREGUE */}
          <div className="w-72 flex flex-col bg-neutral-200/30 rounded-2xl p-4 min-h-[500px]">
             <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="font-bold text-sm flex items-center gap-1.5 text-neutral-500"> Entregues</h2>
                {deliveredOrders.length > 0 && (
                  <button onClick={clearDelivered} className="text-neutral-400 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Limpar Histórico">
                    <Trash2 size={15} />
                  </button>
                )}
             </div>
             <div className="space-y-3 flex-1 overflow-y-auto pr-1 pb-4">
                {deliveredOrders.map(order => (
                  <div key={order.id} className="bg-neutral-50/60 rounded-xl border border-neutral-200 p-3.5 opacity-70">
                     <div className="flex gap-2 items-center justify-between mb-1">
                       <span className="font-bold text-neutral-600 text-xs">#{order.orderNumber}</span>
                       <span className="text-[9px] text-neutral-400 font-bold font-mono">{order.createdAt}</span>
                     </div>
                     <p className="text-xs font-semibold text-neutral-700 mb-1 leading-none">{order.customerName}</p>
                     <p className="text-[10px] text-neutral-450 truncate">{order.items.map(i => i.product.name).join(', ')}</p>
                  </div>
                ))}
                {deliveredOrders.length === 0 && <div className="text-center text-neutral-400/60 py-10 font-medium text-xs">Histórico vazio.</div>}
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
