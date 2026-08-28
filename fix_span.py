import os
path = 'frontend/src/app/pos/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<span className="text-orange-300 text-xs mb-1">Meja {order.table_number} / {order.customer_name}</span>',
    '<span className="text-orange-400 text-xs mb-1">{order.queue_number || order.id}</span>'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
