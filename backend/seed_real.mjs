import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghlfmcalhlesuouqsaer.supabase.co';
const supabaseKey = 'sb_publishable_jZt9H6VWSznwtwBaYZLerw_oi4PY6T7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Wiping existing data...');
    
    // Wipe expenses
    const { error: e1 } = await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Wipe expenses:', e1 ? e1.message : 'OK');

    // Wipe logs
    const { error: e2 } = await supabase.from('material_stock_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Wipe material logs:', e2 ? e2.message : 'OK');

    // Wipe materials
    const { error: e3 } = await supabase.from('raw_materials').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Wipe raw materials:', e3 ? e3.message : 'OK');

    // Wipe transactions and orders to free up products
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('kiosk_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cash_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('refunds').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Wipe products
    const { error: e4 } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('Wipe products:', e4 ? e4.message : 'OK');

    // Setup raw materials for coffee shop
    const rawMaterials = [
        { name: 'Kopi Blend (Espresso)', unit: 'g', last_price_per_unit: 150, current_stock: 0 },
        { name: 'Susu Fresh Milk', unit: 'ml', last_price_per_unit: 20, current_stock: 0 },
        { name: 'Gula Aren', unit: 'g', last_price_per_unit: 30, current_stock: 0 },
        { name: 'Matcha Powder', unit: 'g', last_price_per_unit: 250, current_stock: 0 },
        { name: 'Red Velvet Powder', unit: 'g', last_price_per_unit: 150, current_stock: 0 },
        { name: 'Taro Powder', unit: 'g', last_price_per_unit: 150, current_stock: 0 },
        { name: 'Chocolate Powder', unit: 'g', last_price_per_unit: 150, current_stock: 0 },
        { name: 'Sirup Karamel', unit: 'ml', last_price_per_unit: 80, current_stock: 0 },
        { name: 'Sirup Vanilla', unit: 'ml', last_price_per_unit: 80, current_stock: 0 },
        { name: 'Yakult', unit: 'botol', last_price_per_unit: 2500, current_stock: 0 },
        { name: 'Air Mineral', unit: 'ml', last_price_per_unit: 5, current_stock: 0 },
        { name: 'Es Batu', unit: 'cube', last_price_per_unit: 100, current_stock: 0 },
        { name: 'Cup Kopi Panas', unit: 'pcs', last_price_per_unit: 1000, current_stock: 0 },
        { name: 'Cup Kopi Dingin', unit: 'pcs', last_price_per_unit: 1200, current_stock: 0 },
        { name: 'Kentang Frozen', unit: 'g', last_price_per_unit: 30, current_stock: 0 },
        { name: 'Dimsum Mentah', unit: 'pcs', last_price_per_unit: 2500, current_stock: 0 },
        { name: 'Saus Mentai', unit: 'g', last_price_per_unit: 50, current_stock: 0 },
        { name: 'Teh Celup/Daun', unit: 'g', last_price_per_unit: 50, current_stock: 0 },
        { name: 'Lemon', unit: 'slice', last_price_per_unit: 500, current_stock: 0 },
        { name: 'Daun Mint', unit: 'helai', last_price_per_unit: 100, current_stock: 0 },
        { name: 'Manual Brew Beans', unit: 'g', last_price_per_unit: 300, current_stock: 0 },
        { name: 'Gas Elpiji', unit: 'tabung', last_price_per_unit: 22000, current_stock: 0 },
    ];

    const { data: insertedMats, error: matErr } = await supabase.from('raw_materials').insert(rawMaterials).select();
    if (matErr) {
        console.error('Failed to insert materials:', matErr);
        return;
    }
    
    console.log('Inserted raw materials successfully');

    // Create a map of material names to IDs
    const matMap = {};
    for (const m of insertedMats) {
        matMap[m.name] = m.id;
    }

    // Prepare Products from PDF
    const products = [
        // SIGNATURE
        { name: 'Kalana Coffee (Hot)', category: 'Signature', price: 20000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Gula Aren'], name: 'Gula Aren', qty: 20, unit: 'g' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Kalana Coffee (Ice)', category: 'Signature', price: 23000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Gula Aren'], name: 'Gula Aren', qty: 20, unit: 'g' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Kalana Sea Salt Butterschotch (Ice)', category: 'Signature', price: 25000, image_icon: '🧂', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' }
        ]},
        { name: 'Black Berry (Ice)', category: 'Signature', price: 22000, image_icon: '🫐', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Magic (Ice)', category: 'Signature', price: 23000, image_icon: '✨', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 36, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 120, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Pinky Lady (Ice)', category: 'Signature', price: 23000, image_icon: '🎀', ingredients: [
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},

        // COFFEE
        { name: 'Espresso', category: 'Coffee', price: 18000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Americano (Hot)', category: 'Coffee', price: 18000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 200, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Americano (Ice)', category: 'Coffee', price: 20000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Cafe Latte (Hot)', category: 'Coffee', price: 20000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 180, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Cafe Latte (Ice)', category: 'Coffee', price: 22000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Cappucino (Hot)', category: 'Coffee', price: 20000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Cappucino (Ice)', category: 'Coffee', price: 23000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 120, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mochacino (Hot)', category: 'Coffee', price: 23000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Chocolate Powder'], name: 'Chocolate Powder', qty: 15, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mochacino (Ice)', category: 'Coffee', price: 25000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Chocolate Powder'], name: 'Chocolate Powder', qty: 15, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Caramel Latte (Hot)', category: 'Coffee', price: 23000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Sirup Karamel'], name: 'Sirup Karamel', qty: 20, unit: 'ml' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Caramel Latte (Ice)', category: 'Coffee', price: 25000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Sirup Karamel'], name: 'Sirup Karamel', qty: 20, unit: 'ml' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Machiato (Hot)', category: 'Coffee', price: 23000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 30, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Machiato (Ice)', category: 'Coffee', price: 25000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 50, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Vanila Latte (Hot)', category: 'Coffee', price: 23000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Sirup Vanilla'], name: 'Sirup Vanilla', qty: 20, unit: 'ml' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Vanila Latte (Ice)', category: 'Coffee', price: 25000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Sirup Vanilla'], name: 'Sirup Vanilla', qty: 20, unit: 'ml' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Brown Sugar (Ice)', category: 'Coffee', price: 23000, image_icon: '🥤', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Gula Aren'], name: 'Gula Aren', qty: 25, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Sanger', category: 'Coffee', price: 20000, image_icon: '☕', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 50, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Coffee Orange (Ice)', category: 'Coffee', price: 22000, image_icon: '🍊', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 100, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Matcha Coffee (Ice)', category: 'Coffee', price: 25000, image_icon: '🍵', ingredients: [
            { id: matMap['Kopi Blend (Espresso)'], name: 'Kopi Blend (Espresso)', qty: 18, unit: 'g' },
            { id: matMap['Matcha Powder'], name: 'Matcha Powder', qty: 15, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},

        // MANUAL BREW
        { name: 'Pour Over', category: 'Manual Brew', price: 20000, image_icon: '☕', ingredients: [
            { id: matMap['Manual Brew Beans'], name: 'Manual Brew Beans', qty: 15, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 250, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Japanese Style (Ice)', category: 'Manual Brew', price: 26000, image_icon: '🧊', ingredients: [
            { id: matMap['Manual Brew Beans'], name: 'Manual Brew Beans', qty: 15, unit: 'g' },
            { id: matMap['Air Mineral'], name: 'Air Mineral', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},

        // FOOD
        { name: 'Dimsum Kukus', category: 'Food', price: 20000, image_icon: '🥟', ingredients: [
            { id: matMap['Dimsum Mentah'], name: 'Dimsum Mentah', qty: 4, unit: 'pcs' },
            { id: matMap['Gas Elpiji'], name: 'Gas Elpiji', qty: 0.05, unit: 'tabung' }
        ]},
        { name: 'French Fries', category: 'Food', price: 20000, image_icon: '🍟', ingredients: [
            { id: matMap['Kentang Frozen'], name: 'Kentang Frozen', qty: 200, unit: 'g' },
            { id: matMap['Gas Elpiji'], name: 'Gas Elpiji', qty: 0.05, unit: 'tabung' }
        ]},
        { name: 'Kalana Plater', category: 'Food', price: 25000, image_icon: '🍢', ingredients: [
            { id: matMap['Kentang Frozen'], name: 'Kentang Frozen', qty: 100, unit: 'g' },
            { id: matMap['Dimsum Mentah'], name: 'Dimsum Mentah', qty: 2, unit: 'pcs' },
            { id: matMap['Gas Elpiji'], name: 'Gas Elpiji', qty: 0.1, unit: 'tabung' }
        ]},
        { name: 'Dimsum Mentai', category: 'Food', price: 25000, image_icon: '🥟', ingredients: [
            { id: matMap['Dimsum Mentah'], name: 'Dimsum Mentah', qty: 4, unit: 'pcs' },
            { id: matMap['Saus Mentai'], name: 'Saus Mentai', qty: 20, unit: 'g' },
            { id: matMap['Gas Elpiji'], name: 'Gas Elpiji', qty: 0.05, unit: 'tabung' }
        ]},

        // NON COFFEE
        { name: 'Chocolate (Hot)', category: 'Non Coffee', price: 20000, image_icon: '🍫', ingredients: [
            { id: matMap['Chocolate Powder'], name: 'Chocolate Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Chocolate (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍫', ingredients: [
            { id: matMap['Chocolate Powder'], name: 'Chocolate Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Chocolate Caramel (Ice)', category: 'Non Coffee', price: 25000, image_icon: '🍫', ingredients: [
            { id: matMap['Chocolate Powder'], name: 'Chocolate Powder', qty: 20, unit: 'g' },
            { id: matMap['Sirup Karamel'], name: 'Sirup Karamel', qty: 20, unit: 'ml' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Matcha (Hot)', category: 'Non Coffee', price: 21000, image_icon: '🍵', ingredients: [
            { id: matMap['Matcha Powder'], name: 'Matcha Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Matcha (Ice)', category: 'Non Coffee', price: 23000, image_icon: '🍵', ingredients: [
            { id: matMap['Matcha Powder'], name: 'Matcha Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Red Velvet (Hot)', category: 'Non Coffee', price: 20000, image_icon: '🍓', ingredients: [
            { id: matMap['Red Velvet Powder'], name: 'Red Velvet Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Red Velvet (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍓', ingredients: [
            { id: matMap['Red Velvet Powder'], name: 'Red Velvet Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Taro (Hot)', category: 'Non Coffee', price: 20000, image_icon: '🍠', ingredients: [
            { id: matMap['Taro Powder'], name: 'Taro Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Cup Kopi Panas'], name: 'Cup Kopi Panas', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Taro (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍠', ingredients: [
            { id: matMap['Taro Powder'], name: 'Taro Powder', qty: 20, unit: 'g' },
            { id: matMap['Susu Fresh Milk'], name: 'Susu Fresh Milk', qty: 150, unit: 'ml' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Strawberry Yakult (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍓', ingredients: [
            { id: matMap['Yakult'], name: 'Yakult', qty: 1, unit: 'botol' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mango Yakult (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🥭', ingredients: [
            { id: matMap['Yakult'], name: 'Yakult', qty: 1, unit: 'botol' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Lychee Yakult (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍒', ingredients: [
            { id: matMap['Yakult'], name: 'Yakult', qty: 1, unit: 'botol' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Lemon Tea (Ice)', category: 'Non Coffee', price: 20000, image_icon: '🍋', ingredients: [
            { id: matMap['Teh Celup/Daun'], name: 'Teh Celup/Daun', qty: 5, unit: 'g' },
            { id: matMap['Lemon'], name: 'Lemon', qty: 1, unit: 'slice' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Strawberry Tea (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍓', ingredients: [
            { id: matMap['Teh Celup/Daun'], name: 'Teh Celup/Daun', qty: 5, unit: 'g' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Lychee Tea (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍒', ingredients: [
            { id: matMap['Teh Celup/Daun'], name: 'Teh Celup/Daun', qty: 5, unit: 'g' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mojito Lychee (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍹', ingredients: [
            { id: matMap['Daun Mint'], name: 'Daun Mint', qty: 5, unit: 'helai' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mojito Strawberry (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍹', ingredients: [
            { id: matMap['Daun Mint'], name: 'Daun Mint', qty: 5, unit: 'helai' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
        { name: 'Mojito Mango (Ice)', category: 'Non Coffee', price: 22000, image_icon: '🍹', ingredients: [
            { id: matMap['Daun Mint'], name: 'Daun Mint', qty: 5, unit: 'helai' },
            { id: matMap['Es Batu'], name: 'Es Batu', qty: 5, unit: 'cube' },
            { id: matMap['Cup Kopi Dingin'], name: 'Cup Kopi Dingin', qty: 1, unit: 'pcs' }
        ]},
    ];

    // Calculate COGS
    for (const p of products) {
        let cogs = 0;
        for (const ing of p.ingredients) {
            const rawMat = rawMaterials.find(rm => rm.name === ing.name);
            if (rawMat) {
                cogs += (rawMat.last_price_per_unit * ing.qty);
            }
        }
        p.cogs = cogs;
        p.stock = 100; // dummy stock
    }

    const { error: pErr } = await supabase.from('products').insert(products);
    if (pErr) {
        console.error('Failed to insert products:', pErr);
    } else {
        console.log('Inserted products successfully!');
    }
}

run();
