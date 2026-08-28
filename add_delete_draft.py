# -*- coding: utf-8 -*-
import os
import re

path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleDeletePendingOrder before loadCustomerOrder
func_to_add = """    const handleDeletePendingOrder = async (id: string, queueNumber: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const ok = await confirm({ title: "Batalkan Pesanan", message: "Yakin ingin membatalkan/menghapus pesanan ini?", confirmText: "Ya, Batalkan", variant: "danger" });
        if (!ok) return;

        try {
            const { error } = await supabase.from('kiosk_orders').delete().eq('id', id);
            if (error) throw error;
            toast.success("Pesanan berhasil dibatalkan.");
            setPendingOrders(prev => prev.filter((o: any) => o.id !== id));
            
            // If the active queue number matches the deleted one, clear the cart.
            if (activeQueueNumber === queueNumber) {
                clearCart();
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const loadCustomerOrder"""

content = content.replace("    const loadCustomerOrder", func_to_add)

# 2. Replace INCOMING ORDERS NOTIFICATION map
incoming_pattern = r"\{pendingOrders\.map\(\(order: any, idx: number\) => order\.status === 'pending' && \([\s\S]*?</button>\s*\)\)\}"

new_incoming_map = """{pendingOrders.map((order: any, idx: number) => order.status === 'pending' && (
                                    <div key={order.id} className="relative group flex-shrink-0 min-w-[150px]">
                                        <button 
                                            onClick={() => loadCustomerOrder(order, idx)}
                                            className="w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 px-4 py-3 rounded-xl border border-orange-500/40 text-white font-bold hover:from-orange-500/30 hover:to-red-500/30 shadow-sm transition-all text-left flex flex-col relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 animate-pulse"></div>
                                            <span className="text-orange-300 text-xs mb-1">Meja {order.table_number} / {order.customer_name}</span>
                                            <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePendingOrder(order.id, order.queue_number, e)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                                            title="Tolak Pesanan"
                                        >
                                            &#10005;
                                        </button>
                                    </div>
                                ))}"""

content = re.sub(incoming_pattern, new_incoming_map, content)

# 3. Replace DRAFT ORDERS NOTIFICATION map
draft_pattern = r"\{pendingOrders\.map\(\(order: any, idx: number\) => order\.status === 'draft' && \([\s\S]*?</button>\s*\)\)\}"

new_draft_map = """{pendingOrders.map((order: any, idx: number) => order.status === 'draft' && (
                                    <div key={order.id} className="relative group flex-shrink-0 min-w-[150px]">
                                        <button 
                                            onClick={() => loadCustomerOrder(order, idx)}
                                            className="w-full h-full bg-[#1a1a1c] px-4 py-3 rounded-xl border border-blue-500/20 text-white font-bold hover:bg-gray-800 shadow-sm transition-colors text-left flex flex-col"
                                        >
                                            <span className="text-blue-400 text-xs mb-1">{order.queue_number || order.id}</span>
                                            <span>Rp {(order.total || 0).toLocaleString('id-ID')}</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDeletePendingOrder(order.id, order.queue_number, e)}
                                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                                            title="Hapus Draft"
                                        >
                                            &#10005;
                                        </button>
                                    </div>
                                ))}"""

content = re.sub(draft_pattern, new_draft_map, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Add delete draft functionality success.")
