import express from 'express';
import { TransactionService } from '../services/TransactionService';
import { CashManagementService } from '../services/CashManagementService';
import { ReconciliationService } from '../services/ReconciliationService';
import { RefundService } from '../services/RefundService';
import { AuthService } from '../services/AuthService';
import { ProductService } from '../services/ProductService';
import { supabase } from '../config/database';

const router = express.Router();
const transactionService = new TransactionService();
const cashService = new CashManagementService();
const reconciliationService = new ReconciliationService();
const refundService = new RefundService();
const authService = new AuthService();
const productService = new ProductService();

// =======================
// INVENTORY & PRODUCTS
// =======================
router.get('/products', async (req, res) => {
    try {
        // POS / Customer view (only active)
        const products = await productService.getAllProducts(false);
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/products', async (req, res) => {
    try {
        const products = await productService.getAllProducts(true);
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/admin/products', async (req, res) => {
    try {
        const product = await productService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/products/:id', async (req, res) => {
    try {
        const product = await productService.updateProduct(req.params.id, req.body);
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/admin/products/:id', async (req, res) => {
    try {
        await productService.deleteProduct(req.params.id);
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// TRANSACTIONS & REFUNDS
// =======================
router.get('/transactions', async (req, res) => {
    try {
        const { startDate, endDate } = req.query as any;
        const transactions = await transactionService.getTransactionHistory(500, startDate, endDate);
        res.json(transactions);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/admin/transactions/:id', async (req, res) => {
    try {
        const trxId = req.params.id;
        
        // Hitung total perubahan saldo laci dari seluruh riwayat cash_movements transaksi ini (penjualan + refund)
        const { data: movements } = await supabase.from('cash_movements').select('*').eq('transaction_id', trxId);
        if (movements && movements.length > 0) {
            let netCashChange = 0;
            let sessionId = null;
            for (const mov of movements) {
                netCashChange += parseFloat(mov.amount); // sale is positive, refund is negative
                sessionId = mov.session_id;
            }
            // Karena transaksinya DIBATALKAN (dihapus), kita harus MEMBALIK efek uang laci.
            // Contoh: Sale +20k, Refund -20k. Net = 0. Tidak ada efek.
            // Contoh: Sale +20k, Tidak ada refund. Net = +20k. Dihapus -> Kurangi 20k.
            if (sessionId && netCashChange !== 0) {
                const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', sessionId).single();
                if (session) {
                    const restoredCash = parseFloat(session.expected_cash) - netCashChange;
                    await supabase.from('cash_sessions').update({ expected_cash: restoredCash }).eq('id', sessionId);
                }
            }
        }
        
        // Hapus child tables terlebih dahulu jika tidak ada CASCADE
        await supabase.from('refunds').delete().eq('transaction_id', trxId);
        await supabase.from('cash_movements').delete().eq('transaction_id', trxId);
        await supabase.from('transaction_items').delete().eq('transaction_id', trxId);
        await supabase.from('order_items').delete().eq('transaction_id', trxId);
        
        // Hapus master table (transactions)
        const { error } = await supabase.from('transactions').delete().eq('id', trxId);
        if (error) throw error;
        
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/refunds', async (req, res) => {
    try {
        const { transaction_id, refund_amount, reason, requested_by } = req.body;
        // Direct approve for simplicity in this demo, or we can use the two-step
        const request = await refundService.requestRefund({ transaction_id, refund_amount, reason, requested_by });
        const approved = await refundService.approveRefund(request.id, requested_by);
        res.json(approved);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// STAFF & AUTH (ADMIN ONLY)
// =======================
router.get('/staff', async (req, res) => {
    try {
        const staff = await authService.getStaffList();
        res.json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/staff', async (req, res) => {
    try {
        const staff = await authService.createStaff(req.body);
        res.status(201).json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/staff/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        const staff = await authService.toggleStaffStatus(req.params.id, is_active);
        res.json(staff);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/staff/:id', async (req, res) => {
    try {
        const result = await authService.updateStaff(req.params.id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/staff/:id', async (req, res) => {
    try {
        const result = await authService.deleteStaff(req.params.id);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// PAYMENT METHODS
// =======================
router.get('/payment-methods', async (req, res) => {
    const { data, error } = await supabase.from('payment_methods').select('*').eq('is_active', true);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

router.put('/payment-methods/:id/toggle', async (req, res) => {
    const { is_active } = req.body;
    const { data, error } = await supabase
        .from('payment_methods')
        .update({ is_active })
        .eq('id', req.params.id)
        .select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// =======================
// TRANSACTIONS
// =======================
router.post('/payments/process', async (req, res) => {
    try {
        const result = await transactionService.createTransaction(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/payments/webhook/:providerId', async (req, res) => {
    try {
        await transactionService.handleWebhook(req.params.providerId, req.body);
        res.status(200).send('OK');
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// REFUNDS
// =======================
router.post('/refunds/request', async (req, res) => {
    try {
        const result = await refundService.requestRefund(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/refunds/:id/approve', async (req, res) => {
    try {
        const { approvedBy, sessionId } = req.body;
        const result = await refundService.approveRefund(req.params.id, approvedBy, sessionId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// =======================
// CASH SESSIONS
// =======================
router.get('/health2', (req, res) => res.json({ status: 'v3' }));
router.get('/debug-sessions2', async (req, res) => { const { data, error } = await supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }).limit(10); res.json({ data, error }); });
router.put('/admin/cash-sessions/:id/opening-cash', async (req, res) => {
    try {
        const { opening_cash } = req.body;
        if (opening_cash === undefined || opening_cash === null) {
            return res.status(400).json({ error: 'opening_cash is required' });
        }
        const { data: oldSession } = await supabase.from('cash_sessions').select('opening_cash, expected_cash').eq('id', req.params.id).single();
        let newExpectedCash = 0;
        if (oldSession) {
            const diff = Number(opening_cash) - Number(oldSession.opening_cash || 0);
            newExpectedCash = Number(oldSession.expected_cash || 0) + diff;
        }

        const { data, error } = await supabase
            .from('cash_sessions')
            .update({ opening_cash: Number(opening_cash), ...(oldSession ? { expected_cash: newExpectedCash } : {}) })
            .eq('id', req.params.id)
            .select('*')
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/admin/cash-sessions/:id', async (req, res) => {
    try {
        await supabase.from('cash_movements').delete().eq('session_id', req.params.id);
        const { error } = await supabase.from('cash_sessions').delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { sessionId } = req.query; // optional, to restore drawer

        // Get expense first to match reason
        const { data: expense } = await supabase.from('expenses').select('*').eq('id', id).single();
        if (expense) {
            // Find and delete the related cash_movement (heuristic match since no fk)
            const reasonPattern = `%${expense.description}%`;
            let movQuery = supabase.from('cash_movements')
                .select('*')
                .eq('type', 'expense')
                .eq('amount', -Math.abs(expense.amount))
                .ilike('reason', reasonPattern);
            
            if (sessionId) movQuery = movQuery.eq('session_id', sessionId);
            if (expense.store_id) movQuery = movQuery.eq('store_id', expense.store_id);
            
            const { data: movements } = await movQuery;
            
            if (movements && movements.length > 0) {
                for (const mov of movements) {
                    await supabase.from('cash_movements').delete().eq('id', mov.id);
                    // Restore expected_cash
                    const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', mov.session_id).single();
                    if (session) {
                        const restored = parseFloat(session.expected_cash) - parseFloat(mov.amount); // mov.amount is negative
                        await supabase.from('cash_sessions').update({ expected_cash: restored }).eq('id', mov.session_id);
                    }
                }
            }
            
            // Delete expense
            await supabase.from('expenses').delete().eq('id', id);
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/cash-sessions', async (req, res) => {
    try {
        const { storeId } = req.query;
        let query = supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false });
        if (storeId) {
            query = query.eq('store_id', storeId);
        }
        const { data, error } = await query;
        if (error) throw error;
        
        // Fetch all expenses and refunds (source of truth)
        let expQuery = supabase.from('expenses').select('created_at, amount, store_id');
        let refQuery = supabase.from('refunds').select('created_at, refund_amount, store_id').in('status', ['APPROVED', 'approved', 'Approved']);
        if (storeId) {
            expQuery = expQuery.eq('store_id', storeId);
            refQuery = refQuery.eq('store_id', storeId);
        }
        const { data: allExpenses } = await expQuery;
        const { data: allRefunds } = await refQuery;
        
        const sessionsWithTotals = data.map(session => {
            const sessionStart = session.opened_at;
            const sessionEnd = session.closed_at || new Date().toISOString();
            const sessionExpenses = allExpenses ? allExpenses.filter(e => (!session.store_id || !e.store_id || e.store_id === session.store_id) && e.created_at >= sessionStart && e.created_at <= sessionEnd) : [];
            const sessionRefunds = allRefunds ? allRefunds.filter(r => (!session.store_id || !r.store_id || r.store_id === session.store_id) && r.created_at >= sessionStart && r.created_at <= sessionEnd) : [];
            const total_expense = sessionExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const total_refund = sessionRefunds.reduce((sum, r) => sum + Number(r.refund_amount), 0);
            return {
                ...session,
                total_expense,
                total_refund
            };
        });
        
        res.json(sessionsWithTotals);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/health2', (req, res) => res.json({ status: 'v3' }));
router.get('/cash-sessions/active', async (req, res) => {
    try {
        const { staffId, terminalId, storeId } = req.query;
        const session = await cashService.getActiveSession(String(staffId), String(terminalId), storeId ? String(storeId) : undefined);
        if (session) {
            res.json(session);
        } else {
            res.status(404).json({ error: 'No active session found' });
        }
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/fix-drawer', async (req, res) => {
    try {
        // Cari cash_movements pengeluaran sebesar 45000 (minus) yang yatim piatu
        const { data: orphanedMovements } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('type', 'expense')
            .eq('amount', -45000);
            
        if (!orphanedMovements || orphanedMovements.length === 0) {
            return res.json({ message: 'Tidak ditemukan pengeluaran 45k yang nyangkut.' });
        }
        
        let fixed = 0;
        for (const mov of orphanedMovements) {
            // Hapus cash_movements
            await supabase.from('cash_movements').delete().eq('id', mov.id);
            
            // Kembalikan saldo expected_cash ke shift
            const { data: session } = await supabase.from('cash_sessions').select('expected_cash').eq('id', mov.session_id).single();
            if (session) {
                // amount bernilai -45000, jadi kalau dikurangkan akan menambah 45000
                const restoredCash = parseFloat(session.expected_cash) - parseFloat(mov.amount);
                await supabase.from('cash_sessions').update({ expected_cash: restoredCash }).eq('id', mov.session_id);
            }
            fixed++;
        }
        
        res.json({ message: `BERHASIL! ${fixed} data pengeluaran 45k yang nyangkut berhasil dihapus dari sistem kasir dan uang laci telah dikembalikan. Silakan refresh halaman POS Anda.` });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-sessions/open', async (req, res) => {
    try {
        const { staffId, terminalId, openingCash, storeId } = req.body;
        const session = await cashService.openSession(staffId, terminalId, openingCash, storeId);
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-sessions/close', async (req, res) => {
    try {
        const { sessionId, actualCash, discrepancyReason } = req.body;
        const session = await cashService.closeSession(sessionId, actualCash, discrepancyReason);
        res.json(session);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/cash-movements', async (req, res) => {
    try {
        await cashService.recordMovement(req.body);
        res.status(201).json({ success: true });
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});

// =======================
// REPORTS & AUDITS
// =======================
router.get('/reconciliation', async (req, res) => {
    try {
        const { startDate, endDate, mode } = req.query as any;
        // Default: today if no date given
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
        const start = startDate || todayStart.toISOString();
        const end = endDate || todayEnd.toISOString();
        const report = await reconciliationService.getReconciliationReport(start, end, mode);
        res.json(report);
    } catch (error: any) {
         res.status(400).json({ error: error.message });
    }
});

router.get('/audit-logs', async (req, res) => {
    const limit = parseInt(String(req.query.limit || '50'));
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// =======================
// MULTI-STORE & STORE SWITCH
// =======================
router.get('/user-stores/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // 1. Check if superadmin
        const { data: superAdmin } = await supabase.from('super_admins').select('user_id').eq('user_id', userId).maybeSingle();
        if (superAdmin) {
            const { data: allStores } = await supabase.from('stores').select('*').order('name', { ascending: true });
            const { data: prof } = await supabase.from('staff_profiles').select('store_id').eq('id', userId).maybeSingle();
            return res.json({
                current_store_id: prof?.store_id || null,
                stores: (allStores || []).map(s => ({
                    id: s.id,
                    name: s.name,
                    role: 'owner',
                    is_active: s.id === prof?.store_id
                }))
            });
        }

        // 2. Fetch current staff profile
        const { data: profile } = await supabase.from('staff_profiles').select('store_id, role').eq('id', userId).maybeSingle();
        const currentStoreId = profile?.store_id;

        // 3. Stores owned by user
        const { data: ownedStores } = await supabase.from('stores').select('*').eq('owner_id', userId);

        // 4. Stores from store_members
        let memberStores: any[] = [];
        try {
            const { data: mems } = await supabase
                .from('store_members')
                .select('role, stores(id, name, subscription_plan, status)')
                .eq('user_id', userId);
            if (mems) {
                memberStores = mems
                    .filter(m => m.stores)
                    .map(m => ({ ...(m.stores as any), memberRole: m.role }));
            }
        } catch(e) {}

        // 5. Current store details if not already in owned/member
        let currentStoreObj: any = null;
        if (currentStoreId) {
            const { data: cs } = await supabase.from('stores').select('*').eq('id', currentStoreId).maybeSingle();
            if (cs) currentStoreObj = cs;
        }

        // Combine and deduplicate
        const storeMap = new Map<string, any>();

        if (ownedStores) {
            for (const s of ownedStores) {
                storeMap.set(s.id, {
                    id: s.id,
                    name: s.name,
                    role: 'owner',
                    is_active: s.id === currentStoreId
                });
            }
        }

        for (const s of memberStores) {
            if (!storeMap.has(s.id)) {
                storeMap.set(s.id, {
                    id: s.id,
                    name: s.name,
                    role: s.memberRole || 'staff',
                    is_active: s.id === currentStoreId
                });
            }
        }

        if (currentStoreObj && !storeMap.has(currentStoreObj.id)) {
            storeMap.set(currentStoreObj.id, {
                id: currentStoreObj.id,
                name: currentStoreObj.name,
                role: profile?.role || 'staff',
                is_active: true
            });
        }

        res.json({
            current_store_id: currentStoreId,
            stores: Array.from(storeMap.values())
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/switch-store', async (req, res) => {
    try {
        const { userId, targetStoreId } = req.body;
        if (!userId || !targetStoreId) {
            return res.status(400).json({ error: 'userId and targetStoreId are required' });
        }

        // 1. Get store details
        const { data: store, error: storeErr } = await supabase.from('stores').select('*').eq('id', targetStoreId).single();
        if (storeErr || !store) {
            return res.status(404).json({ error: 'Toko tidak ditemukan' });
        }

        // 2. Check if user has access (owner_id, store_members, staff_profiles, or super_admin)
        let hasAccess = false;
        let role = 'staff';

        const { data: superAdmin } = await supabase.from('super_admins').select('user_id').eq('user_id', userId).maybeSingle();
        if (superAdmin) {
            hasAccess = true;
            role = 'owner';
        } else if (store.owner_id === userId) {
            hasAccess = true;
            role = 'owner';
        } else {
            // Check store_members
            const { data: member } = await supabase.from('store_members').select('*').eq('user_id', userId).eq('store_id', targetStoreId).maybeSingle();
            if (member) {
                hasAccess = true;
                role = member.role || 'staff';
            } else {
                // Check current staff profile
                const { data: prof } = await supabase.from('staff_profiles').select('*').eq('id', userId).maybeSingle();
                if (prof && prof.store_id === targetStoreId) {
                    hasAccess = true;
                    role = prof.role || 'staff';
                }
            }
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'Anda tidak memiliki akses ke toko ini' });
        }

        // 3. Update staff_profiles
        const updateData: any = { store_id: targetStoreId };
        if (role) updateData.role = role;
        const { data: updatedProfile, error: updateErr } = await supabase
            .from('staff_profiles')
            .update(updateData)
            .eq('id', userId)
            .select('*')
            .single();

        if (updateErr) throw updateErr;

        // 4. Record to store_members if exists
        try {
            await supabase.from('store_members').upsert({
                user_id: userId,
                store_id: targetStoreId,
                role
            }, { onConflict: 'user_id,store_id' });
        } catch(e) {}

        res.json({
            success: true,
            store_id: targetStoreId,
            store_name: store.name,
            profile: updatedProfile
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/stores/create', async (req, res) => {
    try {
        const { userId, name, subscription_plan } = req.body;
        if (!userId || !name) {
            return res.status(400).json({ error: 'userId and name are required' });
        }

        // 1. Create store
        const { data: newStore, error: storeErr } = await supabase
            .from('stores')
            .insert({
                name,
                owner_id: userId,
                subscription_plan: subscription_plan || 'pro',
                status: 'active'
            })
            .select('*')
            .single();

        if (storeErr) throw storeErr;

        // 2. Create default store_settings
        await supabase.from('store_settings').insert({
            store_id: newStore.id,
            receipt_header: name
        });

        // 3. Add to store_members
        try {
            await supabase.from('store_members').insert({
                user_id: userId,
                store_id: newStore.id,
                role: 'owner'
            });
        } catch(e) {}

        res.status(201).json(newStore);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
