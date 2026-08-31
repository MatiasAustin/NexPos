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

const CategoryDropdown = ({ value, onChange, categories, onAdd, onRemove }: { value: string, onChange: (v: string) => void, categories: string[], onAdd: (v: string) => void, onRemove: (v: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newCat, setNewCat] = useState('');
    return (
        <div className="relative">
            <div onClick={() => setIsOpen(!isOpen)} className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-white cursor-pointer flex justify-between items-center outline-none focus:border-blue-500">
                {value || "Pilih Kategori"}
                <span className="text-gray-500 text-xs">▼</span>
            </div>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full mt-2 w-full bg-[#131B2C] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 flex flex-col">
                        <div className="overflow-y-auto max-h-48 py-1">
                            {categories.map((cat: string) => (
                                <div key={cat} className="flex justify-between items-center px-4 py-3 hover:bg-gray-800 cursor-pointer text-sm text-white transition-colors group">
                                    <span onClick={() => { onChange(cat); setIsOpen(false); }} className="flex-1 font-bold">{cat}</span>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(cat); }} className="text-gray-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-opacity">✕</button>
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

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit" | "staff" | "inventory" | "history" | "settings" | "expenses" | "cash_sessions">("reconciliation");
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
    const [adjustingProductStock, setAdjustingProductStock] = useState<any>(null); // New state for product stock
    const [viewingProductHistory, setViewingProductHistory] = useState<any>(null); // New state for product history
    const [productHistoryData, setProductHistoryData] = useState<any[]>([]); // New state for product history data
    const [productStockDelta, setProductStockDelta] = useState<number>(0); // New state for stock delta
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    const [materialStockLogs, setMaterialStockLogs] = useState<any[]>([]); // New state
    const [newExpense, setNewExpense] = useState({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH' });
    const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
    const [newStaff, setNewStaff] = useState({ full_name: '', email: '', password: '', role: 'staff' });
    
    // UI states for new features
    const [materialMode, setMaterialMode] = useState<'add' | 'update'>('add');
    const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
    const [stockAdjustment, setStockAdjustment] = useState<{ delta: number; note: string; price: number }>({ delta: 0, note: '', price: 0 });
    const [expenseSortOrder, setExpenseSortOrder] = useState<'desc' | 'asc'>('desc');
    const [expensePeriod, setExpensePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('all');
    
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
    const [newProduct, setNewProduct] = useState<{name: string, category: string, price: number, cogs: number, stock: number, image_icon: string, image_url: string, ingredients: {raw_material_id: string, name: string, qty: number, cost: number}[]}>({ 
        name: '', category: 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: [] 
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
            if (prof.role !== 'owner' && activeTab !== 'reconciliation' && activeTab !== 'history' && activeTab !== 'cash_sessions') {
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
                const [prodRes, matRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`),
                    supabase.from('raw_materials').select('*').order('name', { ascending: true })
                ]);
                if (prodRes.ok) setProducts(await prodRes.json());
                setRawMaterials(matRes.data || []);
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
            } else if (activeTab === "cash_sessions") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/cash-sessions`);
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
                setExpenses(expRes.data || []);
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
        
        const computedCogs = newProduct.ingredients.length > 0 
            ? newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0)
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
                    image_url: newProduct.image_url
                })
            });
            if(res.ok) {
                toast.success("Produk berhasil ditambahkan!");
                setNewProduct({ name: '', category: storeSettings.categories?.[0] || 'Makanan', price: 0, cogs: 0, stock: 0, image_icon: '📦', image_url: '', ingredients: [] });
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
        const computedCogs = editingProduct.ingredients.length > 0 
            ? editingProduct.ingredients.reduce((sum: number, item: any) => sum + item.cost, 0)
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
                    ingredients: editingProduct.ingredients
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
        try {
            // Fetch order items matching this product ID, joined with transactions
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    quantity,
                    price_at_time,
                    created_at,
                    transaction:transactions (order_reference, staff_name)
                `)
                .eq('product_id', product.id)
                .order('created_at', { ascending: false })
                .limit(50);
                
            if (!error && data) {
                setProductHistoryData(data);
            }
        } catch (e) {
            console.error(e);
        }
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

    const handleCreateMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('raw_materials').insert([{
                name: newMaterial.name,
                unit: newMaterial.unit,
                current_stock: Number(newMaterial.current_stock),
                last_price_per_unit: Number(newMaterial.last_price_per_unit),
                updated_by_name: profile?.full_name
            }]);
            if (error) throw error;
            toast.success("Bahan Baku berhasil ditambahkan.");
            setNewMaterial({ name: '', unit: '', current_stock: 0, last_price_per_unit: 0 });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMaterial) return;
        setLoading(true);
        const newStock = selectedMaterial.current_stock + Number(stockAdjustment.delta);
        if (newStock < 0) { toast.error("Stok tidak boleh negatif!"); setLoading(false); return; }
        try {
            const updatePayload: any = {
                current_stock: newStock,
                updated_by_name: profile?.full_name
            };
            if (stockAdjustment.price > 0) updatePayload.last_price_per_unit = Number(stockAdjustment.price);
            
            // 1. Update raw_materials
            const { error } = await supabase.from('raw_materials').update(updatePayload).eq('id', selectedMaterial.id);
            if (error) throw error;
            
            // 2. Insert into material_stock_logs
            await supabase.from('material_stock_logs').insert([{
                material_id: selectedMaterial.id,
                material_name: selectedMaterial.name,
                delta: Number(stockAdjustment.delta),
                current_stock: newStock,
                price: Number(stockAdjustment.price) || null,
                staff_name: profile?.full_name,
                note: stockAdjustment.note
            }]);

            const action = stockAdjustment.delta >= 0 ? `+${stockAdjustment.delta}` : `${stockAdjustment.delta}`;
            toast.success(`Stok ${selectedMaterial.name} diupdate (${action} ${selectedMaterial.unit}).`);
            setSelectedMaterial(null);
            setStockAdjustment({ delta: 0, note: '', price: 0 });
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

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses').insert([{
                description: newExpense.payment_method === 'CASH' ? newExpense.description : `[${newExpense.payment_method}] ${newExpense.description}`,
                amount: Number(newExpense.amount),
                recorded_by: profile?.id,
                staff_name: profile?.full_name
            }]);
            if (error) throw error;
            
            // Handle Material Stock Update if selected
            if (newExpense.material_id && Number(newExpense.quantity) > 0) {
                const material = rawMaterials.find(m => m.id === newExpense.material_id);
                if (material) {
                    const newStock = Number(material.current_stock) + Number(newExpense.quantity);
                    const unitPrice = Number(newExpense.amount) / Number(newExpense.quantity);
                    const { error: matError } = await supabase.from('raw_materials')
                        .update({ current_stock: newStock, updated_by_name: profile?.full_name, last_price_per_unit: unitPrice })
                        .eq('id', newExpense.material_id);
                    if (matError) throw matError;
                    
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: Number(newExpense.quantity),
                        current_stock: newStock,
                        price: Number(newExpense.amount) / Number(newExpense.quantity),
                        staff_name: profile?.full_name,
                        note: `Dari Pengeluaran: ${newExpense.description}`
                    }]);
                }
            }
            
            toast.success("Pengeluaran berhasil dicatat.");
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH' });
            fetchData();
        } catch (e: any) { toast.error(e.message); }
        setLoading(false);
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('expenses')
                .update({
                    description: editingExpense.description,
                    amount: Number(editingExpense.amount),
                    staff_name: profile?.full_name
                })
                .eq('id', editingExpense.id);
            if (error) throw error;

            if (newExpense.material_id && Number(newExpense.quantity) !== 0) {
                const material = rawMaterials.find(m => m.id === newExpense.material_id);
                if (material) {
                    const newStock = Number(material.current_stock) + Number(newExpense.quantity);
                    const { error: matError } = await supabase.from('raw_materials')
                        .update({ current_stock: newStock, updated_by_name: profile?.full_name })
                        .eq('id', newExpense.material_id);
                    if (matError) throw matError;
                    
                    await supabase.from('material_stock_logs').insert([{
                        material_id: material.id,
                        material_name: material.name,
                        delta: Number(newExpense.quantity),
                        current_stock: newStock,
                        staff_name: profile?.full_name,
                        note: `Koreksi dr Edit Pengeluaran: ${editingExpense.description}`
                    }]);
                }
            }

            toast.success("Pengeluaran berhasil diperbarui."); await logAudit("EDIT_DATA", "expenses", editingExpense.id, { description: editingExpense.description, action: "Edit Pengeluaran" });
            setEditingExpense(null);
            setNewExpense({ description: '', amount: 0, material_id: '', quantity: 0, payment_method: 'CASH' });
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
                        { id: "expenses", label: "Bahan & Pengeluaran", icon: FileText },
                        { id: "staff", label: "Manajemen Staf", icon: Users },
                        { id: "audit", label: "Security Log", icon: ShieldCheck },
                        { id: "settings", label: "Pengaturan Toko", icon: Settings },
                    ].filter(tab => profile?.role === 'owner' || ['reconciliation', 'history', 'cash_sessions'].includes(tab.id)).map((tab) => (
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
                        © {new Date().getFullYear()} NexPos<br />
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
                                                <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
                                                    <button onClick={() => shiftReconciliationDate(-1)} className="px-3 py-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">&lt;</button>
                                                    <div className="px-3 py-1 text-sm font-bold text-white border-l border-r border-gray-800 bg-gray-800/30">
                                                        {reconciliationPeriod === 'daily' ? reconciliationDate.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) :
                                                         reconciliationPeriod === 'weekly' ? 'Minggu ' + Math.ceil(reconciliationDate.getDate()/7) :
                                                         reconciliationPeriod === 'monthly' ? reconciliationDate.toLocaleDateString('id-ID', {month:'long', year:'numeric'}) :
                                                         reconciliationDate.getFullYear()}
                                                    </div>
                                                    <button onClick={() => shiftReconciliationDate(1)} className="px-3 py-1 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">&gt;</button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            {reconciliationPeriod === 'custom' && (
                                                <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                                                    <input 
                                                        type="date" 
                                                        value={customDateStart}
                                                        onChange={(e) => {
                                                            setCustomDateStart(e.target.value);
                                                            if (e.target.value && customDateEnd) fetchReconciliation('custom', e.target.value, customDateEnd);
                                                        }}
                                                        className="bg-[#121214] text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-blue-500" 
                                                    />
                                                    <span className="text-gray-500">-</span>
                                                    <input 
                                                        type="date" 
                                                        value={customDateEnd}
                                                        onChange={(e) => {
                                                            setCustomDateEnd(e.target.value);
                                                            if (customDateStart && e.target.value) fetchReconciliation('custom', customDateStart, e.target.value);
                                                        }}
                                                        className="bg-[#121214] text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-blue-500" 
                                                    />
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
                                                        <div className="flex items-center gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
                                                            <input 
                                                                type="date" 
                                                                value={customDateStart}
                                                                onChange={(e) => setCustomDateStart(e.target.value)}
                                                                className="bg-[#121214] text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none" 
                                                            />
                                                            <span className="text-gray-500">-</span>
                                                            <input 
                                                                type="date" 
                                                                value={customDateEnd}
                                                                onChange={(e) => setCustomDateEnd(e.target.value)}
                                                                className="bg-[#121214] text-white text-sm rounded-lg px-2 py-1 border border-gray-700 outline-none" 
                                                            />
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
                                                        <button onClick={() => handleDeleteSession(session.id)} disabled={loading} className="mt-2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500/20 w-fit transition-colors">Hapus Shift</button>
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
                                                    : <span className="text-2xl md:text-4xl">{newProduct.image_icon || '📦'}</span>
                                                }
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-300 mb-2">Foto Menu</label>
                                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold transition-colors border border-gray-700">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                                    Upload & Compress
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProductImageUpload(e, false)} />
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">Gambar otomatis dikompres ke WebP ≤ 30KB</p>
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
                                            <div><label className="text-xs text-gray-500 mb-2 block">HPP / Modal (Rp)</label><input type="number" placeholder="0" required value={newProduct.cogs} onChange={e => setNewProduct({...newProduct, cogs: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none text-white" /></div>
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
                                            {newProduct.ingredients.length > 0 && <div className="mt-4 pt-4 border-t border-gray-800 text-right font-bold text-blue-400">Total HPP Otomatis: Rp {newProduct.ingredients.reduce((sum, item) => sum + item.cost, 0).toLocaleString('id-ID')}</div>}
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
                                                                        : <span>{p.image_icon || '📦'}</span>
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-white text-base">{p.name}</p>
                                                                    <p className="text-xs text-gray-500">{p.category}</p>
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
                                                                    <button onClick={() => setEditingProduct(p)} className="px-2 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Edit</button>
                                                                    <button onClick={() => handleDeleteProduct(p)} className="px-2 py-1 text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white transition-colors">Hapus</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    
                                    {/* Edit Product Modal */}
                                    {editingProduct && (
                                        <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto backdrop-blur-md overflow-y-auto">
                                            <div className="bg-[#131B2C] border border-gray-800 p-4 md:p-8 rounded-3xl w-full max-w-[540px] shadow-2xl my-auto flex-shrink-0">
                                                <h3 className="font-bold text-xl text-white mb-6">Edit Produk: {editingProduct.name}</h3>
                                                <form onSubmit={handleUpdateProduct} className="space-y-4">
                                                    {/* Image Upload Edit */}
                                                    <div className="flex items-center gap-4 md:p-5 mb-2">
                                                        <div className="w-20 h-20 rounded-xl bg-gray-900 border-2 border-dashed border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {editingProduct.image_url 
                                                                ? <img src={editingProduct.image_url} alt={editingProduct.name} className="w-full h-full object-cover" />
                                                                : <span className="text-2xl md:text-3xl">{editingProduct.image_icon || '📦'}</span>
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
                                                            <label className="text-sm font-bold text-gray-400 block mb-2">HPP Dasar</label>
                                                            <input type="number" value={editingProduct.cogs} onChange={e => setEditingProduct({...editingProduct, cogs: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl text-white outline-none focus:border-blue-500" required />
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
                                                    {productHistoryData.length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500">Belum ada data penjualan untuk produk ini.</div>
                                                    ) : (
                                                        <div className="space-y-3">
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
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Bahan Baku */}
                                        <div className="p-2 md:p-4 md:p-8 bg-[#131B2C] rounded-2xl border border-gray-800 shadow-xl">
                                            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-3">
                                                <button onClick={() => setMaterialMode('add')} className={`pb-2 px-2 text-lg font-bold border-b-2 transition-colors ${materialMode === 'add' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-white'}`}>Tambah Bahan</button>
                                                
                                            </div>
                                            
                                            <form onSubmit={handleCreateMaterial} className="space-y-4">
                                                    <input type="text" placeholder="Nama Bahan (contoh: Susu)" required value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <input type="text" placeholder="Unit (kg/lt)" required value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                        <input type="number" placeholder="Stok" required value={newMaterial.current_stock || ''} onChange={e => setNewMaterial({...newMaterial, current_stock: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                        <input type="number" placeholder="Harga/Unit" required value={newMaterial.last_price_per_unit || ''} onChange={e => setNewMaterial({...newMaterial, last_price_per_unit: Number(e.target.value)})} className="p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                    </div>
                                                    <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500">Simpan Bahan</button>
                                                </form>
                                        </div>

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
                                                <input type="text" placeholder="Deskripsi Pengeluaran" required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                <input type="number" placeholder="Nominal (Rp)" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white" />
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">Bahan Baku (Opsional)</label>
                                                        <select 
                                                            value={newExpense.material_id || ''} 
                                                            onChange={e => setNewExpense({...newExpense, material_id: e.target.value})}
                                                            className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                        >
                                                            <option value="">Pilih Bahan Baku...</option>
                                                            {rawMaterials.map(m => (
                                                                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {newExpense.material_id && (
                                                        <div>
                                                            <label className="text-xs text-gray-500 mb-1 block">Kuantitas Tambahan</label>
                                                            <input 
                                                                type="number" 
                                                                placeholder="Jml" 
                                                                value={newExpense.quantity || ''} 
                                                                onChange={e => setNewExpense({...newExpense, quantity: Number(e.target.value)})}
                                                                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                <button type="submit" disabled={loading} className="w-full py-3 bg-red-600/20 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500/30 mt-2">Catat Pengeluaran</button>
                                            </form>
                                        </div>
                                    </div>

                                    {/* TABLES ROW */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <h3 className="p-2 md:p-4 bg-gray-800/30 font-bold text-gray-300 border-b border-gray-800">Daftar Bahan Baku</h3>
                                            {rawMaterials.length === 0 ? (
                                                <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada bahan baku.</p>
                                            ) : (
                                                <table className="w-full text-left text-xs md:text-sm">
                                                    <tbody>
                                                        {rawMaterials.map((mat: any) => (
                                                            <tr key={mat.id} className="border-b border-gray-800 hover:bg-gray-800/20 group">
                                                                <td className="p-2 md:p-4">
                                                                    <div className="font-bold text-white">{mat.name}</div>
                                                                    {mat.updated_by_name && <div className="text-[10px] text-blue-400 mt-1">Oleh: {mat.updated_by_name}</div>}
                                                                </td>
                                                                <td className="p-2 md:p-4 text-center"><span className="px-3 py-1 bg-gray-800 rounded-lg text-sm">{mat.current_stock} {mat.unit}</span></td>
                                                                <td className="p-2 md:p-4 text-right text-gray-400 text-sm">Rp {mat.last_price_per_unit.toLocaleString('id-ID')}/{mat.unit}</td>
                                                                <td className="p-3 text-right">
                                                                    <div className="flex gap-1 justify-end">
                                                                        <button onClick={() => { setSelectedMaterial({...mat}); setMaterialMode('update'); }} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">+/- Stok</button>
                                                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                        {/* Pengeluaran */}
                                        <div className="bg-[#131B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                            <div className="p-2 md:p-4 bg-gray-800/30 border-b border-gray-800 flex flex-col md:flex-row gap-3 justify-between md:items-center">
                                                <h3 className="font-bold text-gray-300">Riwayat Pengeluaran</h3>
                                                <div className="flex flex-wrap items-center gap-2">
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
                                                return filteredExpenses.length === 0 ? (
                                                    <p className="p-2 md:p-4 md:p-6 text-gray-500 text-center text-sm">Belum ada pengeluaran pada periode ini.</p>
                                                ) : (
                                                    <div className="overflow-x-auto max-h-[600px]">
                                                        <table className="w-full text-left text-xs md:text-sm">
                                                            <tbody>
                                                                {filteredExpenses.map((exp: any) => (
                                                                    <tr key={exp.id} className="border-b border-gray-800 hover:bg-gray-800/20">
                                                                        <td className="p-2 md:p-4">
                                                                            <p className="font-bold text-white">{exp.description}</p>
                                                                            <p className="text-xs text-gray-500">{new Date(exp.expense_date || exp.created_at).toLocaleString('id-ID')}</p>
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
                                                                                <button onClick={() => setEditingExpense({...exp})} className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white font-bold transition-colors">Edit</button>
                                                                                <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600 hover:text-white font-bold transition-colors">Hapus</button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
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
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-xs text-gray-500 mb-1 block">Koreksi Stok (Opsional, minus jika berlebih)</label>
                                                            <select 
                                                                value={newExpense.material_id || ''} 
                                                                onChange={e => setNewExpense({...newExpense, material_id: e.target.value})}
                                                                className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm"
                                                            >
                                                                <option value="">Pilih Bahan Baku...</option>
                                                                {rawMaterials.map(m => (
                                                                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {newExpense.material_id && (
                                                            <div>
                                                                <label className="text-xs text-gray-500 mb-1 block">Jml Koreksi</label>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="Jml" 
                                                                    value={newExpense.quantity || ''} 
                                                                    onChange={e => setNewExpense({...newExpense, quantity: Number(e.target.value)})}
                                                                    className="w-full p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white text-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
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
                                        <table className="w-full text-left border-collapse text-xs md:text-sm">
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
                                                                <button type="button" onClick={() => handleDeletePaymentMethod(pm.id)} className="ml-1 text-red-400 hover:text-red-300 text-xs font-bold leading-none">✕</button>
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
                                                                <button type="button" onClick={() => handleRemoveCategory(cat)} className="ml-1 text-red-400 hover:text-red-300 text-xs font-bold leading-none">✕</button>
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
                                                    © {new Date().getFullYear()} <strong className="text-gray-600">NexPos</strong> · Developed by <strong className="text-gray-500">Matias Austin</strong>
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
                                    <div className="flex items-center gap-2 md:gap-3">
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) - 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">-</button>
                                        <input type="number" className="flex-1 min-w-0 w-full text-center bg-gray-900 border border-gray-800 rounded-xl py-2 md:py-3 text-white font-bold text-base md:text-lg outline-none focus:border-blue-500" value={stockAdjustment.delta || ''} onChange={e => setStockAdjustment({...stockAdjustment, delta: Number(e.target.value) || 0})} />
                                        <button type="button" onClick={() => setStockAdjustment({...stockAdjustment, delta: (stockAdjustment.delta || 0) + 1})} className="w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xl md:text-2xl font-black border border-gray-700">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs md:text-sm font-bold text-gray-400 block mb-2">Harga Beli (Opsional)</label>
                                    <input type="number" placeholder="Bila kosong = tetap" value={stockAdjustment.price || ''} onChange={e => setStockAdjustment({...stockAdjustment, price: Number(e.target.value)})} className="w-full p-2 md:p-3 bg-gray-900 border border-gray-800 rounded-xl focus:border-blue-500 outline-none text-white h-10 md:h-12" />
                                </div>
                            </div>
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
