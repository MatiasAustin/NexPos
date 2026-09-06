import fs from 'fs';

let content = fs.readFileSync('frontend/src/app/pos/page.tsx', 'utf-8');

// 1. Fix Qty inputs (Line 1539 and 1441)
// We change Number(e.target.value) || 0 to e.target.value for stockAdjustment.delta
content = content.replace(
    /onChange=\{e => setStockAdjustment\(\{\.\.\.stockAdjustment, delta: Number\(e\.target\.value\) \|\| 0\}\)\}/g,
    `onChange={e => setStockAdjustment({...stockAdjustment, delta: e.target.value as any})}`
);
content = content.replace(
    /value=\{stockAdjustment\.delta \|\| ''\}/g,
    `value={stockAdjustment.delta}`
);

// 2. Add Discount Rendering to Product Card
const productCardRegex = /(<div className="text-blue-400 font-bold mt-1">Rp \{Number\(product\.price\)\.toLocaleString\('id-ID'\)\}<\/div>)/;
content = content.replace(productCardRegex,
    `{product.discount_percentage > 0 ? (
        <div className="flex flex-col mt-1">
            <div className="text-gray-500 line-through text-xs">Rp {Number(product.price).toLocaleString('id-ID')}</div>
            <div className="text-blue-400 font-bold">Rp {(Number(product.price) * (1 - product.discount_percentage/100)).toLocaleString('id-ID')}</div>
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{product.discount_percentage}% OFF</div>
        </div>
    ) : (
        $1
    )}`
);

// 3. Discount logic in POS Cart calculation
// We must find where addToCart is called or the cart items are rendered.
// addToCart takes product. But wait, if they have options, we should show a modal.
// I will just add the discount to the price directly when adding to cart.

const addToCartRegex = /(return \[\.\.\.prev, \{ product, qty: 1 \}\];)/;
content = content.replace(addToCartRegex,
    `const finalPrice = product.discount_percentage > 0 ? product.price * (1 - product.discount_percentage / 100) : product.price;
            return [...prev, { product: { ...product, original_price: product.price, price: finalPrice }, qty: 1 }];`
);

fs.writeFileSync('frontend/src/app/pos/page.tsx', content, 'utf-8');
console.log("Updated pos/page.tsx with Qty Fix and Discount");
