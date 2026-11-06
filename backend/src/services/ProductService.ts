import { supabase } from '../config/database';

export class ProductService {
    async getAllProducts(adminView: boolean = false) {
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });
        
        if (!adminView) {
            query = query.eq('is_active', true);
        }
        
        const { data, error } = await query;
        if (error) throw new Error(`Failed to fetch products: ${error.message}`);
        return data;
    }

    async createProduct(payload: any) {
        const insertData: any = {
            name: payload.name,
            category: payload.category,
            price: payload.price,
            cogs: payload.cogs,
            stock: payload.stock,
            image_icon: payload.image_icon || '📦',
            image_url: payload.image_url || null,
            is_active: payload.is_active !== undefined ? payload.is_active : true,
            ingredients: payload.ingredients || [],
            discount_percentage: payload.discount_percentage || 0,
            options_config: payload.options_config || []
        };
        if (payload.store_id) {
            insertData.store_id = payload.store_id;
        }

        const { data, error } = await supabase
            .from('products')
            .insert(insertData)
            .select('*')
            .single();

        if (error) throw new Error(`Failed to create product: ${error.message}`);
        return data;
    }

    async updateProduct(id: string, payload: any) {
        const updateData: any = {
            name: payload.name,
            category: payload.category,
            price: payload.price,
            cogs: payload.cogs,
            stock: payload.stock,
            image_icon: payload.image_icon,
            is_active: payload.is_active,
            ingredients: payload.ingredients,
            discount_percentage: payload.discount_percentage,
            options_config: payload.options_config,
            operational_cost: payload.operational_cost,
            updated_at: new Date().toISOString()
        };
        if (payload.image_url !== undefined) {
            updateData.image_url = payload.image_url;
        }
        if (payload.store_id !== undefined) {
            updateData.store_id = payload.store_id;
        }

        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw new Error(`Failed to update product: ${error.message}`);
        return data;
    }

    async deleteProduct(id: string) {
        // Cek jika produk pernah terjual di order_items
        const { data: orderItem } = await supabase
            .from('order_items')
            .select('id')
            .eq('product_id', id)
            .limit(1)
            .maybeSingle();

        if (orderItem) {
            // Soft delete / nonaktifkan agar integritas riwayat laporan penjualan tetap 100% aman
            const { error } = await supabase
                .from('products')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw new Error(`Gagal menonaktifkan produk: ${error.message}`);
            return true;
        }

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
            // Fallback soft delete jika terkena constraint lain
            const { error: softErr } = await supabase
                .from('products')
                .update({ is_active: false, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (softErr) throw new Error(`Failed to delete product: ${error.message}`);
            return true;
        }
        return true;
    }
}
