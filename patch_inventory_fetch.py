import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_block = """            } else if (activeTab === "inventory") {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`);
                if(res.ok) setProducts(await res.json());
            }"""

new_block = """            } else if (activeTab === "inventory") {
                const [prodRes, matRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`),
                    supabase.from('raw_materials').select('*').order('name', { ascending: true })
                ]);
                if (prodRes.ok) setProducts(await prodRes.json());
                setRawMaterials(matRes.data || []);
            }"""

content = content.replace(old_block, new_block)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fetch patched")
