"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Store, ChevronDown, Check, Plus, Loader2, Building2, Sparkles } from "lucide-react";
import { useToast } from "@/components/Toast";

interface StoreItem {
    id: string;
    name: string;
    role?: string;
    is_active?: boolean;
}

interface StoreSwitcherProps {
    currentStoreId?: string;
    onStoreChanged?: (newStoreId: string, storeName: string) => void;
    className?: string;
    variant?: 'compact' | 'full';
}

export default function StoreSwitcher({
    currentStoreId,
    onStoreChanged,
    className = "",
    variant = "full"
}: StoreSwitcherProps) {
    const [stores, setStores] = useState<StoreItem[]>([]);
    const [activeStore, setActiveStore] = useState<StoreItem | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentRole, setCurrentRole] = useState<string>("staff");

    const dropdownRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Load available stores for current user
    const loadStores = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const user = session.user;
            setCurrentUser(user);

            // Fetch staff profile for current store_id and role
            const { data: profile } = await supabase
                .from('staff_profiles')
                .select('store_id, role')
                .eq('id', user.id)
                .maybeSingle();

            const activeId = currentStoreId || profile?.store_id;
            setCurrentRole(profile?.role || "staff");

            // 1. Try to fetch from backend API
            let fetchedStores: StoreItem[] = [];
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user-stores/${user.id}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.stores && Array.isArray(json.stores)) {
                        fetchedStores = json.stores;
                    }
                }
            } catch (apiErr) {
                // Fallback to direct supabase query
            }

            // 2. Direct Supabase Fallback if backend returned empty or errored
            if (fetchedStores.length === 0) {
                const storeMap = new Map<string, StoreItem>();

                // A. Owned stores
                const { data: owned } = await supabase.from('stores').select('id, name').eq('owner_id', user.id);
                if (owned) {
                    owned.forEach(s => storeMap.set(s.id, { id: s.id, name: s.name, role: 'owner' }));
                }

                // B. Store members (if table exists)
                try {
                    const { data: mems } = await supabase
                        .from('store_members')
                        .select('role, stores(id, name)')
                        .eq('user_id', user.id);
                    if (mems) {
                        mems.forEach((m: any) => {
                            if (m.stores) {
                                storeMap.set(m.stores.id, { id: m.stores.id, name: m.stores.name, role: m.role || 'staff' });
                            }
                        });
                    }
                } catch(e) {}

                // C. Current store in staff profile
                if (activeId && !storeMap.has(activeId)) {
                    const { data: cur } = await supabase.from('stores').select('id, name').eq('id', activeId).maybeSingle();
                    if (cur) {
                        storeMap.set(cur.id, { id: cur.id, name: cur.name, role: profile?.role || 'staff' });
                    }
                }

                fetchedStores = Array.from(storeMap.values()).map(s => ({
                    ...s,
                    is_active: s.id === activeId
                }));
            }

            setStores(fetchedStores);

            // Set active store
            const foundActive = fetchedStores.find(s => s.id === activeId) || fetchedStores[0] || null;
            setActiveStore(foundActive);
        } catch (err) {
            console.error("Error loading accessible stores:", err);
        }
    };

    useEffect(() => {
        loadStores();
    }, [currentStoreId]);

    // Handle switching store
    const handleSwitchStore = async (targetStore: StoreItem) => {
        if (targetStore.id === activeStore?.id) {
            setIsOpen(false);
            return;
        }

        setIsSwitching(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Pengguna belum login");

            let switchSuccess = false;

            // 1. Try Backend Switch API first (service_role bypasses RLS)
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/switch-store`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: session.user.id,
                        targetStoreId: targetStore.id
                    })
                });
                if (res.ok) {
                    switchSuccess = true;
                }
            } catch(e) {}

            // 2. Try Supabase RPC switch_active_store fallback
            if (!switchSuccess) {
                const { error: rpcErr } = await supabase.rpc('switch_active_store', {
                    p_target_store_id: targetStore.id
                });
                if (!rpcErr) {
                    switchSuccess = true;
                }
            }

            // 3. Try direct staff_profiles update fallback
            if (!switchSuccess) {
                const updatePayload: any = { store_id: targetStore.id };
                if (targetStore.role) updatePayload.role = targetStore.role;
                const { error: updateErr } = await supabase
                    .from('staff_profiles')
                    .update(updatePayload)
                    .eq('id', session.user.id);

                if (!updateErr) switchSuccess = true;
            }

            if (!switchSuccess) {
                throw new Error("Gagal beralih toko. Silakan coba kembali.");
            }

            // Clear old cache from localStorage
            try {
                if (activeStore?.id) {
                    localStorage.removeItem(`nexpos_store_settings_${activeStore.id}`);
                }
                localStorage.removeItem("nexpos_store_settings");
            } catch(e) {}

            toast.success(`Berhasil beralih ke toko "${targetStore.name}"`);
            setActiveStore(targetStore);
            setIsOpen(false);

            if (onStoreChanged) {
                onStoreChanged(targetStore.id, targetStore.name);
            }

            // Reload page smoothly to rehydrate fresh state with new tenant isolation
            setTimeout(() => {
                window.location.reload();
            }, 300);

        } catch (err: any) {
            toast.error(err.message || "Gagal beralih toko.");
        } finally {
            setIsSwitching(false);
        }
    };

    // Handle creating a new store / branch
    const handleCreateStore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStoreName.trim()) {
            toast.error("Nama toko wajib diisi!");
            return;
        }

        setIsCreating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("Pengguna belum login");

            let createdStore: any = null;

            // 1. Try Backend API
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: session.user.id,
                        name: newStoreName.trim()
                    })
                });
                if (res.ok) {
                    createdStore = await res.json();
                }
            } catch(e) {}

            // 2. Direct Supabase Fallback
            if (!createdStore) {
                const { data: newS, error: sErr } = await supabase
                    .from('stores')
                    .insert({
                        name: newStoreName.trim(),
                        owner_id: session.user.id,
                        subscription_plan: 'pro',
                        status: 'active'
                    })
                    .select('*')
                    .single();

                if (sErr) throw sErr;
                createdStore = newS;

                // Create default store_settings
                await supabase.from('store_settings').insert({
                    store_id: createdStore.id,
                    receipt_header: newStoreName.trim()
                });
            }

            toast.success(`Toko "${createdStore.name}" berhasil dibuat!`);
            setShowCreateModal(false);
            setNewStoreName("");

            // Immediately switch to the new store!
            await handleSwitchStore({
                id: createdStore.id,
                name: createdStore.name,
                role: 'owner'
            });

        } catch (err: any) {
            toast.error(err.message || "Gagal membuat toko baru.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isSwitching}
                className={`flex items-center gap-2.5 px-3 py-1.5 md:px-3.5 md:py-2 bg-surface hover:bg-surface-hover text-text-primary rounded-xl border border-border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                    isSwitching ? 'opacity-70 pointer-events-none' : ''
                }`}
                title="Ganti Toko / Cabang"
            >
                <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Store className="w-3.5 h-3.5" />
                </div>
                
                <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                        Toko Aktif
                        {stores.length > 1 && (
                            <span className="bg-accent/20 text-accent px-1.5 py-0.2 rounded-full text-[9px] font-bold">
                                {stores.length}
                            </span>
                        )}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-text-primary max-w-[120px] md:max-w-[160px] truncate">
                        {activeStore?.name || "Memuat toko..."}
                    </span>
                </div>

                {isSwitching ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin ml-1 shrink-0" />
                ) : (
                    <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Header */}
                    <div className="p-3.5 border-b border-border bg-background/50 flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold text-text-primary">Pilih Toko / Cabang</h4>
                            <p className="text-[11px] text-text-muted">Akun Anda terhubung ke {stores.length} toko</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-text-secondary">
                            {currentRole}
                        </span>
                    </div>

                    {/* Stores List */}
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                        {stores.length === 0 ? (
                            <div className="p-4 text-center text-text-muted text-xs">
                                Tidak ada toko lain yang terhubung.
                            </div>
                        ) : (
                            stores.map((s) => {
                                const isActive = s.id === activeStore?.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => handleSwitchStore(s)}
                                        disabled={isSwitching}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                                            isActive
                                                ? "bg-accent/10 border border-accent/30 text-accent font-bold"
                                                : "hover:bg-surface-hover text-text-primary"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                isActive ? "bg-accent text-white" : "bg-surface-hover text-text-muted"
                                            }`}>
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div className="truncate">
                                                <div className="font-bold truncate text-text-primary">{s.name}</div>
                                                <div className="text-[10px] text-text-muted capitalize">
                                                    Peran: {s.role || "Staf"}
                                                </div>
                                            </div>
                                        </div>

                                        {isActive && (
                                            <div className="flex items-center gap-1 text-accent shrink-0 pl-2">
                                                <span className="text-[10px] font-semibold">Aktif</span>
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer / Create Store Action */}
                    {(currentRole === "owner" || stores.some(s => s.role === 'owner')) && (
                        <div className="p-2 border-t border-border bg-background/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setShowCreateModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold text-accent hover:bg-accent/10 transition-colors border border-dashed border-accent/30"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Toko / Cabang Baru
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Tambah Toko Baru */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-text-primary">Tambah Toko / Cabang Baru</h3>
                                <p className="text-text-muted text-xs">Buat toko baru untuk multi-cabang bisnis Anda</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateStore} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">
                                    Nama Toko / Cabang *
                                </label>
                                <input
                                    type="text"
                                    value={newStoreName}
                                    onChange={(e) => setNewStoreName(e.target.value)}
                                    placeholder="Contoh: NexPos Cabang Dago"
                                    required
                                    autoFocus
                                    className="w-full p-3 bg-background border border-border rounded-xl text-sm text-text-primary outline-none focus:border-accent transition-colors font-medium"
                                />
                            </div>

                            <div className="bg-surface-hover/60 border border-border p-3 rounded-xl text-[11px] text-text-muted leading-relaxed">
                                Toko baru akan otomatis dibuat dengan profil pengaturan mandiri, katalog menu terpisah, dan Anda akan langsung dialihkan ke toko baru tersebut.
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                    className="flex-1 py-2.5 bg-surface-hover hover:bg-border text-text-secondary rounded-xl text-xs font-bold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="flex-1 py-2.5 bg-accent text-white hover:bg-accent-hover rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-soft disabled:opacity-50"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Membuat...
                                        </>
                                    ) : (
                                        "Buat & Buka Toko"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
