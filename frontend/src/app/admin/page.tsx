"use client";

import { useState, useEffect } from "react";
import { getReconciliationReport, getAuditLogs } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck, Users, Package, FileText, Settings, Upload, Loader2, Maximize, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReportChart from "@/components/ReportChart";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { LoadingSpinner, SkeletonCard, SkeletonTable } from "@/components/Loading";
import ProductOptionsEditor from "@/components/ProductOptionsEditor";
import { parseExpenseQtyAndUnit, formatExpenseDescription, cleanExpenseDescription } from "@/lib/expenseHelpers";

const CategoryDropdown = ({ value, onChange, categories, onAdd, onRemove }: { value: string, onChange: (v: string) => void, categories: string[], onAdd: (v: string) => void, onRemove: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newCat, setNewCat] = useState('');
    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white cursor-pointer flex justify-between items-center outline-none focus:border-blue-500">
                {value || "Pilih Kategori"}
                <span className="text-gray-500 text-xs">Γû╝</span>
            </div>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full mt-2 w-full bg-[#131B2C] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col">
                        <div className="overflow-y-auto max-h-48 py-1">
                            {categories.map((cat: string) => (
                                <div key={cat} className="flex justify-between items-center px-4 py-3 hover:bg-gray-800 cursor-pointer text-sm text-white transition-colors group">
                                    <span onClick={() => { onChange(cat); setIsOpen(false); }} className="flex-1 font-bold">{cat}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(cat); }} className="text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity">Γ£ò</button>
                                </div>
                            ))}
                            {categories.length === 0 && <div className="p-2 md:p-4 text-center text-gray-500 text-xs">Belum ada kategori</div>}
                        </div>
                        <div className="p-3 border-t border-gray-800 bg-gray-900 flex gap-2">
                            <input type="text" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Kategori Baru..." className="flex-1 bg-[#0B0F19] rounded-lg px-3 py-2 text-sm text-white outline-none border border-gray-700 focus:border-blue-500 transition-colors" onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); onAdd(newCat); setNewCat(''); }}} />
                            <button type="button" onClick={() => { onAdd(newCat); setNewCat(''); }} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-500">+</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const MaterialConverterHelper = ({ targetUnit, onApply }: { targetUnit: string, onApply: (price: number) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [buyQty, setBuyQty] = useState<string>('1');
    const [buyUnit, setBuyUnit] = useState<string>(targetUnit === 'g' || targetUnit === 'gr' ? 'kg' : targetUnit === 'ml' ? 'liter' : targetUnit || 'kg');
    const [buyPrice, setBuyPrice] = useState<string>('');
    const [packContent, setPackContent] = useState<string>('100');

    const qty = parseFloat(buyQty) || 0;
    const price = parseFloat(buyPrice) || 0;
    let unitMultiplier = 1;

    if (targetUnit === 'g' || targetUnit === 'gr') {
        if (buyUnit === 'kg') unitMultiplier = 1000;
        else if (buyUnit === 'g' || buyUnit === 'gr') unitMultiplier = 1;
        else if (buyUnit === 'pack' || buyUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else if (targetUnit === 'ml') {
        if (buyUnit === 'liter' || buyUnit === 'l') unitMultiplier = 1000;
        else if (buyUnit === 'ml') unitMultiplier = 1;
        else if (buyUnit === 'pack' || buyUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else {
        if (buyUnit === 'pack' || buyUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    }

    const totalTargetUnits = qty * unitMultiplier;
    const pricePerTargetUnit = totalTargetUnits > 0 && price > 0 ? (price / totalTargetUnits) : 0;

    return (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                    💡 Kalkulator Konversi Beli (kg / liter / pack / dus)
                </span>
                <span className="text-xs text-blue-400 underline font-semibold">{isOpen ? 'Tutup' : 'Buka Kalkulator'}</span>
            </div>

            {isOpen && (
                <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-gray-400">
                        Beli dalam partai/kemasan besar? Masukkan data pembelian untuk mengonversi harga ke per <strong>{targetUnit || 'satuan'}</strong>:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Jumlah Pembelian</label>
                            <input
                                type="number"
                                step="any"
                                value={buyQty}
                                onChange={e => setBuyQty(e.target.value)}
                                placeholder="Contoh: 1"
                                className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Satuan Pembelian</label>
                            <select
                                value={buyUnit}
                                onChange={e => setBuyUnit(e.target.value)}
                                className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs outline-none focus:border-blue-500 font-bold"
                            >
                                <option value="kg">kg (Kilogram = 1.000 g)</option>
                                <option value="g">g (Gram)</option>
                                <option value="liter">liter (Liter = 1.000 ml)</option>
                                <option value="ml">ml (Mililiter)</option>
                                <option value="pcs">pcs (Satuan)</option>
                                <option value="pack">pack (Isi pack)</option>
                                <option value="dus">dus (Isi dus/box)</option>
                            </select>
                        </div>
                    </div>

                    {(buyUnit === 'pack' || buyUnit === 'dus') && (
                        <div>
                            <label className="text-[10px] text-gray-500 block mb-1">Isi per {buyUnit} (dalam {targetUnit || 'satuan'})</label>
                            <input
                                type="number"
                                step="any"
                                value={packContent}
                                onChange={e => setPackContent(e.target.value)}
                                placeholder={`Contoh: 100 (${targetUnit || 'satuan'})`}
                                className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Total Harga Beli (Rp)</label>
                        <input
                            type="number"
                            step="any"
                            value={buyPrice}
                            onChange={e => setBuyPrice(e.target.value)}
                            placeholder="Contoh: 230000"
                            className="w-full p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                        />
                    </div>

                    {pricePerTargetUnit > 0 && (
                        <div className="bg-gray-900/90 border border-blue-500/30 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-gray-400 block">Hasil Konversi:</span>
                                <span className="text-sm font-bold text-green-400">
                                    Rp {Number(pricePerTargetUnit.toFixed(2)).toLocaleString('id-ID')} / {targetUnit}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => onApply(Number(pricePerTargetUnit.toFixed(2)))}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                                Gunakan Harga Ini
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses" | "cash_sessions" | "raw_materials">("reconciliation");

    // Read ?tab= query param on initial load for direct cashier navigation
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['reconciliation', 'raw_materials', 'inventory', 'expenses', 'history', 'cash_sessions'].includes(tab)) {
                setActiveTab(tab as any);
            }
        }
    }, []);
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [reconciliationDate, setReconciliationDate] = useState<Date>(new Date());
    const [historyDate, setHistoryDate] = useState<Date>(new Date());
    const [reconciliationPeriod, setReconciliationPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("daily");
    const [customDateStart, setCustomDateStart] = useState("");
    const [customDateEnd, setCustomDateEnd] = useState("");
    const [productSalesData, setProductSalesData] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [historyFilterType, setHistoryFilterType] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("daily");
    const [historySortOrder, setHistorySortOrder] = useState<"desc" | "asc">("desc");
    const [staffList, setStaffList] = useState<any[]>([]);
    const [cashSessions, setCashSessions] = useState<any[]>([]);
    
    // Edit & Expenses States
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [adjustingProductStock, setAdjustingProductStock] = useState<any>(null);
    const [viewingProductHistory, setViewingProductHistory] = useState<any>(null);
    const [productHistoryData, setProductHistoryData] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [inventorySalesData, setInventorySalesData] = useState<any[]>([]);
    const [productStockDelta, setProductStockDelta] = useState<number>(0);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [materialStockLogs, setMaterialStockLogs] = useState<any[]>([]);
    const [newExpense, setNewExpense] = useState<{ description: string; amount: number; material_id: string; quantity: number; payment_method: string; category: string; buy_unit?: string }>({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: 'g', current_stock: 0, last_price_per_unit: 0, min_stock: 0 });
    const [materialSortBy, setMaterialSortBy] = useState<'updated' | 'price_desc' | 'price_asc' | 'low_stock' | 'name_asc'>('updated');
    const [materialSearchQuery, setMaterialSearchQuery] = useState('');
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'staff' });
    
    // UI states for new features
    const [materialMode, setMaterialMode] = useState<'add' | 'update'>('add');
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [stockAdjustment, setStockAdjustment] = useState<{ delta: number; note: string; price: number; unit?: string }>({ delta: 0, note: '', price: 0, unit: '' });
    const [expenseSortOrder, setExpenseSortOrder] = useState<'desc' | 'asc'>('desc');
    const [expensePeriod, setExpensePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<'all' | 'bahan_baku' | 'operasional'>('all');
    
    // Edit opening cash on shift
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingOpeningCash, setEditingOpeningCash] = useState<string>('');
    
    // Inline add material in expense form
    const [showInlineAddMaterial, setShowInlineAddMaterial] = useState(false);
    const [inlineNewMaterial, setInlineNewMaterial] = useState({ name: '', unit: 'g', last_price_per_unit: 0 });

    const OPERATIONAL_COST = 3000;
    
    // Store Settings
    const [storeSettings, setStoreSettings] = useState({
        logo_base64: "",
        qris_image_base64: "",
        cafe_name: "NexPos Cafe",
        receipt_footer: "Terima kasih atas kunjungan Anda!",
        wifi_name: "",
        wifi_password: "",
        tax_enabled: false,
        tax_rate: 0,
        logo_size: 60,
        qris_size: 120,
        categories: ["Makanan", "Minuman", "Snack"]
    });

    const [products, setProducts] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, discount_percentage?: number, options_config?: any[], ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[], operational_cost: number}>({ 
        name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [], operational_cost: 3000
    });
    
    const [loading, setLoading] = useState(false);
    const [tabLoading, setTabLoading] = useState(false);
    const [printTransaction, setPrintTransaction] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();
    const toast = useToast();
    const { confirm, ConfirmDialog } = useConfirm();
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);



    const fetchData = async () => {
        setTabLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: prof } = await supabase.from('staff_profiles').select('*').eq('id', session.user.id).single();
            if (!prof) {
                toast.error("Akses ditolak.");
                router.push('/pos');
                return;
            }
            const allowedStaffTabs = ['reconciliation', 'history', 'cash_sessions', 'raw_materials', 'inventory', 'expenses'];
            if (prof.role !== 'owner' && !allowedStaffTabs.includes(activeTab)) {
                setActiveTab('reconciliation');
                return; // fetchData will run again due to useEffect dependency
            }
            setProfile(prof);

            if (activeTab === "reconciliation") {
                await fetchReconciliation(reconciliationPeriod);
            } else if (activeTab === "audit") {
                await fetchAuditLogs();
            } else if (activeTab === "staff") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`);
                if(res.ok) setStaffList(await res.json());
            } else if (activeTab === "inventory") {
                const [prodRes, matRes, orderItemsRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`),
                    supabase.from('raw_materials').select('*').order('name', { ascending: true }),
                    supabase.from('order_items').select('product_id, product_name, quantity, price_at_time, created_at').order('created_at', { ascending: false }).limit(500)
                ]);
                if (prodRes.ok) setProducts(await prodRes.json());
                setRawMaterials(matRes.data || []);

                if (orderItemsRes.data) {
                    const salesMap: Record<string, any> = {};
                    orderItemsRes.data.forEach((item: any) => {
                        const key = item.product_id || item.product_name;
                        if (!key) return;
                        if (!salesMap[key]) {
                            salesMap[key] = {
                                product_id: item.product_id,
                                product_name: item.product_name,
                                total_sold: 0,
                                total_revenue: 0,
                                last_sold: item.created_at
                            };
                        }
                        salesMap[key].total_sold += Number(item.quantity || 0);
                        salesMap[key].total_revenue += Number(item.quantity || 0) * Number(item.price_at_time || 0);
                    });
                    setInventorySalesData(Object.values(salesMap).sort((a: any, b: any) => b.total_sold - a.total_sold));
                }
            } else if (activeTab === "history") {
                await fetchTransactions(historyFilterType);
            } else if (activeTab === "settings") {
                try {
                    const { data } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
                    if (data) {
                        setStoreSettings({
                            logo_base64: data.logo_base64 || "",
                            qris_image_base64: data.qris_image_base64 || "",
                            cafe_name: data.cafe_name || "NexPos Cafe",
                            receipt_footer: data.receipt_footer || "Terima kasih atas kunjungan Anda!",
                            wifi_name: data.wifi_name || "",
                            wifi_password: data.wifi_password || "",
                            tax_enabled: !!data.tax_enabled,
                            tax_rate: Number(data.tax_rate) || 11,
                            logo_size: Number(data.logo_size) || 100,
                            qris_size: Number(data.qris_size) || 120,
                            categories: data.categories || ["Makanan", "Minuman", "Snack"]
                        });
                    }
                    
                    const { data: payMethods } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true });
                    if (payMethods) setPaymentMethods(payMethods);
                } catch(e) {
                    console.error("Store settings table might not exist yet", e);
                }
            } else if (activeTab === "raw_materials") {
                const { data: matData } = await supabase.from('raw_materials').select('*').order('name', { ascending: true });
                setRawMaterials(matData || []);
            } else if (activeTab === "cash_sessions") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions?_t=${Date.now()}`, { cache: 'no-store' });
                if (res.ok) {
                    const sessions = await res.json();
                    setCashSessions(sessions);
                }
            } else if (activeTab === "expenses") {
                const [expRes, matRes, logRes] = await Promise.all([
                    supabase.from('expenses').select('*').order('created_at', { ascending: expenseSortOrder === 'desc' ? false : true }),
                    supabase.from('raw_materials').select('*').order('name', { ascending: true }),
                    supabase.from('material_stock_logs').select('*').order('created_at', { ascending: false }).limit(50)
                ]);
                const normalizedExpenses = (expRes.data || []).map((e: any) => ({
                    ...e,
                    category: (e.category || (e.raw_material_id ? 'bahan_baku' : 'operasional')).toLowerCase()
                }));
                setExpenses(normalizedExpenses);
                setRawMaterials(matRes.data || []);
                setMaterialStockLogs(logRes.data || []);
            }
            
            // Settings always loaded for UI config
            const { data: setts } = await supabase.from('store_settings').select('*').single();
            if (setts) setStoreSettings(setts);
            
        } catch (error) {
            toast.error("Terjadi kesalahan saat memuat data.");
        }
        setTabLoading(false);
    };

    const handleAddPaymentMethod = async (name: string) => {
        if(!name) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('payment_methods').insert([{ name, type: 'transfer', is_active: true }]);
            if(error) throw error;
            toast.success("Metode pembayaran ditambahkan!");
            const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true });
            if (data) setPaymentMethods(data);
        } catch(e: any) { toast.error(e.message); }
        setLoading(false);
    }

    const handleDeletePaymentMethod = async (id: string) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('payment_methods').update({ is_active: false }).eq('id', id);
            if(error) throw error;
            toast.success("Metode pembayaran dihapus!");
            const { data } = await supabase.from('payment_methods').select('*').eq('is_active', true).order('created_at', { ascending: true });
            if (data) setPaymentMethods(data);
        } catch(e: any) { toast.error(e.message); }
        setLoading(false);
    }

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('store_settings').select('id').maybeSingle();
            
            if (data?.id) {
                const { error } = await supabase.from('store_settings').update(storeSettings).eq('id', data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('store_settings').insert([storeSettings]);
                if (error) throw error;
            }
            toast.success("Pengaturan Toko berhasil disimpan!");
            localStorage.setItem("nexpos_store_settings", JSON.stringify(storeSettings));
        } catch(e: any) {
            toast.error("Gagal menyimpan: " + (e.message || "Pastikan script SQL dijalankan."));
        }
        setLoading(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setStoreSettings({ ...storeSettings, logo_base64: event.target.result.toString() });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setStoreSettings({ ...storeSettings, qris_image_base64: event.target.result.toString() });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTestPrint = () => {
        window.print();
    };

    const fetchTransactions = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom', customStart?: string, customEnd?: string) => {
        setLoading(true);
        try {
            const now = historyDate;
            let start = new Date(now);
            let end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            if (period === 'daily') {
                start.setHours(0, 0, 0, 0);
            } else if (period === 'weekly') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(start.setDate(diff));
                start.setHours(0, 0, 0, 0);
            } else if (period === 'monthly') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'yearly') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'custom' && customStart && customEnd) {
                start = new Date(customStart);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'custom') {
                setLoading(false);
                return;
            }
            
            const startStr = start.toISOString();
            const endStr = end.toISOString();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions?startDate=${startStr}&endDate=${endStr}`);
            if (res.ok) setTransactions(await res.json());
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const shiftReconciliationDate = (dir: number) => {
        setReconciliationDate(prev => {
            const d = new Date(prev);
            if (reconciliationPeriod === 'daily') d.setDate(d.getDate() + dir);
            else if (reconciliationPeriod === 'weekly') d.setDate(d.getDate() + (dir * 7));
            else if (reconciliationPeriod === 'monthly') d.setMonth(d.getMonth() + dir);
            else if (reconciliationPeriod === 'yearly') d.setFullYear(d.getFullYear() + dir);
            return d;
        });
    };
    
    useEffect(() => {
        if (activeTab === "reconciliation" && reconciliationPeriod !== "custom") fetchReconciliation(reconciliationPeriod);
    }, [reconciliationDate]);

    const shiftHistoryDate = (dir: number) => {
        setHistoryDate(prev => {
            const d = new Date(prev);
            if (historyFilterType === 'daily') d.setDate(d.getDate() + dir);
            else if (historyFilterType === 'weekly') d.setDate(d.getDate() + (dir * 7));
            else if (historyFilterType === 'monthly') d.setMonth(d.getMonth() + dir);
            else if (historyFilterType === 'yearly') d.setFullYear(d.getFullYear() + dir);
            return d;
        });
    };
    
    useEffect(() => {
        if (activeTab === "history" && historyFilterType !== "custom") fetchTransactions(historyFilterType);
    }, [historyDate, historyFilterType]);

    const fetchReconciliation = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom', customStart?: string, customEnd?: string) => {
        setLoading(true);
        try {
            const now = reconciliationDate;
            let start = new Date(now);
            let end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            if (period === 'daily') {
                start.setHours(0, 0, 0, 0);
            } else if (period === 'weekly') {
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(start.setDate(diff));
                start.setHours(0, 0, 0, 0);
            } else if (period === 'monthly') {
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'yearly') {
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
            } else if (period === 'custom' && customStart && customEnd) {
                start = new Date(customStart);
                start.setHours(0, 0, 0, 0);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            } else if (period === 'custom') {
                setLoading(false);
                return; // Wait until dates are selected
            }

            const startDateStr = start.toISOString();
            const endDateStr = end.toISOString();

            // 1. Rekonsiliasi Pembayaran
            const res = await getReconciliationReport(startDateStr, endDateStr);
            setReconciliation(Array.isArray(res) ? res : []);

            // 2. Data Penjualan Produk
            const { data: orderItems } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    price_at_time,
                    cogs_at_time,
                    product:products (id, name, category)
                `)
                .gte('created_at', start.toISOString())
                .lte('created_at', end.toISOString());

            const pMap: Record<string, any> = {};
            if (orderItems) {
                orderItems.forEach((item: any) => {
                    const pId = item.product?.id || 'unknown';
                    const qty = item.quantity || 1;
                    const price = Number(item.price_at_time) || 0;
                    const cogs = Number(item.cogs_at_time) || 0;

                    if (!pMap[pId]) {
                        pMap[pId] = {
                            id: pId,
                            name: item.product?.name || 'Produk Dihapus',
                            category: item.product?.category || '-',
                            terjual: 0,
                            kotor: 0,
                            hpp_total: 0,
                            bersih: 0
                        };
                    }
                    pMap[pId].terjual += qty;
                    pMap[pId].kotor += (price * qty);
                    pMap[pId].hpp_total += (cogs * qty);
                    pMap[pId].bersih += ((price - cogs) * qty);
                });
            }
            const pArray = Object.values(pMap).sort((a, b) => b.terjual - a.terjual); // Produk Terlaris at top
            setProductSalesData(pArray);

        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const getFilteredTransactions = () => {
        let filtered = transactions.filter(trx => {
            const trxDate = new Date(trx.created_at);
            const now = historyDate;
            
            if (historyFilterType === 'daily') {
                return trxDate.toDateString() === now.toDateString();
            } else if (historyFilterType === 'weekly') {
                const diffTime = Math.abs(now.getTime() - trxDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays <= 7;
            } else if (historyFilterType === 'monthly') {
                return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
            } else if (historyFilterType === 'yearly') {
                return trxDate.getFullYear() === now.getFullYear();
            } else if (historyFilterType === 'custom' && customDateStart && customDateEnd) {
                const s = new Date(customDateStart);
                s.setHours(0,0,0,0);
                const e = new Date(customDateEnd);
                e.setHours(23,59,59,999);
                return trxDate >= s && trxDate <= e;
            }
            return false;
        });

        // Apply sort
        filtered.sort((a, b) => {
            if (historySortOrder === 'desc') {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            } else {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
        });
        
        return filtered;
    };

    const getFilteredExpenses = () => {
        let filtered = expenses.filter(exp => {
            // Category filter
            if (expenseCategoryFilter !== 'all') {
                const expCat = (exp.category || (exp.raw_material_id ? 'bahan_baku' : 'operasional')).toLowerCase();
                if (expCat !== expenseCategoryFilter) return false;
            }

            if (expensePeriod === 'all') return true;
            
            const expDate = new Date(exp.expense_date || exp.created_at);
            const now = new Date();
            
            if (expensePeriod === 'daily') {
                return expDate.toDateString() === now.toDateString();
            } else if (expensePeriod === 'weekly') {
                const diffTime = Math.abs(now.getTime() - expDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                return diffDays <= 7;
            } else if (expensePeriod === 'monthly') {
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            } else if (expensePeriod === 'yearly') {
                return expDate.getFullYear() === now.getFullYear();
            }
            return true;
        });

        filtered.sort((a, b) => {
            const dA = new Date(a.expense_date || a.created_at).getTime();
            const dB = new Date(b.expense_date || b.created_at).getTime();
            return expenseSortOrder === 'desc' ? dB - dA : dA - dB;
        });

        return filtered;
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if(res.ok) {
                toast.success("Staf berhasil ditambahkan!");
                setNewStaff({ full_name: '', email: '', password: '', role: 'staff' });
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menambahkan staf.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    } else if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/webp', 0.6));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const ingredientsCost = newProduct.ingredients.length > 0 
            ? newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0)
            : 0;
        const opCost = Number(newProduct.operational_cost ?? OPERATIONAL_COST);
        const computedCogs = newProduct.ingredients.length > 0 
            ? ingredientsCost + opCost
            : Number(newProduct.cogs);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProduct,
                    price: Number(newProduct.price),
                    cogs: computedCogs,
                    stock: Number(newProduct.stock),
                    ingredients: newProduct.ingredients,
                    discount_percentage: Number(newProduct.discount_percentage || 0),
                    options_config: newProduct.options_config || [],
                    image_url: newProduct.image_url,
                    operational_cost: opCost
                })
            });
            if(res.ok) {
                toast.success("Produk berhasil ditambahkan!");
                setNewProduct({ name: '', category: storeSettings.categories?.[0] || 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', discount_percentage: 0, options_config: [], ingredients: [], operational_cost: OPERATIONAL_COST });
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menambahkan produk.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const [refundReason, setRefundReason] = useState('');
    const [refundTarget, setRefundTarget] = useState<any>(null);

    const handleRefund = async (trx: any) => {
        setRefundTarget(trx);
        setRefundReason('');
    };

    const handleConfirmRefund = async () => {
        if (!refundReason.trim()) {
            toast.warning("Masukkan alasan refund terlebih dahulu.");
            return;
        }
        const ok = await confirm({
            title: "Konfirmasi Refund",
            message: `Anda yakin ingin melakukan refund Rp ${Number(refundTarget?.amount_received || 0).toLocaleString('id-ID')}?`,
            confirmText: "Ya, Proses Refund",
            variant: "warning"
        });
        if (!ok) return;

        setLoading(true);
        setRefundTarget(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/refunds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: refundTarget.id,
                    refund_amount: refundTarget.amount_due,
                    reason: refundReason,
                    requested_by: session?.user?.id
                })
            });
            if(res.ok) {
                toast.success("Refund berhasil diproses!");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Refund gagal.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan sistem saat memproses refund.");
        }
        setLoading(false);
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const ings = editingProduct.ingredients || [];
        const ingredientsCost = ings.length > 0 
            ? ings.reduce((sum: number, item: any) => sum + item.cost, 0)
            : 0;
        const opCost = Number(editingProduct.operational_cost ?? OPERATIONAL_COST);
        const computedCogs = ings.length > 0 
            ? ingredientsCost + opCost
            : Number(editingProduct.cogs);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editingProduct.name,
                    category: editingProduct.category,
                    price: Number(editingProduct.price),
                    cogs: computedCogs,
                    stock: Number(editingProduct.stock),
                    image_icon: editingProduct.image_icon,
                    image_url: editingProduct.image_url || null,
                    ingredients: editingProduct.ingredients,
                    discount_percentage: Number(editingProduct.discount_percentage || 0),
                    options_config: editingProduct.options_config || [],
                    operational_cost: opCost
                })
            });
            if(res.ok) {
                toast.success("Produk berhasil diperbarui!"); await logAudit("EDIT_DATA", "products", editingProduct.id, { product_name: editingProduct.name, action: "Edit Produk" });
                setEditingProduct(null);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal memperbarui produk.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleUpdateProductStock = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const newStock = adjustingProductStock.stock + productStockDelta;
        if (newStock < 0) {
            toast.error("Stok tidak boleh negatif!");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${adjustingProductStock.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...adjustingProductStock,
                    stock: newStock
                })
            });
            if(res.ok) {
                toast.success(`Stok produk berhasil diupdate.`);
                setAdjustingProductStock(null);
                setProductStockDelta(0);
                fetchData();
            } else {
                toast.error("Gagal update stok produk.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleViewProductHistory = async (product: any) => {
        setViewingProductHistory(product);
        setProductHistoryData([]);
        setHistoryLoading(true);
        try {
            // Fetch order items matching this product ID OR name, joined with transactions
            const query = supabase
                .from('order_items')
                .select(`
                    quantity,
                    price_at_time,
                    created_at,
                    transaction:transactions (order_reference)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (product.id && product.name) {
                query.or(`product_id.eq.${product.id},product_name.eq."${product.name}"`);
            } else if (product.id) {
                query.eq('product_id', product.id);
            } else if (product.name) {
                query.eq('product_name', product.name);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Gagal load history:", error);
                toast.error("Gagal memuat riwayat produk: " + error.message);
            } else if (data) {
                setProductHistoryData(data);
            }
        } catch (e: any) {
            console.error(e);
            toast.error("Terjadi kesalahan jaringan.");
        }
        setHistoryLoading(false);
    };

    const toggleProductStatus = async (product: any) => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...product,
                    is_active: !product.is_active
                })
            });
            if (res.ok) {
                toast.success(`Produk ${product.name} ${!product.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`);
                fetchData();
            } else {
                toast.error("Gagal mengubah status produk.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleDeleteSession = async (id: string) => {
        const ok = await confirm({
            title: "Hapus Shift",
            message: "Hapus shift ini secara permanen?",
            confirmText: "Hapus",
            variant: "danger"
        });
        if (!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Shift berhasil dihapus.");
                fetchData();
            } else {
                toast.error("Gagal menghapus shift.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleEditOpeningCash = async () => {
        if (!editingSessionId || !editingOpeningCash) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions/${editingSessionId}/opening-cash`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opening_cash: Number(editingOpeningCash) })
            });
            if (res.ok) {
                toast.success("Modal awal shift berhasil diperbarui.");
                setEditingSessionId(null);
                setEditingOpeningCash('');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal mengupdate modal awal.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleDeleteProduct = async (product: any) => {
        const ok = await confirm({
            title: "Hapus Menu",
            message: `Hapus menu "${product.name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`,
            confirmText: "Ya, Hapus",
            variant: "danger"
        });
        if (!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product.id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Menu berhasil dihapus."); await logAudit("DELETE_DATA", "products", product.id, { product_name: product.name, action: "Hapus Produk" });
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menghapus menu.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            if (isEdit) {
                setEditingProduct((prev: any) => ({ ...prev, image_url: compressed }));
            } else {
                setNewProduct(prev => ({ ...prev, image_url: compressed }));
            }
        } catch {
            toast.error("Gagal memproses gambar.");
        }
    };

    const saveCategoriesToDB = async (newCategories: string[]) => {
        try {
            const { data } = await supabase.from('store_settings').select('id').maybeSingle();
            if (data?.id) {
                await supabase.from('store_settings').update({ categories: newCategories }).eq('id', data.id);
            }
            // Update localStorage
            const local = JSON.parse(localStorage.getItem("nexpos_store_settings") || "{}");
            local.categories = newCategories;
            localStorage.setItem("nexpos_store_settings", JSON.stringify(local));
        } catch (e) {
            console.error("Auto-save category failed", e);
        }
    };

    const handleAddCategory = (newCat: string) => {
        if (!newCat.trim()) return;
        if (storeSettings.categories.includes(newCat.trim())) {
            toast.error("Kategori sudah ada!");
            return;
        }
        const updated = [...storeSettings.categories, newCat.trim()];
        setStoreSettings(prev => ({ ...prev, categories: updated }));
        saveCategoriesToDB(updated);
        toast.success("Kategori ditambahkan.");
    };

    const handleRemoveCategory = (cat: string) => {
        const updated = storeSettings.categories.filter((c: string) => c !== cat);
        setStoreSettings(prev => ({ ...prev, categories: updated }));
        saveCategoriesToDB(updated);
        toast.success("Kategori dihapus.");
    };

    const handleDeleteTransaction = async (trx: any) => {
        const ok = await confirm({
            title: "Hapus Transaksi",
            message: `Hapus transaksi ${trx.order_reference} secara permanen? Data laporan akan ikut terhapus.`,
            confirmText: "Ya, Hapus Permanen",
            variant: "danger"
        });
        if (!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/transactions/${trx.id}`, {
                method: 'DELETE'
            });
            if(res.ok || res.status === 204) {
                toast.success("Transaksi berhasil dihapus.");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menghapus.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan sistem saat menghapus.");
        }
        setLoading(false);
    };



    const handleDeleteExpense = async (id: string) => {
        const ok = await confirm({
            title: "Hapus Pengeluaran",
            message: "Hapus data pengeluaran ini secara permanen?",
            confirmText: "Ya, Hapus",
            variant: "danger"
        });
        if (!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/expenses/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete expense');
            }
            toast.success("Pengeluaran dihapus dan riwayat shift disesuaikan.");
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
        setLoading(false);
    };

    const handleUpdateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMaterial) return;
        setLoading(true);
        try {
            const payload: any = {
                name: editingMaterial.name,
                unit: editingMaterial.unit,
                current_stock: Number(editingMaterial.current_stock),
                last_price_per_unit: Number(editingMaterial.last_price_per_unit),
                updated_by_name: profile?.full_name,
                updated_at: new Date().toISOString()
            };
            if (editingMaterial.min_stock !== undefined) {
                payload.min_stock = Number(editingMaterial.min_stock);
            }

            let { error } = await supabase.from('raw_materials')
                .update(payload)
                .eq('id', editingMaterial.id);

            if (error && error.message?.includes('min_stock')) {
                delete payload.min_stock;
                const retry = await supabase.from('raw_materials').update(payload).eq('id', editingMaterial.id);
                error = retry.error;
            }

            if (error) throw error;
            toast.success("Bahan Baku berhasil diperbarui.");
            setEditingMaterial(null);
            fetchData();
        } catch (e: any) {
            toast.error(e.message);
        }
        setLoading(false);
    };

    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = {
                name: newMaterial.name,
                unit: newMaterial.unit,
                current_stock: Number(newMaterial.current_stock),
                last_price_per_unit: Number(newMaterial.last_price_per_unit),
                updated_by_name: profile?.full_name
            };
            if (newMaterial.min_stock !== undefined) {
                payload.min_stock = Number(newMaterial.min_stock);
            }

            let { error } = await supabase.from('raw_materials').insert([payload]);
            if (error && error.message?.includes('min_stock')) {
                // Retry without min_stock if column not yet migrated
                delete payload.min_stock;
                const retry = await supabase.from('raw_materials').insert([payload]);
                error = retry.error;
            }
            if (error) throw error;
            toast.success("Bahan Baku berhasil ditambahkan.");
            setNewMaterial({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0, min_stock: 0 });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        setLoading(true);
        const adjUnit = stockAdjustment.unit || selectedMaterial.unit;
        let mult = 1;
        if ((selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && adjUnit === 'kg') mult = 1000;
        else if (selectedMaterial.unit === 'ml' && (adjUnit === 'liter' || adjUnit === 'l')) mult = 1000;

        const effectiveDelta = Number(stockAdjustment.delta) * mult;
        const newStock = selectedMaterial.current_stock + effectiveDelta;
        if (newStock < 0) { toast.error("Stok tidak boleh negatif!"); setLoading(false); return; }
        try {
            const updatePayload: any = {
                current_stock: newStock,
                updated_by_name: profile?.full_name
            };
            if (stockAdjustment.price > 0) {
                const totalUnits = Math.abs(effectiveDelta) || 1;
                const calculatedBasePrice = mult > 1 ? (Number(stockAdjustment.price) / totalUnits) : Number(stockAdjustment.price);
                updatePayload.last_price_per_unit = Number(calculatedBasePrice.toFixed(2));
            }
            
            // 1. Update raw_materials
            const { error } = await supabase.from('raw_materials').update(updatePayload).eq('id', selectedMaterial.id);
            if (error) throw error;
            
            // 2. Insert into material_stock_logs
            await supabase.from('material_stock_logs').insert([{
                material_id: selectedMaterial.id,
                material_name: selectedMaterial.name,
                delta: effectiveDelta,
                current_stock: newStock,
                price: updatePayload.last_price_per_unit || Number(stockAdjustment.price) || null,
                staff_name: profile?.full_name,
                note: stockAdjustment.note ? `${stockAdjustment.note} (${stockAdjustment.delta} ${adjUnit})` : `Update Stok (${stockAdjustment.delta} ${adjUnit})`
            }]);

            const action = effectiveDelta >= 0 ? `+${effectiveDelta}` : `${effectiveDelta}`;
            toast.success(`Stok ${selectedMaterial.name} diupdate (${action} ${selectedMaterial.unit}).`);
            setSelectedMaterial(null);
            setStockAdjustment({ delta: 0, note: '', price: 0, unit: '' });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleDeleteMaterial = async (id: string) => {
        const ok = await confirm({
            title: "Hapus Bahan Baku",
            message: "Yakin ingin menghapus bahan baku ini?",
            variant: "danger"
        });
        if (!ok) return;
        try {
            const { error } = await supabase.from('raw_materials').delete().eq('id', id);
            if (error) throw error;
            toast.success("Bahan Baku dihapus.");
            fetchData();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleInlineAddMaterial = async () => {
        if (!inlineNewMaterial.name || !inlineNewMaterial.unit) {
            toast.error("Nama dan satuan bahan wajib diisi!");
            return;
        }
        setLoading(true);
        try {
            const { data: matData, error } = await supabase.from('raw_materials').insert([{
                name: inlineNewMaterial.name,
                unit: inlineNewMaterial.unit,
                current_stock: 0,
                last_price_per_unit: Number(inlineNewMaterial.last_price_per_unit) || 0,
                updated_by_name: profile?.full_name
            }]).select().single();
            if (error) throw error;
            toast.success(`Bahan baku "${inlineNewMaterial.name}" berhasil ditambahkan!`);
            setInlineNewMaterial({ name: '', unit: '', last_price_per_unit: 0 });
            setShowInlineAddMaterial(false);
            // Reload materials
            const { data: matRes } = await supabase.from('raw_materials').select('*').order('name', { ascending: true });
            setRawMaterials(matRes || []);
            // Auto-select the new material
            if (matData) setNewExpense(prev => ({ ...prev, material_id: matData.id }));
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const expCat = (newExpense.category || 'operasional').toLowerCase();
        // Validate: if bahan_baku category, must select material
        if (expCat === 'bahan_baku' && !newExpense.material_id) {
            toast.error("Pilih bahan baku terlebih dahulu untuk kategori Bahan Baku!");
            return;
        }
        setLoading(true);
        try {
            const rawDesc = newExpense.payment_method === 'CASH' ? newExpense.description : `[${newExpense.payment_method}] ${newExpense.description}`;
            const bUnit = (newExpense as any).buy_unit || 'kg';
            const finalDesc = expCat === 'bahan_baku' && Number(newExpense.quantity) > 0
                ? formatExpenseDescription(rawDesc, newExpense.quantity, bUnit)
                : rawDesc;

            const insertPayload: any = {
                description: finalDesc,
                amount: Number(newExpense.amount),
                recorded_by: profile?.id,
                staff_name: profile?.full_name,
                category: expCat,
                raw_material_id: expCat === 'bahan_baku' ? (newExpense.material_id || null) : null,
                quantity: expCat === 'bahan_baku' && Number(newExpense.quantity) > 0 ? Number(newExpense.quantity) : null,
                buy_unit: expCat === 'bahan_baku' && Number(newExpense.quantity) > 0 ? bUnit : null
            };

            let { error } = await supabase.from('expenses').insert([insertPayload]);
            if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.message?.includes('buy_unit'))) {
                delete insertPayload.quantity;
                delete insertPayload.buy_unit;
                const retry = await supabase.from('expenses').insert([insertPayload]);
                if (retry.error) throw retry.error;
            } else if (error) {
                throw error;
            }
            
            // Handle Material Stock Update if selected
            if (expCat === 'bahan_baku' && newExpense.material_id && Number(newExpense.quantity) > 0) {
                const material = rawMaterials.find(m => m.id === newExpense.material_id);
                if (material) {
                    let mult = 1;
                    if ((material.unit === 'g' || material.unit === 'gr') && bUnit === 'kg') mult = 1000;
                    else if (material.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;

                    const addedStock = Number(newExpense.quantity) * mult;
                    const newStock = Number(material.current_stock) + addedStock;
                    const unitPrice = addedStock > 0 ? (Number(newExpense.amount) / addedStock) : Number(material.last_price_per_unit || 0);

                    const { error: matError } = await supabase.from('raw_materials')
                        .update({ current_stock: newStock, updated_by_name: profile?.full_name, last_price_per_unit: Number(unitPrice.toFixed(2)) })
                        .eq('id', newExpense.material_id);
                    if (matError) throw matError;
                    
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: addedStock,
                        current_stock: newStock,
                        price: Number(unitPrice.toFixed(2)),
                        staff_name: profile?.full_name,
                        note: `Dari Pengeluaran: ${finalDesc}`
                    }]);
                }
            }
            
            toast.success("Pengeluaran berhasil dicatat.");
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const expCat = (editingExpense.category || 'operasional').toLowerCase();
        // Validate: if bahan_baku category, must select material
        if (expCat === 'bahan_baku' && !editingExpense.material_id) {
            toast.error("Pilih bahan baku terlebih dahulu untuk kategori Bahan Baku!");
            return;
        }
        setLoading(true);
        try {
            const bUnit = editingExpense.buy_unit || 'kg';
            const finalDesc = expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0
                ? formatExpenseDescription(editingExpense.description, editingExpense.quantity, bUnit)
                : editingExpense.description;

            const updatePayload: any = {
                description: finalDesc,
                amount: Number(editingExpense.amount),
                staff_name: profile?.full_name,
                category: expCat,
                raw_material_id: expCat === 'bahan_baku' ? (editingExpense.material_id || null) : null,
                quantity: expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0 ? Number(editingExpense.quantity) : null,
                buy_unit: expCat === 'bahan_baku' && Number(editingExpense.quantity) > 0 ? bUnit : null
            };

            let { error } = await supabase.from('expenses').update(updatePayload).eq('id', editingExpense.id);
            if (error && (error.code === 'PGRST204' || error.message?.includes('quantity') || error.message?.includes('buy_unit'))) {
                delete updatePayload.quantity;
                delete updatePayload.buy_unit;
                const retry = await supabase.from('expenses').update(updatePayload).eq('id', editingExpense.id);
                if (retry.error) throw retry.error;
            } else if (error) {
                throw error;
            }

            // If material selected and quantity entered, update material price and stock
            if (expCat === 'bahan_baku' && editingExpense.material_id && Number(editingExpense.quantity) > 0) {
                const material = rawMaterials.find(m => m.id === editingExpense.material_id);
                if (material) {
                    let mult = 1;
                    if ((material.unit === 'g' || material.unit === 'gr') && bUnit === 'kg') mult = 1000;
                    else if (material.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;

                    const addedStock = Number(editingExpense.quantity) * mult;
                    const unitPrice = addedStock > 0 ? (Number(editingExpense.amount) / addedStock) : Number(material.last_price_per_unit || 0);

                    // Update material price
                    await supabase.from('raw_materials')
                        .update({ 
                            last_price_per_unit: Number(unitPrice.toFixed(2)),
                            updated_by_name: profile?.full_name
                        })
                        .eq('id', editingExpense.material_id);

                    // Log stock update
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: addedStock,
                        current_stock: Number(material.current_stock),
                        price: Number(unitPrice.toFixed(2)),
                        staff_name: profile?.full_name,
                        note: `Edit Pengeluaran: ${finalDesc}`
                    }]);
                }
            }

            toast.success("Pengeluaran berhasil diperbarui."); await logAudit("EDIT_DATA", "expenses", editingExpense.id, { description: finalDesc, action: "Edit Pengeluaran" });
            setEditingExpense(null);
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH', category: 'operasional', buy_unit: 'kg' });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    
    const logAudit = async (action: string, entity_type: string, entity_id: string, details: any = {}) => {
        try {
            await supabase.from('audit_logs').insert([{
                action,
                entity_type,
                entity_id,
                staff_id: profile?.id || 'unknown',
                details: {
                    ...details,
                    staff_name: profile?.full_name || 'Admin System'
                }
            }]);
            if (activeTab === 'audit') fetchAuditLogs();
        } catch(e) {}
    };

    const fetchAuditLogs = async () => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (!error && data) {
            setAuditLogs(data);
        } else {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit-logs?limit=100`);
                if (res.ok) setAuditLogs(await res.json());
            } catch(e) {}
        }
    };

    const handleUpdateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/${editingStaff.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editingStaff.full_name,
                    role: editingStaff.role,
                    password: editingStaff.password
                })
            });
            if(res.ok) {
                toast.success("Data staf berhasil diperbarui!");
                setEditingStaff(null);
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal memperbarui staf.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    const handleDeleteStaff = async (id: string) => {
        const ok = await confirm({
            title: "Hapus Staf",
            message: "Akun staf ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
            confirmText: "Ya, Hapus Staf",
            variant: "danger"
        });
        if(!ok) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staff/${id}`, {
                method: 'DELETE'
            });
            if(res.ok) {
                toast.success("Staf berhasil dihapus!");
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Gagal menghapus staf.");
            }
        } catch(error) {
            toast.error("Terjadi kesalahan jaringan.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const addIngredient = () => {
        setNewProduct(prev => ({
            ...prev,
            ingredients: [...prev.ingredients, { raw_material_id: '', name: '', qty: 0, cost: 0 }]
        }));
    };

    const updateIngredient = (index: number, field: string, value: any) => {
        setNewProduct(prev => {
            const newIngs = [...prev.ingredients];
            newIngs[index] = { ...newIngs[index], [field]: value };
            
            // Auto calculate cost if qty changes and material is selected
            if (field === 'qty' || field === 'raw_material_id') {
                const materialId = field === 'raw_material_id' ? value : newIngs[index].raw_material_id;
                const qty = field === 'qty' ? value : newIngs[index].qty;
                const mat = rawMaterials.find(m => m.id === materialId);
                if (mat) {
                    newIngs[index].cost = Number(qty) * Number(mat.last_price_per_unit || 0);
                    newIngs[index].name = mat.name;
                }
            }
            
            return { ...prev, ingredients: newIngs };
        });
    };

    const removeIngredient = (index: number) => {
        setNewProduct(prev => {
            const newIngs = [...prev.ingredients];
            newIngs.splice(index, 1);
            return { ...prev, ingredients: newIngs };
        });
    };

    const addIngredientEdit = () => {
        setEditingProduct((prev: any) => ({
            ...prev,
            ingredients: [...(prev.ingredients || []), { raw_material_id: '', name: '', qty: 0, cost: 0 }]
        }));
    };

    const updateIngredientEdit = (index: number, field: string, value: any) => {
        setEditingProduct((prev: any) => {
            const newIngs = [...(prev.ingredients || [])];
            newIngs[index] = { ...newIngs[index], [field]: value };
            
            // Auto calculate cost if qty changes and material is selected
            if (field === 'qty' || field === 'raw_material_id') {
                const materialId = field === 'raw_material_id' ? value : newIngs[index].raw_material_id;
                const qty = field === 'qty' ? value : newIngs[index].qty;
                const mat = rawMaterials.find(m => m.id === materialId);
                if (mat) {
                    newIngs[index].cost = Number(qty) * Number(mat.last_price_per_unit || 0);
                    newIngs[index].name = mat.name;
                }
            }

            return { ...prev, ingredients: newIngs };
        });
    };

    const removeIngredientEdit = (index: number) => {
        setEditingProduct((prev: any) => {
            const newIngs = [...(prev.ingredients || [])];
            newIngs.splice(index, 1);
            return { ...prev, ingredients: newIngs };
        });
    };

    return (
        <>
        <ConfirmDialog />
        <style dangerouslySetInnerHTML={{__html: `
            @media print {
                body * { visibility: hidden; }
                .print-receipt, .print-receipt * { visibility: visible; }
                .print-receipt { position: absolute; left: 0; top: 0; width: 100%; max-width: 80mm; padding: 10px; font-family: monospace; color: #000; background: #fff; }
            }
        `}} />
        <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col sm:flex-row font-sans selection:bg-blue-500/30 print:hidden text-sm md:text-base">
            {/* Sidebar */}
            <div className="w-full sm:w-[240px] md:w-[280px] bg-[#131B2C] border-b sm:border-b-0 sm:border-r border-gray-800/60 flex flex-col shrink-0 z-20">
                <div className="p-2 md:p-4 md:p-6 border-b border-gray-800/60 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-900/20">N</span>
                            Dashbrd X
                        </h1>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-2">NexPos Control Center</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-xl" title="Toggle Fullscreen">
                            <Maximize className="w-5 h-5" />
                        </button>
                        <Link href="/" className="md:hidden p-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-xl">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
                
                {/* Horizontal Scroll on Mobile, Vertical on Desktop */}
                <div className="flex-1 overflow-y-auto overflow-x-auto md:overflow-x-hidden p-4 flex flex-row md:flex-col gap-2 no-scrollbar">
                    {[
                        { id: "reconciliation", label: "Laporan Rekonsiliasi", icon: AlertTriangle },
                        { id: "history", label: "Riwayat Transaksi", icon: FileText },
                        { id: "cash_sessions", label: "Riwayat Shift", icon: Wallet },
                        { id: "inventory", label: "Produk & Stok", icon: Package },
                        { id: "raw_materials", label: "Bahan Baku", icon: Package },
                        { id: "expenses", label: "Pengeluaran", icon: FileText },
                        { id: "staff", label: "Manajemen Staf", icon: Users },
                        { id: "audit", label: "Security Log", icon: ShieldCheck },
                        { id: "settings", label: "Pengaturan Toko", icon: Settings },
                    ].filter(tab => profile?.role === 'owner' || ['reconciliation', 'history', 'cash_sessions', 'raw_materials', 'inventory', 'expenses'].includes(tab.id)).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-shrink-0 md:w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-gray-400 hover:text-white hover:bg-gray-800/40"}`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : "text-gray-500"}`} /> 
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="p-2 md:p-4 border-t border-gray-800/60 hidden md:block">
                    <Link href="/" className="hidden md:flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors w-full px-4 py-2 font-medium">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Home
                    </Link>
                    <p className="text-center text-[10px] text-gray-700 mt-3 leading-relaxed">
                        ┬⌐ {new Date().getFullYear()} NexPos<br />
                        <span className="font-medium">Developed by Matias Austin</span>
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <div className="h-20 border-b border-gray-800/60 px-6 md:px-8 flex items-center justify-between shrink-0 bg-[#0B0F19]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-white capitalize">
                            {activeTab.replace('reconciliation', 'Rekonsiliasi').replace('history', 'Riwayat Transaksi')}
                        </h2>
                        <button 
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800/40 text-gray-300 rounded-full text-sm font-semibold hover:bg-gray-700/50 transition-colors border border-gray-800"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} /> 
                            <span className="hidden md:inline">Refresh</span>
                        </button>
                    </div>

                    {/* Staff / Admin Profile Badge */}
                    <div className="flex items-center gap-3 bg-[#131B2C] border border-gray-800/60 px-4 py-2 rounded-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-sm">
                            {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="flex flex-col hidden sm:flex">
                            <span className="text-sm font-bold leading-tight text-white">{profile?.full_name || 'Admin System'}</span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{profile?.role || 'Owner Access'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">Memuat data dari server...</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Refund Modal */}
                            {refundTarget && (
                                <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-3xl p-4 md:p-6 w-full max-w-md shadow-2xl my-auto flex-shrink-0">
                                        <h3 className="font-bold text-xl text-white mb-1">Proses Refund</h3>
                                        <p className="text-gray-400 text-sm mb-5">Transaksi: <span className="text-white font-semibold">{refundTarget.order_reference}</span></p>
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5">
                                            <p className="text-yellow-400 text-sm font-semibold">Nominal Refund: Rp {Number(refundTarget.amount_received || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                        <label className="text-sm text-gray-400 font-semibold block mb-2">Alasan Refund *</label>
                                        <textarea
                                            value={refundReason}
                                            onChange={e => setRefundReason(e.target.value)}
                                            placeholder="Masukkan alasan refund..."
                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-yellow-500 resize-none h-24 mb-5"
                                        />
                                        <div className="flex gap-3">
                                            <button onClick={() => setRefundTarget(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                            <button onClick={handleConfirmRefund} className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-500">Proses Refund</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab Loading Skeleton */}
                            {tabLoading ? (
                                <div className="space-y-4">
                                    <SkeletonTable rows={3} cols={4} />
                                    <div className="grid grid-cols-3 gap-4">
                                        {[1,2,3].map(i => <div key={i} className="h-24 bg-[#131B2C] border border-gray-800 rounded-2xl animate-pulse" />)}
                                    </div>
                                </div>
                            ) : (<>

                            {/* RECONCILIATION TAB */}
                            {activeTab === "reconciliation" && (
                                <div className="space-y-6">
                                    {/* Global Tab Filter */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60 shadow-sm gap-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <h3 className="font-bold text-white">Laporan Keuangan</h3>
                                                <p className="text-xs text-gray-500">Pilih periode untuk semua metrik di bawah</p>
                                            </div>
                                            {reconciliationPeriod !== 'custom' && (
                                                <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800 h-10">
                                                    <button onClick={() => shiftReconciliationDate(-1)} className="px-4 py-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center justify-center w-12">&lt;</button>
                                                    <div className="px-4 py-2 text-sm font-bold text-white border-l border-r border-gray-800 bg-gray-800/30 flex items-center justify-center">
                                                        {reconciliationPeriod === 'daily' ? reconciliationDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) :
                                                         reconciliationPeriod === 'weekly' ? 'Minggu ' + Math.ceil(reconciliationDate.getDate()/7) :
                                                         reconciliationPeriod === 'monthly' ? reconciliationDate.toLocaleDateString('id-ID', {month:'long', year:'numeric'}) :
                                                         reconciliationDate.getFullYear()}
                                                    </div>
                                                    <button onClick={() => shiftReconciliationDate(1)} className="px-4 py-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center justify-center w-12">&gt;</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            {reconciliationPeriod === 'custom' && (
                                                <div className="flex flex-col sm:flex-row items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                                                    <input 
                                                        type="date" 
                                                        value={customDateStart}
                                                        onChange={(e) => setCustomDateStart(e.target.value)}
                                                        className="bg-[#121214] text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none w-full sm:w-auto min-h-[40px]" 
                                                    />
                                                    <span className="text-gray-500 hidden sm:block">-</span>
                                                    <input 
                                                        type="date" 
                                                        value={customDateEnd}
                                                        onChange={(e) => setCustomDateEnd(e.target.value)}
                                                        className="bg-[#121214] text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none w-full sm:w-auto min-h-[40px]" 
                                                    />
                                                    <button 
                                                        onClick={() => { if (customDateStart && customDateEnd) fetchReconciliation('custom', customDateStart, customDateEnd); }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm w-full sm:w-auto min-h-[40px]"
                                                    >
                                                        Terapkan
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex flex-wrap bg-gray-900 rounded-xl p-1 border border-gray-800 w-full md:w-fit">
                                                {[{k:'daily',l:'Harian'},{k:'weekly',l:'Mingguan'},{k:'monthly',l:'Bulanan'},{k:'yearly',l:'Tahunan'},{k:'custom',l:'Kustom'}].map(f => (
                                                    <button key={f.k} onClick={() => {
                                                        setReconciliationPeriod(f.k as any);
                                                        if (f.k !== 'custom') fetchReconciliation(f.k as any);
                                                        else if (customDateStart && customDateEnd) fetchReconciliation('custom', customDateStart, customDateEnd);
                                                    }}
                                                        className={`flex-1 md:flex-none text-center px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${reconciliationPeriod === f.k ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                                        {f.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <ReportChart period={reconciliationPeriod} customStartDate={customDateStart} customEndDate={customDateEnd} referenceDate={reconciliationDate} />

                                    {/* Data Penjualan Produk (Requested Feature) */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="p-2 md:p-4 md:p-6 border-b border-gray-800">
                                            <h3 className="font-bold text-xl text-white">Ringkasan Penjualan Produk (Terlaris)</h3>
                                            <p className="text-gray-400 text-sm mt-1">Data penjualan, HPP, dan pendapatan bersih berdasarkan periode yang dipilih.</p>
                                        </div>
                                        {productSalesData.length === 0 ? (
                                            <p className="p-8 text-gray-500 text-center">Belum ada penjualan di periode ini.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-800/50 border-b border-gray-800">
                                                            <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400">Produk</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center">Terjual</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Penghasilan Kotor</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Total HPP</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Laba Bersih</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {productSalesData.map((row, idx) => (
                                                            <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                                <td className="p-2 md:p-4">
                                                                    <div className="font-bold text-gray-200">{row.name}</div>
                                                                    <div className="text-xs text-gray-500">{row.category}</div>
                                                                </td>
                                                                <td className="p-2 md:p-4 text-center">
                                                                    <span className="px-3 py-1 bg-gray-800 text-gray-300 font-bold rounded-full text-sm">{row.terjual}</span>
                                                                </td>
                                                                <td className="p-2 md:p-4 text-right font-medium text-blue-400">Rp {row.kotor.toLocaleString('id-ID')}</td>
                                                                <td className="p-2 md:p-4 text-right font-medium text-red-400">- Rp {row.hpp_total.toLocaleString('id-ID')}</td>
                                                                <td className="p-2 md:p-4 text-right font-bold text-green-400">Rp {row.bersih.toLocaleString('id-ID')}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* QRIS & Cash Summary */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-4 md:p-6 shadow-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-400 text-sm font-medium">Total Tunai (Cash)</p>
                                                <h4 className="text-2xl font-bold text-green-400 mt-1">Rp {reconciliation.filter(r => r.method_name.toLowerCase().includes('cash') || r.method_name.toLowerCase().includes('tunai')).reduce((s, r) => s + r.pos_total, 0).toLocaleString('id-ID')}</h4>
                                            </div>
                                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
                                                <Wallet size={24} />
                                            </div>
                                        </div>
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-4 md:p-6 shadow-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-400 text-sm font-medium">Total QRIS</p>
                                                <h4 className="text-2xl font-bold text-blue-400 mt-1">Rp {reconciliation.filter(r => r.method_name.toLowerCase().includes('qris')).reduce((s, r) => s + r.pos_total, 0).toLocaleString('id-ID')}</h4>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400">
                                                <Maximize size={24} />
                                            </div>
                                        </div>
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-4 md:p-6 shadow-xl flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-400 text-sm font-medium">Total Keseluruhan</p>
                                                <h4 className="text-2xl font-bold text-white mt-1">Rp {reconciliation.reduce((s, r) => s + r.pos_total, 0).toLocaleString('id-ID')}</h4>
                                            </div>
                                            <div className="w-12 h-12 bg-gray-500/10 rounded-full flex items-center justify-center text-white">
                                                <FileText size={24} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rekonsiliasi Pembayaran */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="p-2 md:p-4 md:p-6 border-b border-gray-800">
                                            <h3 className="font-bold text-xl text-white">Rekonsiliasi Metode Pembayaran</h3>
                                        </div>
                                        {reconciliation.length === 0 ? (
                                            <p className="p-8 text-gray-500 text-center">Belum ada transaksi di periode ini.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400">Metode</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400">Trx</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">POS Total</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Provider Total</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Selisih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reconciliation.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                            <td className="p-2 md:p-4 font-medium text-gray-200">{row.method_name}</td>
                                                            <td className="p-2 md:p-4 text-gray-400">{row.transaction_count}</td>
                                                            <td className="p-2 md:p-4 text-right font-bold text-blue-400">{row.pos_total.toLocaleString('id-ID')}</td>
                                                            <td className="p-2 md:p-4 text-right text-gray-400">{row.pos_total.toLocaleString('id-ID')}</td>
                                                            <td className="p-2 md:p-4 text-right font-bold text-green-400">0</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                                </div>
                            )}

                            {/* HISTORY & REFUND TAB */}
                            {activeTab === "history" && (() => {
                                const filteredTransactions = getFilteredTransactions();

                                return (
                                    <div className="space-y-6">
                                        <div className="bg-[#131B2C] p-4 md:p-5 rounded-2xl border border-gray-800/60 shadow-lg flex flex-col md:flex-row gap-4 md:items-center justify-between">
                                            <div>
                                                <h3 className="font-bold text-white mb-2">Filter Periode Transaksi</h3>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                    {historyFilterType === 'custom' && (
                                                        <div className="flex flex-col sm:flex-row items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                                                            <input 
                                                                type="date" 
                                                                value={customDateStart}
                                                                onChange={(e) => setCustomDateStart(e.target.value)}
                                                                className="bg-[#121214] text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none w-full sm:w-auto min-h-[40px]" 
                                                            />
                                                            <span className="text-gray-500 hidden sm:block">-</span>
                                                            <input 
                                                                type="date" 
                                                                value={customDateEnd}
                                                                onChange={(e) => setCustomDateEnd(e.target.value)}
                                                                className="bg-[#121214] text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none w-full sm:w-auto min-h-[40px]" 
                                                            />
                                                            <button 
                                                                onClick={() => { if (customDateStart && customDateEnd) fetchTransactions('custom'); }}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm w-full sm:w-auto min-h-[40px]"
                                                            >
                                                                Terapkan
                                                            </button>
                                                        </div>
                                                    )}
                                                    {historyFilterType !== 'custom' && (
                                                        <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800 mr-2 h-10 w-full sm:w-auto">
                                                            <button onClick={() => shiftHistoryDate(-1)} className="px-4 py-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center justify-center w-12">&lt;</button>
                                                            <div className="px-4 py-2 text-sm font-bold text-white border-l border-r border-gray-800 bg-gray-800/30 flex items-center justify-center flex-1 sm:flex-none">
                                                                {historyFilterType === 'daily' ? historyDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) :
                                                                 historyFilterType === 'weekly' ? 'Minggu ' + Math.ceil(historyDate.getDate()/7) :
                                                                 historyFilterType === 'monthly' ? historyDate.toLocaleDateString('id-ID', {month:'long', year:'numeric'}) :
                                                                 historyDate.getFullYear()}
                                                            </div>
                                                            <button onClick={() => shiftHistoryDate(1)} className="px-4 py-2 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex items-center justify-center w-12">&gt;</button>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap bg-gray-900 rounded-xl p-1 border border-gray-800 w-full md:w-fit">
                                                        {[{k:'daily',l:'Harian'},{k:'weekly',l:'Mingguan'},{k:'monthly',l:'Bulanan'},{k:'yearly',l:'Tahunan'},{k:'custom',l:'Kustom'}].map(f => (
                                                            <button key={f.k} onClick={() => setHistoryFilterType(f.k as any)}
                                                                className={`flex-1 md:flex-none text-center px-2 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${historyFilterType === f.k ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                                                {f.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white mb-2">Urutkan Waktu</h3>
                                                <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                                                    <button onClick={() => setHistorySortOrder('desc')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${historySortOrder === 'desc' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Terbaru</button>
                                                    <button onClick={() => setHistorySortOrder('asc')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${historySortOrder === 'asc' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Terlama</button>
                                                </div>
                                            </div>
                                            <span className="text-gray-500 text-sm">{filteredTransactions.length} transaksi ditemukan</span>
                                        </div>

                                        <div className="space-y-4">
                                            {filteredTransactions.length === 0 ? (
                                                <p className="p-8 text-gray-500 text-center bg-[#131B2C] rounded-2xl border border-gray-800/60 shadow-lg">Belum ada transaksi pada periode ini.</p>
                                            ) : (
                                                filteredTransactions.map((trx: any) => {
                                                const itemCogs = trx.order_items?.reduce((sum: number, item: any) => sum + ((item.cogs_at_time || 0) * item.quantity), 0) || 0;
                                                const subTotal = trx.amount_due - (trx.tax_amount || 0);
                                                const netProfit = subTotal - itemCogs;
                                                return (
                                                    <div key={trx.id} className="p-2 md:p-4 md:p-5 bg-[#131B2C] rounded-2xl border border-gray-800/60 shadow-lg flex flex-col md:flex-row gap-4 justify-between transition-colors hover:border-blue-500/30">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="font-bold text-white text-lg">{trx.order_reference}</span>
                                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${trx.status === 'Paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : trx.status === 'Refunded' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-300'}`}>
                                                                    {trx.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-400 mb-2">Metode: <span className="text-gray-200">{trx.payment_methods?.name || 'Unknown'}</span> | {new Date(trx.created_at).toLocaleString('id-ID')}</p>
                                                            {trx.customer_name && (
                                                                <p className="text-sm text-gray-400 mb-3">Pelanggan: <span className="text-gray-200 font-bold">{trx.customer_name}</span></p>
                                                            )}
                                                    
                                                            {trx.order_items && trx.order_items.length > 0 && (
                                                                <div className="bg-gray-800/30 p-3 rounded-xl border border-gray-800 mb-3">
                                                                    <ul className="text-sm space-y-1.5 border-b border-gray-800/50 pb-2 mb-2">
                                                                        {trx.order_items.map((item: any, idx: number) => (
                                                                            <li key={idx} className="flex justify-between text-gray-300">
                                                                                <span><span className="text-gray-500 mr-2">{item.quantity}x</span> {item.product_name}</span>
                                                                                <span className="text-gray-400">Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                    <div className="text-xs text-gray-400 space-y-1">
                                                                        {(trx.tax_amount || 0) > 0 && (
                                                                            <div className="flex justify-between">
                                                                                <span>Pajak</span>
                                                                                <span>Rp {Number(trx.tax_amount).toLocaleString('id-ID')}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between">
                                                                            <span>Diterima ({trx.payment_methods?.name || 'Cash'})</span>
                                                                            <span>Rp {Number(trx.amount_received).toLocaleString('id-ID')}</span>
                                                                        </div>
                                                                        {(trx.change_given || 0) > 0 && (
                                                                            <div className="flex justify-between font-bold text-gray-300">
                                                                                <span>Kembalian</span>
                                                                                <span>Rp {Number(trx.change_given).toLocaleString('id-ID')}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex gap-4 text-xs font-bold bg-blue-900/10 p-3 rounded-xl border border-blue-900/30 inline-flex">
                                                                <div>
                                                                    <p className="text-gray-500 mb-1">HPP</p>
                                                                    <p className="text-orange-400">Rp {itemCogs.toLocaleString('id-ID')}</p>
                                                                </div>
                                                                <div className="w-px bg-gray-800"></div>
                                                                <div>
                                                                    <p className="text-gray-500 mb-1">Laba Bersih</p>
                                                                    <p className="text-green-400">Rp {netProfit.toLocaleString('id-ID')}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="text-right min-w-[150px] flex flex-col justify-between items-end">
                                                            <div className="w-full">
                                                                <p className="text-sm text-gray-500 mb-1">Total</p>
                                                                <p className="font-bold text-lg md:text-2xl text-white">Rp {trx.amount_due.toLocaleString('id-ID')}</p>
                                                            </div>
                                                            
                                                            <div className="flex flex-col gap-2 mt-4 w-full">
                                                                {trx.status === 'Paid' && (
                                                                    <>
                                                                        <button 
                                                                            onClick={() => handleRefund(trx)}
                                                                            className="w-full px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors"
                                                                        >
                                                                            Refund
                                                                        </button>

                                                                        <button 
                                                                            onClick={() => {
                                                                                setPrintTransaction(trx);
                                                                                setTimeout(() => window.print(), 100);
                                                                            }}
                                                                            className="w-full px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                                            Cetak Desain (Web)
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {profile?.role === 'owner' && (
                                                                    <button 
                                                                        onClick={() => handleDeleteTransaction(trx)}
                                                                        className="w-full px-4 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-700 hover:text-white transition-colors"
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                                                        {/* CASH SESSIONS TAB */}
                            {activeTab === "cash_sessions" && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-xl text-white border-b border-gray-800 pb-3 mb-4">Riwayat Shift Kasir (Arus Kas Laci)</h3>
                                    {cashSessions.length === 0 ? (
                                        <p className="p-8 text-center text-gray-500 bg-[#131B2C] rounded-2xl border border-gray-800">Belum ada riwayat shift kasir.</p>
                                    ) : (
                                        cashSessions.map((session: any) => (
                                            <div key={session.id} className="p-4 bg-[#131B2C] rounded-2xl border border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <p className="text-gray-300 font-bold mb-1">
                                                        Shift ID: {session.id.substring(0, 8)} 
                                                        <span className={`ml-3 text-xs px-2 py-1 rounded-full ${session.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                                            {session.status.toUpperCase()}
                                                        </span>
                                                    </p>
                                                    <p className="text-sm text-gray-400 mb-1">Kasir ID: {session.staff_id || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">
                                                        Buka: {new Date(session.opened_at).toLocaleString('id-ID')}
                                                        {session.closed_at && ` | Tutup: ${new Date(session.closed_at).toLocaleString('id-ID')}`}
                                                    </p>
                                                    {profile?.role === 'owner' && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            <button onClick={() => { setEditingSessionId(session.id); setEditingOpeningCash(String(session.opening_cash || 0)); }} disabled={loading} className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/20 w-fit transition-colors">Edit Modal</button>
                                                            <button onClick={() => handleDeleteSession(session.id)} disabled={loading} className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500/20 w-fit transition-colors">Hapus Shift</button>
                                                        </div>
                                                    )}
</div>
                                                <div className="flex flex-col gap-1 text-sm bg-gray-900/50 p-3 rounded-xl border border-gray-800 min-w-[200px]">
                                                    <div className="flex justify-between text-gray-400"><span>Modal Awal (Buka)</span><span>Rp {Number(session.opening_cash).toLocaleString('id-ID')}</span></div>
                                                    <div className="flex justify-between text-green-400"><span>Pendapatan (Cash)</span><span>+Rp {Number(session.expected_cash - session.opening_cash + (session.total_expense || 0) + (session.total_refund || 0)).toLocaleString('id-ID')}</span></div>
                                                    <div className="flex justify-between text-red-400"><span>Pengeluaran (Cash)</span><span>-Rp {Number(session.total_expense || 0).toLocaleString('id-ID')}</span></div>
                                                    <div className="flex justify-between text-yellow-400"><span>Refund</span><span>-Rp {Number(session.total_refund || 0).toLocaleString('id-ID')}</span></div>
                                                    <div className="flex justify-between text-blue-400"><span>Sisa/Target (Sistem)</span><span>Rp {Number(session.expected_cash).toLocaleString('id-ID')}</span></div>
                                                    {session.status === 'closed' && (
                                                        <>
                                                            <div className="flex justify-between text-green-400 font-bold border-t border-gray-700 mt-1 pt-1"><span>Aktual di Laci (Tutup)</span><span>Rp {Number(session.actual_cash).toLocaleString('id-ID')}</span></div>
                                                            <div className={`flex justify-between font-bold ${Number(session.difference) < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                                                                <span>Selisih</span><span>Rp {Number(session.difference).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            {session.discrepancy_reason && <p className="text-xs text-red-400 mt-1 italic">"{session.discrepancy_reason}"</p>}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Edit Opening Cash Modal */}
                                    {editingSessionId && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                                                <h3 className="font-bold text-xl text-white mb-2">Edit Modal Awal Shift</h3>
                                                <p className="text-gray-400 text-sm mb-5">Ubah jumlah uang modal pembuka shift ini.</p>
                                                <div className="mb-5">
                                                    <label className="text-sm font-bold text-gray-400 block mb-2">Nominal Modal Awal (Rp)</label>
                                                    <input
                                                        type="number"
                                                        value={editingOpeningCash}
                                                        onChange={e => setEditingOpeningCash(e.target.value)}
                                                        className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-lg font-bold"
                                                        placeholder="Contoh: 500000"
                                                    />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button onClick={() => { setEditingSessionId(null); setEditingOpeningCash(''); }} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                    <button onClick={handleEditOpeningCash} disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">{loading ? 'Menyimpan...' : 'Simpan'}</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* INVENTORY TAB */}
                            {activeTab === "inventory" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateProduct} className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                        <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Tambah Produk Baru</h3>
                                        
                                        {/* Upload Gambar */}
                                        <div className="flex items-center gap-4 md:p-6 mb-6">
                                            <div className="w-24 h-24 rounded-2xl bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {newProduct.image_url 
                                                    ? <img src={newProduct.image_url} alt="preview" className="w-full h-full object-cover" />
                                                    : <span className="text-2xl md:text-4xl">{newProduct.image_icon || '≡ƒôª'}</span>
                                                }
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Foto Menu</label>
                                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors border border-gray-700">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                    Upload & Compress
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(e, false)} />
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">Gambar otomatis dikompres ke WebP Γëñ 30KB</p>
                                                {newProduct.image_url && <button type="button" onClick={() => setNewProduct(p => ({...p, image_url: ''}))} className="text-xs text-red-400 mt-1 hover:underline">Hapus foto</button>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:p-5 mb-6">
                                            <input type="text" placeholder="Nama Produk" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <CategoryDropdown
                                                value={newProduct.category}
                                                onChange={(v) => setNewProduct({...newProduct, category: v})}
                                                categories={storeSettings.categories}
                                                onAdd={handleAddCategory}
                                                onRemove={handleRemoveCategory}
                                            />
                                            <input type="text" placeholder="Icon Emoji (opsional)" value={newProduct.image_icon} onChange={e => setNewProduct({...newProduct, image_icon: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <div><label className="text-xs text-gray-500 mb-2 block">Harga Jual (Rp)</label><input type="number" placeholder="0" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                            <div><label className="text-xs text-gray-500 mb-2 block">HPP Bahan (Rp) <span className="text-gray-600 font-normal">(auto jika ada ingredient)</span></label><input type="number" placeholder="0" required value={newProduct.cogs} onChange={e => setNewProduct({...newProduct, cogs: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                            <div><label className="text-xs text-gray-500 mb-2 block">Biaya Operasional (Rp)</label><input type="number" placeholder="3000" value={newProduct.operational_cost ?? OPERATIONAL_COST} onChange={e => setNewProduct({...newProduct, operational_cost: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                            <div><label className="text-xs text-gray-500 mb-2 block">Stok Awal</label><input type="number" placeholder="0" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
                                        </div>
                                        
                                        <div className="mb-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-bold text-gray-300">Bahan Baku (Opsional)</h4>
                                                <button type="button" onClick={addIngredient} className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20">+ Tambah</button>
                                            </div>
                                            {newProduct.ingredients.map((ing, i) => (
                                                <div key={i} className="flex gap-2 items-center mb-3 flex-wrap">
                                                    <select
                                                        value={ing.raw_material_id || (ing as any).id || ''}
                                                        onChange={(e) => updateIngredient(i, 'raw_material_id', e.target.value)}
                                                        className="flex-1 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none"
                                                    >
                                                        <option value="">-- Manual (Ketik Nama) --</option>
                                                        {rawMaterials.map(m => (
                                                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                        ))}
                                                    </select>
                                                    {!ing.raw_material_id && (
                                                        <input type="text" placeholder="Bahan" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} className="w-1/3 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    )}
                                                    {ing.raw_material_id && (
                                                        <input type="number" placeholder="Qty/Porsi" value={ing.qty || ''} onChange={(e) => updateIngredient(i, 'qty', Number(e.target.value))} className="w-24 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required step="any" />
                                                    )}
                                                    <input type="number" placeholder="Biaya (Rp)" value={ing.cost || ''} onChange={(e) => updateIngredient(i, 'cost', Number(e.target.value))} className="w-28 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                    <button type="button" onClick={() => removeIngredient(i)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus</button>
                                                </div>
                                            ))}
                                            {newProduct.ingredients.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-800">
                                                    <div className="flex justify-between text-sm text-gray-400">
                                                        <span>HPP Bahan</span>
                                                        <span>Rp {newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0).toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm text-orange-400">
                                                        <span>Biaya Operasional</span>
                                                        <span>Rp {(newProduct.operational_cost ?? OPERATIONAL_COST).toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-blue-400 border-t border-gray-700 mt-1 pt-1">
                                                        <span>Total HPP</span>
                                                        <span>Rp {(newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0) + (newProduct.operational_cost ?? OPERATIONAL_COST)).toLocaleString('id-ID')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-4 p-4 bg-[#0B1526] border border-blue-900/40 rounded-xl">
                                            <h4 className="font-bold text-blue-300 mb-3 text-sm">🏷️ Diskon Produk</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        min="0"
                                                        max="100"
                                                        value={newProduct.discount_percentage || ''}
                                                        onChange={e => setNewProduct({...newProduct, discount_percentage: Number(e.target.value)})}
                                                        className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                    />
                                                </div>
                                                {(newProduct.discount_percentage || 0) > 0 && (
                                                    <div className="flex-1 text-right">
                                                        <div className="text-xs text-gray-500">Harga setelah diskon</div>
                                                        <div className="font-bold text-green-400 text-lg">Rp {(newProduct.price * (1 - (newProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}</div>
                                                        <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{newProduct.discount_percentage}% OFF</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="my-6">
                                            <ProductOptionsEditor
                                                options={newProduct.options_config || []}
                                                onChange={(opts) => setNewProduct(p => ({ ...p, options_config: opts }))}
                                            />
                                        </div>

                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">
                                            {loading ? 'Menyimpan...' : 'Simpan Produk'}
                                        </button>
                                    </form>

                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse text-xs md:text-sm">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400">Produk</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Harga Jual</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-right">Profit</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center">Stok</th>
<th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center">Status</th>
<th className="p-2 md:p-4 text-xs md:text-sm font-semibold text-gray-400 text-center">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>

                                                    {products.map((p: any) => (
                                                        <tr key={p.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                            <td className="p-2 md:p-4 flex items-center gap-4">
                                                                <div className="w-14 h-14 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                                                                    {p.image_url 
                                                                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                                        : <span>{p.image_icon || '≡ƒôª'}</span>
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white text-base">{p.name}</p>
                                                                    <p className="text-xs text-gray-500">{p.category}</p>
                                                                    {p.options_config && p.options_config.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                                            {p.options_config.map((opt: any, idx: number) => (
                                                                                <span key={idx} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                                                                                    {opt.type === 'multiple' ? '🥛' : '🧊'} {opt.name} ({opt.choices?.length || 0})
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-2 md:p-4 text-right">
                                                                <p className="font-bold text-gray-200">Rp {p.price.toLocaleString('id-ID')}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    HPP: Rp {p.cogs.toLocaleString('id-ID')}
                                                                    {p.ingredients && p.ingredients.length > 0 && ` (${p.ingredients.length} Bahan)`}
                                                                </p>
                                                            </td>
                                                            <td className="p-2 md:p-4 text-right font-bold text-green-400">Rp {(p.price - p.cogs).toLocaleString('id-ID')}</td>
                                                            <td className="p-2 md:p-4 text-center">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-800 text-gray-300'}`}>{p.stock}</span>
                                                            </td>
<td className="p-2 md:p-4 text-center">
    <button onClick={() => toggleProductStatus(p)} disabled={loading} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${p.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
        {p.is_active ? 'Tersedia' : 'Habis/Off'}
    </button>
</td>
<td className="p-2 md:p-4 text-center">
                                                                <div className="flex flex-wrap gap-2 justify-center">
                                                                    <button onClick={() => setAdjustingProductStock(p)} className="px-2 py-1 text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-600 hover:text-white transition-colors">+/- Stok</button>
                                                                    <button onClick={() => handleViewProductHistory(p)} className="px-2 py-1 text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-600 hover:text-white transition-colors">Riwayat</button>
                                                                    <button onClick={() => setEditingProduct({ ...p, options_config: Array.isArray(p.options_config) ? p.options_config : [] })} className="px-2 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Edit</button>
                                                                    <button onClick={() => handleDeleteProduct(p)} className="px-2 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors">Hapus</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    

                                    {/* Riwayat Penjualan Produk di Tab Inventory */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl mt-8">
                                        <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-lg md:text-xl text-white">📊 Riwayat & Ringkasan Penjualan Produk</h3>
                                                <p className="text-gray-400 text-xs md:text-sm mt-0.5">Total porsi terjual dan riwayat omset per produk.</p>
                                            </div>
                                        </div>
                                        {inventorySalesData.length === 0 ? (
                                            <p className="p-8 text-gray-500 text-center text-sm">Belum ada data riwayat penjualan tercatat.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse text-xs md:text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-800/50 border-b border-gray-800">
                                                            <th className="p-3 md:p-4 text-gray-400 font-semibold">Produk</th>
                                                            <th className="p-3 md:p-4 text-gray-400 font-semibold text-center">Total Terjual</th>
                                                            <th className="p-3 md:p-4 text-gray-400 font-semibold text-right">Total Omset</th>
                                                            <th className="p-3 md:p-4 text-gray-400 font-semibold text-center">Penjualan Terakhir</th>
                                                            <th className="p-3 md:p-4 text-gray-400 font-semibold text-center">Aksi</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {inventorySalesData.map((item: any, idx: number) => {
                                                            const matchedProd = products.find((p: any) => p.id === item.product_id || p.name === item.product_name);
                                                            return (
                                                                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                                                    <td className="p-3 md:p-4">
                                                                        <div className="font-bold text-white text-sm">{item.product_name || matchedProd?.name || 'Produk'}</div>
                                                                        <div className="text-[11px] text-gray-500">{matchedProd?.category || '-'}</div>
                                                                    </td>
                                                                    <td className="p-3 md:p-4 text-center">
                                                                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold text-xs">
                                                                            {item.total_sold} porsi
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 md:p-4 text-right font-bold text-green-400">
                                                                        Rp {Number(item.total_revenue).toLocaleString('id-ID')}
                                                                    </td>
                                                                    <td className="p-3 md:p-4 text-center text-gray-400 text-xs">
                                                                        {item.last_sold ? new Date(item.last_sold).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                                    </td>
                                                                    <td className="p-3 md:p-4 text-center">
                                                                        <button
                                                                            onClick={() => handleViewProductHistory(matchedProd || { id: item.product_id, name: item.product_name })}
                                                                            className="px-2.5 py-1 text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-600 hover:text-white transition-colors"
                                                                        >
                                                                            Riwayat Detail
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit Product Modal */}
                                    {editingProduct && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md overflow-y-auto">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-2xl sm:max-w-3xl shadow-2xl my-auto flex-shrink-0">
                                                <h3 className="font-bold text-xl text-white mb-6">Edit Produk: {editingProduct.name}</h3>
                                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                                    {/* Image Upload Edit */}
                                                    <div className="flex items-center gap-4 md:p-5 mb-2">
                                                        <div className="w-20 h-20 rounded-xl bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {editingProduct.image_url 
                                                                ? <img src={editingProduct.image_url} alt={editingProduct.name} className="w-full h-full object-cover" />
                                                                : <span className="text-2xl md:text-3xl">{editingProduct.image_icon || '≡ƒôª'}</span>
                                                            }
                                                        </div>
                                                        <div>
                                                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors border border-gray-700">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                                Ganti Foto
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(e, true)} />
                                                            </label>
                                                            {editingProduct.image_url && <button type="button" onClick={() => setEditingProduct((p: any) => ({...p, image_url: ''}))} className="block text-xs text-red-400 mt-1 hover:underline">Hapus foto</button>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Nama Produk</label>
                                                        <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Kategori</label>
                                                        <CategoryDropdown
                                                            value={editingProduct.category}
                                                            onChange={(v) => setEditingProduct({...editingProduct, category: v})}
                                                            categories={storeSettings.categories}
                                                            onAdd={handleAddCategory}
                                                            onRemove={handleRemoveCategory}
                                                        />
                                                    </div>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">Harga Jual</label>
                                                            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">HPP Bahan <span className="font-normal text-gray-600">(auto jika ada ingredient)</span></label>
                                                            <input type="number" value={editingProduct.cogs} onChange={e => setEditingProduct({...editingProduct, cogs: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">Biaya Operasional (Rp)</label>
                                                            <input type="number" value={editingProduct.operational_cost ?? OPERATIONAL_COST} onChange={e => setEditingProduct({...editingProduct, operational_cost: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" />
                                                        </div>
                                                    </div>

                                                    <div className="mb-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="font-bold text-gray-300">Bahan Baku (Opsional)</h4>
                                                            <button type="button" onClick={addIngredientEdit} className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20">+ Tambah</button>
                                                        </div>
                                                        {(editingProduct.ingredients || []).map((ing: any, i: number) => (
                                                            <div key={i} className="flex gap-2 items-center mb-3 flex-wrap">
                                                                <select
                                                                    value={ing.raw_material_id || (ing as any).id || ''}
                                                                    onChange={(e) => updateIngredientEdit(i, 'raw_material_id', e.target.value)}
                                                                    className="flex-1 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none"
                                                                >
                                                                    <option value="">-- Manual (Ketik Nama) --</option>
                                                                    {rawMaterials.map(m => (
                                                                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                    ))}
                                                                </select>
                                                                {!ing.raw_material_id && (
                                                                    <input type="text" placeholder="Bahan" value={ing.name} onChange={(e) => updateIngredientEdit(i, 'name', e.target.value)} className="w-1/3 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                                )}
                                                                {ing.raw_material_id && (
                                                                    <input type="number" placeholder="Qty/Porsi" value={ing.qty || ''} onChange={(e) => updateIngredientEdit(i, 'qty', Number(e.target.value))} className="w-24 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required step="any" />
                                                                )}
                                                                <input type="number" placeholder="Biaya (Rp)" value={ing.cost || ''} onChange={(e) => updateIngredientEdit(i, 'cost', Number(e.target.value))} className="w-28 p-2 bg-[#0B0F19] border border-gray-800 rounded-lg text-white outline-none" required />
                                                                <button type="button" onClick={() => removeIngredientEdit(i)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus</button>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-4 p-4 bg-[#0B1526] border border-blue-900/40 rounded-xl">
                                                        <h4 className="font-bold text-blue-300 mb-3 text-sm">🏷️ Diskon Produk</h4>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1">
                                                                <label className="text-xs text-gray-500 mb-1 block">Diskon (%)</label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    min="0"
                                                                    max="100"
                                                                    value={editingProduct.discount_percentage || ''}
                                                                    onChange={e => setEditingProduct({...editingProduct, discount_percentage: Number(e.target.value)})}
                                                                    className="w-full p-3 bg-[#0B0F19] border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                                />
                                                            </div>
                                                            {(editingProduct.discount_percentage || 0) > 0 && (
                                                                <div className="flex-1 text-right">
                                                                    <div className="text-xs text-gray-500">Harga setelah diskon</div>
                                                                    <div className="font-bold text-green-400 text-lg">Rp {(editingProduct.price * (1 - (editingProduct.discount_percentage || 0) / 100)).toLocaleString('id-ID')}</div>
                                                                    <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">{editingProduct.discount_percentage}% OFF</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4">
                                                        <ProductOptionsEditor
                                                            options={editingProduct.options_config || []}
                                                            onChange={(opts) => setEditingProduct((p: any) => ({ ...p, options_config: opts }))}
                                                        />
                                                    </div>

                                                    <div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                    
                                      {/* Adjust Product Stock Modal */}
                                    {adjustingProductStock && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md overflow-y-auto">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-sm shadow-2xl my-auto flex-shrink-0">
                                                <h3 className="font-bold text-xl text-white mb-2">Update Stok</h3>
                                                <p className="text-gray-400 mb-6 font-bold">{adjustingProductStock.name}</p>
                                                <form onSubmit={handleUpdateProductStock} className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Stok Saat Ini: {adjustingProductStock.stock}</label>
                                                        <div className="flex items-center gap-3">
                                                            <button type="button" onClick={() => setProductStockDelta(productStockDelta - 1)} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">-</button>
                                                            <input type="number" className="flex-1 text-center bg-gray-900 border border-gray-800 rounded-xl py-3 text-white font-bold text-lg outline-none focus:border-blue-500" value={productStockDelta || ""} onChange={e => setProductStockDelta(Number(e.target.value) || 0)} />
                                                            <button type="button" onClick={() => setProductStockDelta(productStockDelta + 1)} className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-2xl font-black border border-gray-700">+</button>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-2">Gunakan tombol - untuk mengurangi stok.</p>
                                                    </div>
                                                    <div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => { setAdjustingProductStock(null); setProductStockDelta(0); }} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Update</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* Product History Modal */}
                                    {viewingProductHistory && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md overflow-y-auto">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl my-auto flex-shrink-0">
                                                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                                                    <div>
                                                        <h3 className="font-bold text-xl text-white">Riwayat Terjual</h3>
                                                        <p className="text-gray-400 font-bold">{viewingProductHistory.name}</p>
                                                    </div>
                                                    <button onClick={() => setViewingProductHistory(null)} className="w-10 h-10 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-colors">X</button>
                                                </div>
                                                
                                                <div className="max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                                                    {historyLoading ? (
                                                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                                            <p className="text-gray-400 text-sm">Memuat data riwayat penjualan...</p>
                                                        </div>
                                                    ) : productHistoryData.length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500">Belum ada data penjualan untuk produk ini.</div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            <div className="flex gap-2 p-3 bg-gray-800/50 rounded-xl mb-4 text-center border border-gray-700">
                                                                <div className="flex-1">
                                                                    <div className="text-[10px] text-gray-400 font-bold">Total Terjual</div>
                                                                    <div className="text-sm font-bold text-white">{productHistoryData.reduce((sum: number, h: any) => sum + h.quantity, 0)}</div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-[10px] text-gray-400 font-bold">Pendapatan</div>
                                                                    <div className="text-sm font-bold text-green-400">Rp {productHistoryData.reduce((sum: number, h: any) => sum + (h.quantity * h.price_at_time), 0).toLocaleString('id-ID')}</div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="text-[10px] text-gray-400 font-bold">Rata-rata Harga</div>
                                                                    <div className="text-sm font-bold text-blue-400">Rp {Math.round(productHistoryData.reduce((sum: number, h: any) => sum + (h.quantity * h.price_at_time), 0) / productHistoryData.reduce((sum: number, h: any) => sum + h.quantity, 0)).toLocaleString('id-ID')}</div>
                                                                </div>
                                                            </div>

                                                            {productHistoryData.map((hist: any, idx: number) => (
                                                                <div key={idx} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex justify-between items-center">
                                                                    <div>
                                                                        <div className="font-bold text-white mb-1">Terjual: {hist.quantity} porsi</div>
                                                                        <div className="text-xs text-gray-500">{new Date(hist.created_at).toLocaleString('id-ID')}</div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-sm font-bold text-green-400 mb-1">Rp {hist.price_at_time.toLocaleString('id-ID')}</div>
                                                                        <div className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-400 inline-block">Order: {hist.transaction?.order_reference || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* EXPENSES & RAW MATERIALS TAB */}
                            {activeTab === "expenses" && (
                                <div className="space-y-8">
                                    {/* INPUTS ROW */}
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* Pengeluaran */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Catat Pengeluaran</h3>
                                            <form onSubmit={handleCreateExpense} className="space-y-4">
                                                <div className="flex gap-4 mb-2">
                                                    <label className="flex items-center gap-2 text-white cursor-pointer text-sm">
                                                        <input type="radio" name="admin_payment_method" value="CASH" checked={newExpense.payment_method === 'CASH'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4" />
                                                        <span>Uang Kasir (Cash)</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 text-white cursor-pointer text-sm">
                                                        <input type="radio" name="admin_payment_method" value="QRIS" checked={newExpense.payment_method === 'QRIS'} onChange={e => setNewExpense({...newExpense, payment_method: e.target.value})} className="w-4 h-4" />
                                                        <span>Saldo Rek (QRIS)</span>
                                                    </label>
                                                </div>

                                                {/* Category selector */}
                                                <div className="flex gap-3 mb-2">
                                                    <button type="button"
                                                        onClick={() => setNewExpense({...newExpense, category: 'operasional', material_id: ''})}
                                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                                                            newExpense.category === 'operasional'
                                                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                                        }`}
                                                    >⚙️ Operasional</button>
                                                    <button type="button"
                                                        onClick={() => setNewExpense({...newExpense, category: 'bahan_baku'})}
                                                        className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all ${
                                                            newExpense.category === 'bahan_baku'
                                                                ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                                                        }`}
                                                    >🧪 Bahan Baku</button>
                                                </div>

                                                <input type="text" placeholder="Deskripsi Pengeluaran" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <input type="number" placeholder="Nominal (Rp)" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                
                                                {newExpense.category === 'bahan_baku' && (
                                                    <div className="space-y-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-xs text-green-400 font-bold block">Bahan Baku (Wajib Dipilih)</label>
                                                            <button type="button" onClick={() => setShowInlineAddMaterial(prev => !prev)}
                                                                className="text-xs text-blue-400 hover:text-blue-300 font-bold border border-blue-500/20 px-2 py-1 rounded-lg bg-blue-500/10">
                                                                {showInlineAddMaterial ? '✕ Tutup' : '+ Tambah Bahan Baru'}
                                                            </button>
                                                        </div>
                                                        
                                                        {showInlineAddMaterial && (
                                                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-2">
                                                                <p className="text-xs text-blue-300 font-bold">Tambah Bahan Baku Baru</p>
                                                                <div className="flex gap-2">
                                                                    <input type="text" placeholder="Nama Bahan" value={inlineNewMaterial.name} onChange={e => setInlineNewMaterial({...inlineNewMaterial, name: e.target.value})} className="flex-1 p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm outline-none" />
                                                                    <select value={inlineNewMaterial.unit} onChange={e => setInlineNewMaterial({...inlineNewMaterial, unit: e.target.value})} className="w-32 p-2 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm outline-none font-semibold">
                                                                        <option value="g">Gram (g)</option>
                                                                        <option value="ml">Mililiter (ml)</option>
                                                                        <option value="pcs">Pieces (pcs)</option>
                                                                        <option value="kg">Kilogram (kg)</option>
                                                                        <option value="liter">Liter (l)</option>
                                                                        <option value="pack">Pack</option>
                                                                        <option value="dus">Dus</option>
                                                                        <option value="botol">Botol</option>
                                                                        <option value="kaleng">Kaleng</option>
                                                                    </select>
                                                                </div>
                                                                <button type="button" onClick={handleInlineAddMaterial} disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-500">+ Simpan Bahan Baru</button>
                                                            </div>
                                                        )}
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <select 
                                                                    value={newExpense.material_id || ''} 
                                                                    onChange={e => {
                                                                        const mId = e.target.value;
                                                                        const m = rawMaterials.find(rm => rm.id === mId);
                                                                        setNewExpense({
                                                                            ...newExpense, 
                                                                            material_id: mId,
                                                                            buy_unit: m ? (m.unit === 'g' ? 'kg' : m.unit === 'ml' ? 'liter' : m.unit) : newExpense.buy_unit || 'kg'
                                                                        });
                                                                    }}
                                                                    className={`w-full p-3 bg-gray-900 border rounded-xl focus:border-blue-500 outline-none text-white ${
                                                                        newExpense.category === 'bahan_baku' && !newExpense.material_id ? 'border-red-500/50' : 'border-gray-800'
                                                                    }`}
                                                                    required={newExpense.category === 'bahan_baku'}
                                                                >
                                                                    <option value="">-- Pilih Bahan Baku --</option>
                                                                    {rawMaterials.map(m => (
                                                                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                    ))}
                                                                </select>
                                                                {newExpense.category === 'bahan_baku' && !newExpense.material_id && (
                                                                    <p className="text-[10px] text-red-400 mt-1">Pilih bahan baku wajib untuk kategori ini</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="flex gap-2">
                                                                    <input 
                                                                        type="number" 
                                                                        step="any"
                                                                        placeholder="Kuantitas" 
                                                                        value={newExpense.quantity || ''} 
                                                                        onChange={e => setNewExpense({...newExpense, quantity: Number(e.target.value)})}
                                                                        className="flex-1 p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                                    />
                                                                    <select 
                                                                        value={newExpense.buy_unit || 'kg'} 
                                                                        onChange={e => setNewExpense({...newExpense, buy_unit: e.target.value})}
                                                                        className="w-24 p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-xs font-bold"
                                                                    >
                                                                        <option value="kg">kg</option>
                                                                        <option value="g">gram (g)</option>
                                                                        <option value="liter">liter (l)</option>
                                                                        <option value="ml">ml</option>
                                                                        <option value="pcs">pcs</option>
                                                                        <option value="pack">pack</option>
                                                                        <option value="dus">dus</option>
                                                                        <option value="botol">botol</option>
                                                                        <option value="kaleng">kaleng</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(() => {
                                                            const mat = rawMaterials.find(m => m.id === newExpense.material_id);
                                                            if (!mat || !newExpense.quantity || !newExpense.amount) return null;
                                                            let mult = 1;
                                                            const bUnit = newExpense.buy_unit || mat.unit;
                                                            if ((mat.unit === 'g' || mat.unit === 'gr') && bUnit === 'kg') mult = 1000;
                                                            else if (mat.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;
                                                            const totalUnits = Number(newExpense.quantity) * mult;
                                                            const unitPrice = totalUnits > 0 ? (Number(newExpense.amount) / totalUnits) : 0;
                                                            return (
                                                                <div className="text-[11px] bg-green-950/40 border border-green-500/30 p-2.5 rounded-lg text-green-300">
                                                                    <span className="font-bold">Konversi:</span> {newExpense.quantity} {bUnit} = {totalUnits.toLocaleString('id-ID')} {mat.unit}
                                                                    <br />
                                                                    <span className="font-bold">Harga per {mat.unit}:</span> Rp {unitPrice.toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {mat.unit}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                <button type="submit" disabled={loading} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 mt-2">Catat Pengeluaran</button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* TABLES ROW */}
                                    <div className="grid grid-cols-1 gap-8">
                                        {/* Pengeluaran */}
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="p-2 md:p-4 bg-gray-800/30 border-b border-gray-800 flex flex-col md:flex-row gap-3 justify-between md:items-center">
                                                <h3 className="font-bold text-gray-300">Riwayat Pengeluaran</h3>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {/* Category filter */}
                                                    <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                                        {[{k:'all',l:'Semua'},{k:'bahan_baku',l:'🧪 Bahan'},{k:'operasional',l:'⚙️ Operasional'}].map(f => (
                                                            <button key={f.k} onClick={() => setExpenseCategoryFilter(f.k as any)}
                                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                                                    expenseCategoryFilter === f.k ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                                                                }`}>{f.l}</button>
                                                        ))}
                                                    </div>
                                                    {/* Period filter */}
                                                    <div className="flex flex-wrap bg-gray-900 rounded-lg p-1 border border-gray-700 w-full md:w-fit">
                                                        {[{k:'all',l:'Semua'},{k:'daily',l:'Harian'},{k:'weekly',l:'Mingguan'},{k:'monthly',l:'Bulanan'},{k:'yearly',l:'Tahunan'}].map(f => (
                                                            <button key={f.k} onClick={() => setExpensePeriod(f.k as any)}
                                                                className={`flex-1 md:flex-none text-center px-2 py-1.5 md:px-3 md:py-1 rounded-md text-[10px] md:text-xs font-bold transition-all ${expensePeriod === f.k ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                                                                {f.l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => setExpenseSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                                        className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md text-white border border-gray-700 h-full">
                                                        Sort: {expenseSortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                                                    </button>
                                                </div>
                                            </div>
                                    {(() => {
                                                const filteredExpenses = getFilteredExpenses();
                                                const getExpCategory = (e: any) => (e.category || (e.raw_material_id ? 'bahan_baku' : 'operasional')).toLowerCase();
                                                const totalBahanBaku = filteredExpenses.filter(e => getExpCategory(e) === 'bahan_baku').reduce((s, e) => s + Number(e.amount), 0);
                                                const totalOperasional = filteredExpenses.filter(e => getExpCategory(e) === 'operasional').reduce((s, e) => s + Number(e.amount), 0);
                                                return filteredExpenses.length === 0 ? (
                                                    <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada pengeluaran pada periode ini.</p>
                                                ) : (
                                                    <>
                                                    {/* Summary by category */}
                                                    <div className="flex gap-3 p-3 bg-gray-800/40 border-b border-gray-800">
                                                        <div className="flex-1 text-center">
                                                            <div className="text-[10px] text-green-400 font-bold">🧪 Bahan Baku</div>
                                                            <div className="text-sm font-bold text-white">Rp {totalBahanBaku.toLocaleString('id-ID')}</div>
                                                        </div>
                                                        <div className="w-px bg-gray-700"></div>
                                                        <div className="flex-1 text-center">
                                                            <div className="text-[10px] text-orange-400 font-bold">⚙️ Operasional</div>
                                                            <div className="text-sm font-bold text-white">Rp {totalOperasional.toLocaleString('id-ID')}</div>
                                                        </div>
                                                        <div className="w-px bg-gray-700"></div>
                                                        <div className="flex-1 text-center">
                                                            <div className="text-[10px] text-gray-400 font-bold">Total</div>
                                                            <div className="text-sm font-bold text-red-400">Rp {(totalBahanBaku + totalOperasional).toLocaleString('id-ID')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="overflow-x-auto max-h-[600px]">
                                                        <table className="w-full text-left text-xs md:text-sm">
                                                            <tbody>
                                                                {filteredExpenses.map((exp: any) => {
                                                                    const isBahan = getExpCategory(exp) === 'bahan_baku';
                                                                    return (
                                                                        <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                            <td className="p-2 md:p-4">
                                                                                <p className="font-bold text-white">{exp.description}</p>
                                                                                <p className="text-xs text-gray-500">{new Date(exp.expense_date || exp.created_at).toLocaleString('id-ID')}</p>
                                                                            </td>
                                                                            <td className="p-2 md:p-4 text-center">
                                                                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                                                                                    isBahan
                                                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                                                }`}>
                                                                                    {isBahan ? '🧪 Bahan' : '⚙️ Ops'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-2 md:p-4 text-center">
                                                                                {exp.staff_name ? (
                                                                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{exp.staff_name}</span>
                                                                                ) : (
                                                                                    <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Owner</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="p-2 md:p-4 text-right font-bold text-red-400 whitespace-nowrap">- Rp {Number(exp.amount).toLocaleString('id-ID')}</td>
                                                                            <td className="p-3 text-right">
                                                                                <div className="flex gap-1 justify-end">
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            const matId = exp.raw_material_id || exp.material_id || '';
                                                                                            const mat = rawMaterials.find(m => m.id === matId);
                                                                                            const parsed = parseExpenseQtyAndUnit(exp, mat, materialStockLogs);
                                                                                            setEditingExpense({
                                                                                                ...exp, 
                                                                                                category: isBahan ? 'bahan_baku' : 'operasional', 
                                                                                                material_id: matId,
                                                                                                quantity: parsed.qty,
                                                                                                buy_unit: parsed.unit,
                                                                                                description: cleanExpenseDescription(exp.description)
                                                                                            });
                                                                                        }} 
                                                                                        className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors"
                                                                                    >
                                                                                        Edit
                                                                                    </button>
                                                                                    <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    
                                    {/* Material Stock Logs Row */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl mt-8">
                                        <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Update Stok Bahan Baku</h3>
                                        {materialStockLogs.length === 0 ? (
                                            <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada riwayat update stok.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs md:text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Waktu</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Bahan Baku</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Perubahan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Keterangan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Oleh</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {materialStockLogs.map((log: any) => (
                                                            <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                <td className="p-2 md:p-4 text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                                                <td className="p-2 md:p-4 font-bold text-white">{log.material_name}</td>
                                                                <td className="p-2 md:p-4">
                                                                    <span className={`px-2 py-1 rounded-md font-bold text-xs ${log.delta > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                        {log.delta > 0 ? '+' : ''}{log.delta}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 md:p-4 text-gray-400">{log.note || '-'}</td>
                                                                <td className="p-2 md:p-4">
                                                                    {log.staff_name ? (
                                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{log.staff_name}</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Admin</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Edit Expense Modal */}
                                    {editingExpense && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-6 rounded-3xl w-full max-w-md shadow-2xl my-auto flex-shrink-0">
                                                <h3 className="font-bold text-xl text-white mb-5">Edit Pengeluaran</h3>
                                                <form onSubmit={handleUpdateExpense} className="space-y-4">
                                                    <input type="text" placeholder="Deskripsi" value={editingExpense.description} onChange={e => setEditingExpense({...editingExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    <input type="number" placeholder="Nominal (Rp)" value={editingExpense.amount} onChange={e => setEditingExpense({...editingExpense, amount: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    
                                                    {/* Category */}
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Kategori</label>
                                                        <div className="flex gap-2">
                                                            <button type="button"
                                                                onClick={() => setEditingExpense({...editingExpense, category: 'operasional', material_id: ''})}
                                                                className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                                                                    (editingExpense.category || 'operasional') === 'operasional'
                                                                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                                                }`}
                                                            >⚙️ Operasional</button>
                                                            <button type="button"
                                                                onClick={() => setEditingExpense({...editingExpense, category: 'bahan_baku'})}
                                                                className={`flex-1 py-2 rounded-xl font-bold text-sm border transition-all ${
                                                                    (editingExpense.category || 'operasional') === 'bahan_baku'
                                                                        ? 'bg-green-500/20 text-green-300 border-green-500/40'
                                                                        : 'bg-gray-800 text-gray-400 border-gray-700'
                                                                }`}
                                                            >🧪 Bahan Baku</button>
                                                        </div>
                                                    </div>
                                                    
                                                    {(editingExpense.category || 'operasional') === 'bahan_baku' && (
                                                        <div className="space-y-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                                                            <div>
                                                                <label className="text-xs text-green-400 font-bold mb-1 block">Bahan Baku (Wajib)</label>
                                                                <select 
                                                                    value={editingExpense.material_id || ''} 
                                                                    onChange={e => {
                                                                        const mId = e.target.value;
                                                                        const m = rawMaterials.find(rm => rm.id === mId);
                                                                        setEditingExpense({
                                                                            ...editingExpense, 
                                                                            material_id: mId,
                                                                            buy_unit: m ? (m.unit === 'g' ? 'kg' : m.unit === 'ml' ? 'liter' : m.unit) : (editingExpense.buy_unit || 'kg')
                                                                        });
                                                                    }}
                                                                    className={`w-full p-3 bg-gray-900 border rounded-xl focus:border-blue-500 outline-none text-white text-sm ${
                                                                        !editingExpense.material_id ? 'border-red-500/50' : 'border-gray-800'
                                                                    }`}
                                                                    required={(editingExpense.category || 'operasional') === 'bahan_baku'}
                                                                >
                                                                    <option value="">-- Pilih Bahan Baku --</option>
                                                                    {rawMaterials.map(m => (
                                                                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-400 block mb-1">Kuantitas Dibeli</label>
                                                                    <input 
                                                                        type="number" 
                                                                        step="any"
                                                                        placeholder="Contoh: 1 atau 500" 
                                                                        value={editingExpense.quantity || ''} 
                                                                        onChange={e => setEditingExpense({...editingExpense, quantity: Number(e.target.value)})} 
                                                                        className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-bold text-gray-400 block mb-1">Satuan Beli</label>
                                                                    <select 
                                                                        value={editingExpense.buy_unit || 'kg'} 
                                                                        onChange={e => setEditingExpense({...editingExpense, buy_unit: e.target.value})}
                                                                        className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm font-semibold"
                                                                    >
                                                                        <option value="kg">Kilogram (kg)</option>
                                                                        <option value="g">Gram (g)</option>
                                                                        <option value="liter">Liter (l)</option>
                                                                        <option value="ml">Mililiter (ml)</option>
                                                                        <option value="pcs">Pieces (pcs)</option>
                                                                        <option value="pack">Pack</option>
                                                                        <option value="dus">Dus</option>
                                                                        <option value="botol">Botol</option>
                                                                        <option value="kaleng">Kaleng</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            {/* Real-time Calculation Helper */}
                                                            {(() => {
                                                                const mat = rawMaterials.find(m => m.id === editingExpense.material_id);
                                                                if (!mat || !editingExpense.quantity || !editingExpense.amount) return null;
                                                                let mult = 1;
                                                                const bUnit = editingExpense.buy_unit || mat.unit;
                                                                if ((mat.unit === 'g' || mat.unit === 'gr') && bUnit === 'kg') mult = 1000;
                                                                else if (mat.unit === 'ml' && (bUnit === 'liter' || bUnit === 'l')) mult = 1000;
                                                                const totalUnits = Number(editingExpense.quantity) * mult;
                                                                const unitPrice = totalUnits > 0 ? (Number(editingExpense.amount) / totalUnits) : 0;
                                                                return (
                                                                    <div className="text-[11px] bg-green-950/40 border border-green-500/30 p-2.5 rounded-lg text-green-300">
                                                                        <span className="font-bold">Konversi:</span> {editingExpense.quantity} {bUnit} = {totalUnits.toLocaleString('id-ID')} {mat.unit}
                                                                        <br />
                                                                        <span className="font-bold">Harga Satuan Baru:</span> Rp {unitPrice.toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {mat.unit}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex gap-3 mt-4">
                                                        <button type="button" onClick={() => setEditingExpense(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            
                            {/* RAW MATERIALS TAB */}
                            {activeTab === "raw_materials" && (
                                <div className="space-y-8">
                                    {/* Stock Valuation Chart */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl p-4 md:p-6">
                                        <h3 className="font-bold text-lg mb-4 text-white border-b border-gray-800 pb-3">Bagan Konversi Nilai Stok Bahan Baku</h3>
                                        {rawMaterials.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">Belum ada bahan baku. Tambah bahan baku terlebih dahulu.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-sm text-gray-400 mb-2">Total Nilai Aset Bahan Baku:</div>
                                                    <div className="text-3xl font-bold text-blue-400 mb-4">
                                                        Rp {rawMaterials.reduce((sum, item) => sum + (Number(item.current_stock) * Number(item.last_price_per_unit)), 0).toLocaleString('id-ID')}
                                                    </div>
                                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                                        {rawMaterials.map((item: any) => {
                                                            const val = Number(item.current_stock) * Number(item.last_price_per_unit);
                                                            const total = rawMaterials.reduce((s: number, m: any) => s + Number(m.current_stock) * Number(m.last_price_per_unit), 0);
                                                            const pct = total > 0 ? (val / total * 100) : 0;
                                                            return (
                                                                <div key={item.id} className="flex flex-col border-b border-gray-800 pb-2">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-gray-300">{item.name}</span>
                                                                        <div className="text-right">
                                                                            <div className="font-bold text-white">Rp {val.toLocaleString('id-ID')}</div>
                                                                            <div className="text-xs text-gray-500">{item.current_stock} {item.unit} × Rp {Number(item.last_price_per_unit).toLocaleString('id-ID')}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1.5">
                                                                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-600 text-right">{pct.toFixed(1)}% dari total aset</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="h-72 flex items-end gap-1.5 pb-4 pt-4 border-l border-gray-800 pl-4 overflow-x-auto">
                                                    {rawMaterials.length > 0 && rawMaterials.map((item: any) => {
                                                        const totalVal = Number(item.current_stock) * Number(item.last_price_per_unit);
                                                        const maxVal = Math.max(...rawMaterials.map((m: any) => Number(m.current_stock) * Number(m.last_price_per_unit)));
                                                        const heightPct = maxVal > 0 ? (totalVal / maxVal) * 100 : 0;
                                                        return (
                                                            <div key={item.id} className="flex flex-col justify-end items-center h-full w-14 group flex-shrink-0">
                                                                <div className="text-xs text-gray-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 px-2 py-1 rounded z-10 absolute -translate-y-full">
                                                                    Rp {totalVal.toLocaleString('id-ID')}
                                                                </div>
                                                                <div className="w-10 bg-blue-500/80 rounded-t-sm hover:bg-blue-400 transition-colors" style={{ height: `${heightPct}%` }}></div>
                                                                <div className="text-[9px] text-gray-500 mt-2 truncate w-full text-center" title={item.name}>{item.name.substring(0, 6)}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Input & List Bahan Baku */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Tambah Bahan Baku */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                                                <button onClick={() => setMaterialMode('add')} className={`pb-2 px-2 text-lg font-bold border-b-2 transition-colors ${materialMode === 'add' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}`}>Tambah Bahan</button>
                                            </div>
                                            <form onSubmit={handleCreateMaterial} className="space-y-4">
                                                <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <select value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white font-semibold">
                                                        <option value="g">Gram (g)</option>
                                                        <option value="ml">Mililiter (ml)</option>
                                                        <option value="pcs">Pieces (pcs)</option>
                                                        <option value="kg">Kilogram (kg)</option>
                                                        <option value="liter">Liter (l)</option>
                                                        <option value="pack">Pack</option>
                                                        <option value="dus">Dus</option>
                                                        <option value="botol">Botol</option>
                                                        <option value="kaleng">Kaleng</option>
                                                    </select>
                                                    <input type="number" placeholder="Stok" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <input type="number" placeholder="Harga/Unit Dasar" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                </div>
                                                <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>
                                            </form>
                                        </div>

                                        {/* Daftar Bahan Baku */}
                                        {(() => {
                                            const lowStockItems = rawMaterials.filter(m => {
                                                const minS = Number(m.min_stock || 0);
                                                const stock = Number(m.current_stock || 0);
                                                return minS > 0 ? stock <= minS : stock <= 0;
                                            });

                                            const sortedMaterials = [...rawMaterials]
                                                .filter(m => !materialSearchQuery || m.name.toLowerCase().includes(materialSearchQuery.toLowerCase()))
                                                .sort((a, b) => {
                                                    if (materialSortBy === 'updated') {
                                                        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
                                                        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
                                                        return timeB - timeA;
                                                    } else if (materialSortBy === 'price_desc') {
                                                        return Number(b.last_price_per_unit || 0) - Number(a.last_price_per_unit || 0);
                                                    } else if (materialSortBy === 'price_asc') {
                                                        return Number(a.last_price_per_unit || 0) - Number(b.last_price_per_unit || 0);
                                                    } else if (materialSortBy === 'low_stock') {
                                                        const isLowA = (Number(a.current_stock || 0) <= Number(a.min_stock || 0) && Number(a.min_stock || 0) > 0) || Number(a.current_stock || 0) <= 0 ? 1 : 0;
                                                        const isLowB = (Number(b.current_stock || 0) <= Number(b.min_stock || 0) && Number(b.min_stock || 0) > 0) || Number(b.current_stock || 0) <= 0 ? 1 : 0;
                                                        if (isLowA !== isLowB) return isLowB - isLowA;
                                                        return (Number(a.current_stock || 0) - Number(a.min_stock || 0)) - (Number(b.current_stock || 0) - Number(b.min_stock || 0));
                                                    } else if (materialSortBy === 'name_asc') {
                                                        return a.name.localeCompare(b.name);
                                                    }
                                                    return 0;
                                                });

                                            return (
                                                <div className="space-y-4">
                                                    {/* Low Stock Alert Banner */}
                                                    {lowStockItems.length > 0 && (
                                                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-red-950/20">
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-2xl flex-shrink-0">⚠️</span>
                                                                <div>
                                                                    <div className="font-bold text-white text-sm">
                                                                        Peringatan: {lowStockItems.length} Bahan Baku Mencapai Limit Stok!
                                                                    </div>
                                                                    <p className="text-xs text-red-300/80 mt-0.5">
                                                                        Stok bahan menipis atau habis di bawah batas minimum. Saatnya dibeli/restock.
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                                        {lowStockItems.slice(0, 6).map(m => (
                                                                            <span key={m.id} className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                                                                                {m.name}: {m.current_stock} {m.unit} (Limit: {m.min_stock || 0})
                                                                            </span>
                                                                        ))}
                                                                        {lowStockItems.length > 6 && (
                                                                            <span className="text-[10px] text-gray-400 self-center">+{lowStockItems.length - 6} lainnya</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setMaterialSortBy('low_stock')}
                                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
                                                            >
                                                                Filter Mau Habis
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                                        {/* Header with Search and Sort Controls */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-800/30 border-b border-gray-800">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-bold text-gray-300 text-sm md:text-base">Daftar Bahan Baku ({sortedMaterials.length})</h3>
                                                                {lowStockItems.length > 0 && (
                                                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-[10px] font-bold">
                                                                        {lowStockItems.length} Limit
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Cari bahan baku..."
                                                                    value={materialSearchQuery}
                                                                    onChange={e => setMaterialSearchQuery(e.target.value)}
                                                                    className="p-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs outline-none focus:border-blue-500 w-36 sm:w-44"
                                                                />

                                                                <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 rounded-xl px-2.5 py-1 text-xs">
                                                                    <span className="text-gray-400 text-[11px]">Urutkan:</span>
                                                                    <select
                                                                        value={materialSortBy}
                                                                        onChange={e => setMaterialSortBy(e.target.value as any)}
                                                                        className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
                                                                    >
                                                                        <option value="updated" className="bg-gray-900 text-white">Terbaru Diupdate</option>
                                                                        <option value="low_stock" className="bg-gray-900 text-white">⚠️ Limit Stock (Mau Habis)</option>
                                                                        <option value="price_desc" className="bg-gray-900 text-white">Harga Termahal</option>
                                                                        <option value="price_asc" className="bg-gray-900 text-white">Harga Termurah</option>
                                                                        <option value="name_asc" className="bg-gray-900 text-white">Nama (A-Z)</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {sortedMaterials.length === 0 ? (
                                                            <p className="p-6 text-gray-500 text-center text-sm">Tidak ada bahan baku yang cocok.</p>
                                                        ) : (
                                                            <div className="overflow-x-auto w-full">
                                                                <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-max md:min-w-0 md:whitespace-normal">
                                                                    <tbody>
                                                                        {sortedMaterials.map((mat: any) => {
                                                                        const isLow = (Number(mat.min_stock || 0) > 0 && Number(mat.current_stock || 0) <= Number(mat.min_stock || 0)) || Number(mat.current_stock || 0) <= 0;
                                                                        return (
                                                                            <tr key={mat.id} className={`border-b border-gray-800 hover:bg-gray-800/20 transition-colors ${isLow ? 'bg-red-500/[0.03]' : ''}`}>
                                                                                <td className="p-2 md:p-4">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-bold text-white">{mat.name}</span>
                                                                                        {isLow && (
                                                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                                                                                                Saatnya Beli
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 mt-1">
                                                                                        {mat.updated_by_name && <span className="text-[10px] text-blue-400">Oleh: {mat.updated_by_name}</span>}
                                                                                        {mat.min_stock > 0 && <span className="text-[10px] text-amber-400">Min: {mat.min_stock} {mat.unit}</span>}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="p-2 md:p-4 text-center">
                                                                                    {isLow ? (
                                                                                        <span className="px-3 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold inline-flex items-center gap-1">
                                                                                            ⚠️ {mat.current_stock} {mat.unit}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm font-semibold">
                                                                                            {mat.current_stock} {mat.unit}
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="p-2 md:p-4 text-right text-gray-400 text-sm">
                                                                                    Rp {Number(mat.last_price_per_unit).toLocaleString('id-ID')}/{mat.unit}
                                                                                </td>
                                                                                <td className="p-3 text-right">
                                                                                    <div className="flex gap-1 justify-end">
                                                                                        <button onClick={() => setEditingMaterial({...mat})} className="px-2 py-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg hover:bg-amber-600 hover:text-white font-bold transition-colors">Edit</button>
                                                                                        <button onClick={() => { setSelectedMaterial({...mat}); setMaterialMode('update'); }} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">+/- Stok</button>
                                                                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Riwayat Update Stok */}
                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Riwayat Update Stok Bahan Baku</h3>
                                        {materialStockLogs.length === 0 ? (
                                            <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada riwayat update stok.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs md:text-sm">
                                                    <thead>
                                                        <tr className="bg-gray-800/50 border-b border-gray-800 text-gray-400">
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Waktu</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Bahan Baku</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Perubahan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Keterangan</th>
                                                            <th className="p-2 md:p-4 text-xs md:text-sm">Oleh</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {materialStockLogs.map((log: any) => (
                                                            <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                <td className="p-2 md:p-4 text-gray-400">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                                                <td className="p-2 md:p-4 font-bold text-white">{log.material_name}</td>
                                                                <td className="p-2 md:p-4">
                                                                    <span className={`px-2 py-1 rounded-md font-bold text-xs ${log.delta > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                        {log.delta > 0 ? '+' : ''}{log.delta}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 md:p-4 text-gray-400">{log.note || '-'}</td>
                                                                <td className="p-2 md:p-4">
                                                                    {log.staff_name ? (
                                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">{log.staff_name}</span>
                                                                    ) : (
                                                                        <span className="px-2 py-1 bg-gray-800 text-gray-400 rounded-md text-[10px] border border-gray-700">Admin</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

{/* STAFF TAB */}
                            {activeTab === "staff" && (
                                <div className="space-y-6">
                                    <form onSubmit={handleCreateStaff} className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                        <h3 className="font-bold text-lg mb-6 text-white border-b border-gray-800 pb-3">Tambah Akun Baru</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <input type="text" placeholder="Nama Lengkap" required value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="email" placeholder="Email" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <input type="password" placeholder="Password" required minLength={6} value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" />
                                            <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white">
                                                <option value="staff">Kasir (Staff)</option>
                                                <option value="owner">Admin (Owner)</option>
                                            </select>
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Buat Akun</button>
                                    </form>

                                    <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        <div className="overflow-x-auto w-full">
                                            <table className="w-full text-left border-collapse text-xs md:text-sm whitespace-nowrap min-w-max md:min-w-0 md:whitespace-normal">
                                                <thead>
                                                    <tr className="bg-gray-800/50 border-b border-gray-800">
                                                        <th className="p-2 md:p-4 text-xs md:text-sm text-gray-400">Nama</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm text-gray-400">Role</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm text-gray-400">Status</th>
                                                        <th className="p-2 md:p-4 text-xs md:text-sm text-gray-400 text-right">Aksi</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {staffList.map((st: any) => (
                                                        <tr key={st.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                                            <td className="p-2 md:p-4 font-bold text-white">{st.full_name}<p className="text-xs text-gray-500 font-normal">{st.email}</p></td>
                                                            <td className="p-2 md:p-4"><span className={`px-3 py-1 text-xs font-bold rounded-lg ${st.role === 'owner' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-300'}`}>{st.role.toUpperCase()}</span></td>
                                                            <td className="p-2 md:p-4"><span className="text-green-400 font-bold text-sm">Aktif</span></td>
                                                            <td className="p-2 md:p-4 text-right flex justify-end gap-2">
                                                                <button onClick={() => setEditingStaff(st)} className="px-3 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Edit</button>
                                                                <button onClick={() => handleDeleteStaff(st.id)} className="px-3 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors">Hapus</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Edit Staff Modal */}
                                    {editingStaff && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-[500px] shadow-2xl my-auto flex-shrink-0">
                                                <h3 className="font-bold text-xl text-white mb-6">Edit Staf: {editingStaff.full_name}</h3>
                                                <form onSubmit={handleUpdateStaff} className="space-y-4">
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Nama Lengkap</label>
                                                        <input type="text" value={editingStaff.full_name} onChange={e => setEditingStaff({...editingStaff, full_name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Role</label>
                                                        <select value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500">
                                                            <option value="staff">Kasir (Staff)</option>
                                                            <option value="owner">Admin (Owner)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-bold text-gray-400 block mb-2">Password Baru (Opsional)</label>
                                                        <input type="password" value={editingStaff.password || ''} onChange={e => setEditingStaff({...editingStaff, password: e.target.value})} placeholder="Biarkan kosong jika tidak diubah" className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" minLength={6} />
                                                    </div>
                                                    <div className="flex gap-4 mt-6">
                                                        <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Perubahan</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* AUDIT TAB */}
                            {activeTab === "audit" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-[#131B2C] p-4 rounded-2xl border border-gray-800/60">
                                        <div>
                                            <h3 className="font-bold text-white">Security Log</h3>
                                            <p className="text-xs text-gray-500 mt-1">Rekam jejak aktivitas sistem</p>
                                        </div>
                                        <button onClick={fetchAuditLogs} className="px-3 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-700 flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Refresh
                                        </button>
                                    </div>
                                    {auditLogs.length === 0 ? (
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl p-10 text-center">
                                            <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                                            <p className="text-gray-400 font-semibold">Belum ada log aktivitas.</p>
                                            <p className="text-gray-600 text-sm mt-1">Log akan otomatis tercatat saat ada transaksi, refund, atau login.</p>
                                            <p className="text-yellow-500/70 text-xs mt-3">Pastikan tabel <code className="bg-gray-900 px-1 rounded">audit_logs</code> sudah dibuat di Supabase dan RLS dinonaktifkan.</p>
                                        </div>
                                    ) : (
                                        auditLogs.map((log: any) => (
                                            <div key={log.id} className="p-2 md:p-4 md:p-5 rounded-2xl bg-[#131B2C] border border-gray-800 flex justify-between items-center shadow-lg">
                                                <div>
                                                    <p className="font-bold text-white capitalize text-lg">{String(log.action || '').replace(/_/g, ' ')}</p>
                                                    <p className="text-sm text-gray-500 mt-1">Entity: <span className="text-gray-300">{log.entity_type}</span> | Staff: <span className="text-gray-300">{log.staff_id || 'System'}</span></p>
                                                </div>
                                                <div className="text-right text-sm text-gray-500 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                                                    {new Date(log.created_at).toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                            {/* SETTINGS TAB */}
                            {activeTab === "settings" && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:p-6">
                                    <div className="space-y-6">
                                        {/* Brand Settings */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4">Pengaturan Brand Toko</h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Nama Toko (Cafe Name)</label>
                                                    <input 
                                                        type="text" 
                                                        value={storeSettings.cafe_name}
                                                        onChange={e => setStoreSettings({...storeSettings, cafe_name: e.target.value})}
                                                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold"
                                                        placeholder="Contoh: NexPos Cafe"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Logo Struk & Kiosk (Max 1MB)</label>
                                                    <div className="flex items-center gap-4 md:p-6">
                                                        {storeSettings.logo_base64 ? (
                                                            <img src={storeSettings.logo_base64} alt="Logo" className="w-24 h-24 object-contain bg-white rounded-xl p-2 border border-gray-800" />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center p-2">No Logo</div>
                                                        )}
                                                        <div className="flex-1">
                                                            <label className="cursor-pointer bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-2 mb-3">
                                                                <Upload className="w-4 h-4" /> Upload Logo
                                                                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                                            </label>
                                                            {storeSettings.logo_base64 && (
                                                                <div>
                                                                    <label className="text-xs text-gray-500 block mb-1 font-semibold">Ukuran Logo di Struk: {storeSettings.logo_size}px</label>
                                                                    <input type="range" min="30" max="150" value={storeSettings.logo_size} onChange={e => setStoreSettings({...storeSettings, logo_size: Number(e.target.value)})} className="w-full accent-blue-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Receipt Settings */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4">Template Struk & Biaya</h3>
                                            
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-300 mb-2">Nama WiFi (Tampil di struk)</label>
                                                        <input 
                                                            type="text" 
                                                            value={storeSettings.wifi_name}
                                                            onChange={e => setStoreSettings({...storeSettings, wifi_name: e.target.value})}
                                                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                            placeholder="Contoh: NexPos_Guest"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-300 mb-2">Password WiFi</label>
                                                        <input 
                                                            type="text" 
                                                            value={storeSettings.wifi_password}
                                                            onChange={e => setStoreSettings({...storeSettings, wifi_password: e.target.value})}
                                                            className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                            placeholder="Contoh: KopiEnak123"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h4 className="font-bold text-white">Pajak (Tax / PB1)</h4>
                                                            <p className="text-xs text-gray-500 mt-1">Aktifkan untuk menambahkan pajak pada total pesanan.</p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" checked={storeSettings.tax_enabled} onChange={e => setStoreSettings({...storeSettings, tax_enabled: e.target.checked})} />
                                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    {storeSettings.tax_enabled && (
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-300 mb-2">Persentase Pajak (%)</label>
                                                            <input 
                                                                type="number" 
                                                                value={storeSettings.tax_rate}
                                                                onChange={e => setStoreSettings({...storeSettings, tax_rate: Number(e.target.value)})}
                                                                className="w-full bg-[#131B2C] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                                                placeholder="Contoh: 11"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">Pesan Footer Struk (Spesial Message)</label>
                                                    <textarea 
                                                        value={storeSettings.receipt_footer}
                                                        onChange={e => setStoreSettings({...storeSettings, receipt_footer: e.target.value})}
                                                        className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-white focus:border-blue-500 outline-none h-24 resize-none"
                                                        placeholder="Terima kasih atas kunjungan Anda..."
                                                    ></textarea>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-300 mb-2">QRIS Statis Toko (Opsional)</label>
                                                    <div className="flex items-center gap-4 md:p-6">
                                                        {storeSettings.qris_image_base64 ? (
                                                            <img src={storeSettings.qris_image_base64} alt="QRIS" className="w-24 h-24 object-contain bg-white rounded-xl p-2 border border-gray-800" />
                                                        ) : (
                                                            <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center text-gray-500 text-xs text-center p-2">Belum ada QRIS</div>
                                                        )}
                                                        <div className="flex-1">
                                                            <label className="cursor-pointer bg-blue-600/10 text-blue-500 border border-blue-500/20 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition-colors inline-flex items-center gap-2 mb-3">
                                                                <Upload className="w-4 h-4" /> Upload QRIS
                                                                <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleQrisUpload} />
                                                            </label>
                                                            {storeSettings.qris_image_base64 && (
                                                                <div>
                                                                    <label className="text-xs text-gray-500 block mb-1 font-semibold">Ukuran QRIS di Struk: {storeSettings.qris_size}px</label>
                                                                    <input type="range" min="60" max="200" value={storeSettings.qris_size} onChange={e => setStoreSettings({...storeSettings, qris_size: Number(e.target.value)})} className="w-full accent-blue-500" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                                    <h4 className="font-bold text-gray-300 mb-4">Kelola Metode Pembayaran</h4>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {paymentMethods.map((pm: any) => (
                                                            <div key={pm.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-300 border border-green-500/20 rounded-xl text-sm font-bold">
                                                                <span>{pm.name}</span>
                                                                <button type="button" onClick={() => handleDeletePaymentMethod(pm.id)} className="ml-1 text-red-400 hover:text-red-300 text-xs font-bold leading-none">Γ£ò</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            id="new-payment-input"
                                                            placeholder="Nama metode (Qris, Kartu Kredit, dll)..." 
                                                            className="flex-1 p-2.5 bg-[#0B0F19] border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddPaymentMethod((e.target as HTMLInputElement).value);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500"
                                                            onClick={() => {
                                                                const input = document.getElementById('new-payment-input') as HTMLInputElement;
                                                                if (input) { handleAddPaymentMethod(input.value); input.value = ''; }
                                                            }}
                                                        >+ Tambah</button>
                                                    </div>
                                                </div>

                                                <div className="mt-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">
                                                    <h4 className="font-bold text-gray-300 mb-4">Kelola Kategori Menu</h4>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {storeSettings.categories.map((cat: string) => (
                                                            <div key={cat} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-xl text-sm font-bold">
                                                                <span>{cat}</span>
                                                                <button type="button" onClick={() => handleRemoveCategory(cat)} className="ml-1 text-red-400 hover:text-red-300 text-xs font-bold leading-none">Γ£ò</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            id="new-category-input"
                                                            placeholder="Nama kategori baru..." 
                                                            className="flex-1 p-2.5 bg-[#0B0F19] border border-gray-700 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    handleAddCategory((e.target as HTMLInputElement).value);
                                                                    (e.target as HTMLInputElement).value = '';
                                                                }
                                                            }}
                                                        />
                                                        <button 
                                                            type="button" 
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500"
                                                            onClick={() => {
                                                                const input = document.getElementById('new-category-input') as HTMLInputElement;
                                                                if (input) { handleAddCategory(input.value); input.value = ''; }
                                                            }}
                                                        >+ Tambah</button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">Tekan Enter atau klik Tambah. Kategori tersimpan saat klik "Simpan Semua Pengaturan".</p>
                                                </div>

                                                <button 
                                                    onClick={handleSaveSettings}
                                                    disabled={loading}
                                                    className="w-full py-3 md:py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 mt-4"
                                                >
                                                    {loading ? "Menyimpan..." : "Simpan Semua Pengaturan"}
                                                </button>
                                                <p className="text-center text-xs text-gray-700 mt-6 leading-relaxed">
                                                    ┬⌐ {new Date().getFullYear()} <strong className="text-gray-600">NexPos</strong> ┬╖ Developed by <strong className="text-gray-500">Matias Austin</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Section */}
                                    <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl flex flex-col items-center">
                                        <h3 className="font-bold text-xl mb-6 text-white border-b border-gray-800 pb-4 w-full text-left text-xs md:text-sm">Live Preview Struk</h3>
                                        
                                        <div className="bg-white p-4 md:p-6 text-black font-mono text-sm w-[300px] shadow-2xl rounded-sm">
                                            {storeSettings.logo_base64 && (
                                                <div className="flex justify-center mb-4">
                                                    <img src={storeSettings.logo_base64} alt="Logo" style={{ width: storeSettings.logo_size, height: storeSettings.logo_size }} className="object-contain grayscale" />
                                                </div>
                                            )}
                                            <div className="text-center font-bold text-lg mb-1">{storeSettings.cafe_name || 'Nama Cafe'}</div>
                                            <div className="text-center text-xs mb-4">Struk Pembayaran (Preview)</div>
                                            
                                            <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
                                            
                                            <div className="flex justify-between mb-1">
                                                <span>Kopi Susu Aren</span>
                                                <span>Rp 25.000</span>
                                            </div>
                                            <div className="flex justify-between mb-1">
                                                <span>Oatmilk Latte</span>
                                                <span>Rp 35.000</span>
                                            </div>
                                            
                                            <div className="border-b-2 border-dashed border-gray-400 my-4"></div>
                                            
                                            {storeSettings.tax_enabled ? (
                                                <>
                                                    <div className="flex justify-between mb-1">
                                                        <span>Subtotal</span>
                                                        <span>Rp 60.000</span>
                                                    </div>
                                                    <div className="flex justify-between mb-4">
                                                        <span>Pajak ({storeSettings.tax_rate}%)</span>
                                                        <span>Rp {((60000 * storeSettings.tax_rate) / 100).toLocaleString('id-ID')}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold mb-4">
                                                        <span>TOTAL</span>
                                                        <span>Rp {(60000 + ((60000 * storeSettings.tax_rate) / 100)).toLocaleString('id-ID')}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex justify-between font-bold mb-4">
                                                    <span>TOTAL</span>
                                                    <span>Rp 60.000</span>
                                                </div>
                                            )}

                                            {storeSettings.qris_image_base64 && (
                                                <div className="flex flex-col items-center justify-center my-6">
                                                    <p className="font-bold text-xs mb-2 text-center">SCAN QRIS UNTUK BAYAR</p>
                                                    <img src={storeSettings.qris_image_base64} alt="QRIS" style={{ width: storeSettings.qris_size, height: storeSettings.qris_size }} className="object-contain" />
                                                </div>
                                            )}

                                            <div className="border-b-2 border-dashed border-gray-400 my-4"></div>
                                            
                                            {(storeSettings.wifi_name || storeSettings.wifi_password) && (
                                                <div className="text-center mb-2">
                                                    {storeSettings.wifi_name && <div className="font-bold">WiFi: {storeSettings.wifi_name}</div>}
                                                    {storeSettings.wifi_password && <div>Pass: {storeSettings.wifi_password}</div>}
                                                </div>
                                            )}
                                            
                                            <div className="text-center text-xs whitespace-pre-wrap mt-4">
                                                {storeSettings.receipt_footer || 'Terima kasih atas kunjungan Anda'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4 mt-8">

                                            <button 
                                                onClick={handleTestPrint}
                                                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                Test Cetak Desain (Web/PDF)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* PRINT ONLY RECEIPT BLOCK */}
          
                                    {/* Edit Raw Material Modal */}
                                    {editingMaterial && (
                                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md overflow-y-auto">
                                            <div className="bg-[#131B2C] border border-gray-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl my-auto">
                                                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                                                    <h3 className="font-bold text-xl text-white">Edit Bahan Baku</h3>
                                                    <button onClick={() => setEditingMaterial(null)} className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white">✕</button>
                                                </div>
                                                <form onSubmit={handleUpdateMaterial} className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-bold text-gray-400 block mb-1">Nama Bahan Baku</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={editingMaterial.name}
                                                            onChange={e => setEditingMaterial({...editingMaterial, name: e.target.value})}
                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm font-semibold"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-400 block mb-1">Satuan Dasar</label>
                                                            <select
                                                                value={editingMaterial.unit}
                                                                onChange={e => setEditingMaterial({...editingMaterial, unit: e.target.value})}
                                                                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm font-bold"
                                                            >
                                                                <option value="g">Gram (g)</option>
                                                                <option value="ml">Mililiter (ml)</option>
                                                                <option value="pcs">Pieces / Butir (pcs)</option>
                                                                <option value="kg">Kilogram (kg)</option>
                                                                <option value="liter">Liter</option>
                                                                <option value="pack">Pack</option>
                                                                <option value="dus">Dus / Box</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-400 block mb-1">Stok Saat Ini ({editingMaterial.unit})</label>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                value={editingMaterial.current_stock}
                                                                onChange={e => setEditingMaterial({...editingMaterial, current_stock: Number(e.target.value)})}
                                                                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-400">Harga Satuan Dasar (Rp / {editingMaterial.unit})</label>
                                                            <span className="text-[10px] text-blue-400 font-semibold">Harga per 1 {editingMaterial.unit}</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            required
                                                            value={editingMaterial.last_price_per_unit}
                                                            onChange={e => setEditingMaterial({...editingMaterial, last_price_per_unit: Number(e.target.value)})}
                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-base font-bold text-blue-400"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <label className="text-xs font-bold text-gray-400">Batas Minimum Stok (Limit Stock)</label>
                                                            <span className="text-[10px] text-amber-400 font-semibold">Peringatan Saatnya Beli Lagi</span>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={editingMaterial.min_stock !== undefined ? editingMaterial.min_stock : 0}
                                                            onChange={e => setEditingMaterial({...editingMaterial, min_stock: Number(e.target.value)})}
                                                            placeholder="Contoh: 100"
                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500 text-sm font-bold text-amber-300"
                                                        />
                                                        <p className="text-[10px] text-gray-500 mt-1">
                                                            Jika stok di bawah angka ini, kasir & admin akan mendapat notifikasi bahan mau habis.
                                                        </p>
                                                    </div>

                                                    {/* Smart Converter Helper */}
                                                    <MaterialConverterHelper
                                                        targetUnit={editingMaterial.unit}
                                                        onApply={(calculatedPrice) => {
                                                            setEditingMaterial({...editingMaterial, last_price_per_unit: calculatedPrice});
                                                            toast.success(`Harga satuan diterapkan: Rp ${calculatedPrice.toLocaleString('id-ID')} / ${editingMaterial.unit}`);
                                                        }}
                                                    />

                                                    <div className="flex gap-3 pt-2">
                                                        <button type="button" onClick={() => setEditingMaterial(null)} className="flex-1 py-3 bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 text-sm">Batal</button>
                                                        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 text-sm">{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    )}

                                    {/* Adjust Material Stock Modal */}
                                      {selectedMaterial && (
                                          <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-[200] p-4 overflow-y-auto backdrop-blur-md">
                                              <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl my-auto flex-shrink-0">
                                                  <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                                                      <div>
                                                          <h3 className="font-bold text-lg md:text-xl text-white">Update Stok Bahan</h3>
                                                          <p className="text-gray-400 font-bold mt-1">{selectedMaterial.name}</p>
                                                      </div>
                                                      <span className="text-sm bg-gray-800 px-3 py-1.5 rounded-lg text-gray-300 font-bold">Stok: {selectedMaterial.current_stock} {selectedMaterial.unit}</span>
                                                  </div>
                                                  <form onSubmit={handleAdjustStock} className="space-y-4 md:space-y-5">
                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                                                        <div>
                                                            <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Penambahan / Pengurangan</label>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (Number(stockAdjustment.delta) || 0) - 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">-</button>
                                                                <input type="number" step="any" className="flex-1 min-w-0 w-full text-center bg-gray-900 border border-gray-800 rounded-xl py-2 md:py-3 text-white font-bold text-base md:text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} placeholder="0" />
                                                                <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (Number(stockAdjustment.delta) || 0) + 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">+</button>
                                                                
                                                                {/* UNIT SELECTOR */}
                                                                <select 
                                                                    value={stockAdjustment.unit || selectedMaterial.unit} 
                                                                    onChange={e => setStockAdjustment({...stockAdjustment, unit: e.target.value})}
                                                                    className="w-28 p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold text-xs md:text-sm outline-none focus:border-blue-500 h-10 md:h-12"
                                                                >
                                                                    {(selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && (
                                                                        <>
                                                                            <option value="g">Gram (g)</option>
                                                                            <option value="kg">Kg (1000g)</option>
                                                                        </>
                                                                    )}
                                                                    {(selectedMaterial.unit === 'ml' || selectedMaterial.unit === 'liter' || selectedMaterial.unit === 'l') && (
                                                                        <>
                                                                            <option value="ml">Mililiter (ml)</option>
                                                                            <option value="liter">Liter (1000ml)</option>
                                                                        </>
                                                                    )}
                                                                    {selectedMaterial.unit === 'pcs' && (
                                                                        <>
                                                                            <option value="pcs">Pieces (pcs)</option>
                                                                            <option value="pack">Pack</option>
                                                                            <option value="dus">Dus</option>
                                                                        </>
                                                                    )}
                                                                    {!['g', 'gr', 'ml', 'liter', 'l', 'pcs'].includes(selectedMaterial.unit) && (
                                                                        <>
                                                                            <option value={selectedMaterial.unit}>{selectedMaterial.unit}</option>
                                                                            <option value="kg">kg</option>
                                                                            <option value="g">g</option>
                                                                            <option value="liter">liter</option>
                                                                            <option value="ml">ml</option>
                                                                            <option value="pcs">pcs</option>
                                                                            <option value="pack">pack</option>
                                                                            <option value="dus">dus</option>
                                                                        </>
                                                                    )}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Harga Beli Total (Opsional)</label>
                                                            <input type="number" placeholder="Bila kosong = harga lama" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white h-10 md:h-12 text-sm" />
                                                        </div>
                                                    </div>

                                                    {/* Smart Conversion Helper Preview */}
                                                    {(() => {
                                                        const adjUnit = stockAdjustment.unit || selectedMaterial.unit;
                                                        let mult = 1;
                                                        if ((selectedMaterial.unit === 'g' || selectedMaterial.unit === 'gr') && adjUnit === 'kg') mult = 1000;
                                                        else if (selectedMaterial.unit === 'ml' && (adjUnit === 'liter' || adjUnit === 'l')) mult = 1000;
                                                        const effDelta = (Number(stockAdjustment.delta) || 0) * mult;
                                                        const finalStock = Number(selectedMaterial.current_stock) + effDelta;
                                                        return (
                                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex flex-col gap-1.5">
                                                                <div className="flex justify-between items-center">
                                                                    <span>Perubahan Stok: <b className={effDelta >= 0 ? 'text-green-400' : 'text-red-400'}>{effDelta >= 0 ? `+${effDelta.toLocaleString('id-ID')}` : effDelta.toLocaleString('id-ID')} {selectedMaterial.unit}</b></span>
                                                                    <span>Stok Akhir: <b className="text-white">{finalStock.toLocaleString('id-ID')} {selectedMaterial.unit}</b></span>
                                                                </div>
                                                                {stockAdjustment.price > 0 && (
                                                                    <div className="text-[11px] text-green-300 border-t border-blue-500/20 pt-1">
                                                                        💡 Harga Baru per {selectedMaterial.unit}: <b>Rp {((mult > 1 ? (Number(stockAdjustment.price) / (Math.abs(effDelta) || 1)) : Number(stockAdjustment.price))).toLocaleString('id-ID', { maximumFractionDigits: 2 })} / {selectedMaterial.unit}</b>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}

                                                    <div>
                                                        <label className="text-xs md:text-sm font-bold text-gray-400 block mb-1 md:mb-2">Keterangan Aktivitas</label>
                                                        <input type="text" placeholder="Contoh: Beli bahan baru, terpakai tester..." required value={stockAdjustment.note || ''} onChange={e => setStockAdjustment({...stockAdjustment, note: e.target.value})} className="w-full p-2 md:p-3 text-sm md:text-base bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    </div>
                                                      <p className="text-xs text-gray-500">?? <b>Tip:</b> Anda bisa langsung mengetik jumlah di kotak angka. Gunakan angka minus (-) jika bahan terpakai/dibuang.</p>
                                                      <div className="flex gap-4 mt-6 pt-4 border-t border-gray-800">
                                                          <button type="button" onClick={() => setSelectedMaterial(null)} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-gray-800 text-gray-300 rounded-xl font-bold hover:bg-gray-700 transition-colors">Batal</button>
                                                          <button type="submit" disabled={loading} className="flex-1 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors">Simpan Stok</button>
                                                      </div>
                                                  </form>
                                              </div>
                                          </div>
                                      )}

          <div className="hidden print:block print-receipt w-[58mm] mx-auto bg-white text-black text-[12px] font-mono leading-snug print:p-0">
            {storeSettings.logo_base64 && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <img src={storeSettings.logo_base64} alt="Logo" style={{ width: `${storeSettings.logo_size}px`, filter: 'grayscale(100%)', margin: '0 auto' }} />
                </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                {storeSettings.cafe_name || 'Nama Cafe'}
            </div>
            
            {printTransaction ? (
                <>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>
                        Struk Pembayaran
                    </div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                    <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>No: {printTransaction.order_reference}</span>
                            <span>{new Date(printTransaction.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Kasir: Admin</span>
                            <span>{new Date(printTransaction.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        {printTransaction.customer_name && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #ccc' }}>
                                <span>Pelanggan:</span>
                                <span>{printTransaction.customer_name}</span>
                            </div>
                        )}
                    </div>
                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                    
                    <table style={{ width: '100%', fontSize: '12px' }}>
                        <tbody>
                            {printTransaction.order_items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td style={{ padding: '2px 0' }}>{item.product_name}<br/><span style={{ fontSize: '10px' }}>{item.quantity} x Rp {item.price_at_time.toLocaleString('id-ID')}</span></td>
                                    <td style={{ textAlign: 'right', verticalAlign: 'bottom', padding: '2px 0' }}>Rp {(item.quantity * item.price_at_time).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                    <div style={{ fontSize: '12px' }}>
                        {Number(printTransaction.tax_amount || 0) > 0 && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span>Subtotal</span>
                                    <span>Rp {(Number(printTransaction.amount_due) - Number(printTransaction.tax_amount)).toLocaleString('id-ID')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span>Pajak</span>
                                    <span>Rp {Number(printTransaction.tax_amount).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>TOTAL</span>
                            <span>Rp {printTransaction.amount_due.toLocaleString('id-ID')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>{(printTransaction.payment_methods?.name || 'TUNAI').toUpperCase()}</span>
                            <span>Rp {printTransaction.amount_received.toLocaleString('id-ID')}</span>
                        </div>
                        {(printTransaction.change_given || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                <span>KEMBALI</span>
                                <span>Rp {printTransaction.change_given?.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ textAlign: 'center', fontSize: '12px', marginBottom: '10px' }}>
                        Struk Pembayaran (Preview)
                    </div>
                    
                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kopi Susu Aren</span>
                        <span>Rp 25.000</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Oatmilk Latte</span>
                        <span>Rp 35.000</span>
                    </div>
                    
                    <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
                    
                    {storeSettings.tax_enabled ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Subtotal</span>
                                <span>Rp 60.000</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Pajak ({storeSettings.tax_rate}%)</span>
                                <span>Rp {((60000 * storeSettings.tax_rate) / 100).toLocaleString('id-ID')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>TOTAL</span>
                                <span>Rp {(60000 + ((60000 * storeSettings.tax_rate) / 100)).toLocaleString('id-ID')}</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>TOTAL</span>
                            <span>Rp 60.000</span>
                        </div>
                    )}
                </>
            )}

            {storeSettings.qris_image_base64 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '5px' }}>SCAN QRIS UNTUK BAYAR</p>
                    <img src={storeSettings.qris_image_base64} alt="QRIS" style={{ width: '120px', margin: '0 auto' }} />
                </div>
            )}
            
            
            {(storeSettings.wifi_name || storeSettings.wifi_password) && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    {storeSettings.wifi_name && <div style={{ fontWeight: 'bold' }}>WiFi: {storeSettings.wifi_name}</div>}
                    {storeSettings.wifi_password && <div>Pass: {storeSettings.wifi_password}</div>}
                </div>
            )}
            
            <div style={{ textAlign: 'center', fontSize: '12px', whiteSpace: 'pre-wrap', marginTop: '10px' }}>
                {storeSettings.receipt_footer || 'Terima kasih atas kunjungan Anda'}
            </div>


        </div>
        </>
    );
}
