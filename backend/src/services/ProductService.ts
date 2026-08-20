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
        const { data, error } = await supabase
            .from('products')
            .insert({
                name: payload.name,
                category: payload.category,
                price: payload.price,
                cogs: payload.cogs,
                stock: payload.stock,
                image_icon: payload.image_icon || '📦',
                is_active: payload.is_active !== undefined ? payload.is_active : true,
                ingredients: payload.ingredients || []
            })
            .select('*')
            .single();

        if (error) throw new Error(`Failed to create product: ${error.message}`);
        return data;
    }

    async updateProduct(id: string, payload: any) {
        const { data, error } = await supabase
            .from('products')
            .update({
                name: payload.name,
                category: payload.category,
                price: payload.price,
                cogs: payload.cogs,
                stock: payload.stock,
                image_icon: payload.image_icon,
                is_active: payload.is_active,
                ingredients: payload.ingredients,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw new Error(`Failed to update product: ${error.message}`);
        return data;
    }

    async deleteProduct(id: string) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw new Error(`Failed to delete product: ${error.message}`);
        return true;
    }
}
