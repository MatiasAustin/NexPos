import os

path = 'frontend/src/app/admin/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_ui = """
                                                      <p className="font-bold text-white capitalize text-lg">{String(log.action || '').replace(/_/g, ' ')}</p>
                                                      <p className="text-sm text-gray-500 mt-1">Entity: <span className="text-gray-300">{log.entity_type}</span> | Staff: <span className="text-gray-300">{log.staff_id || 'System'}</span></p>
"""
new_ui = """
                                                      <p className="font-bold text-white capitalize text-lg">
                                                          {log.details?.action ? log.details.action : String(log.action || '').replace(/_/g, ' ')}
                                                      </p>
                                                      <p className="text-sm text-gray-400 mt-1">
                                                          <span className="text-blue-400 font-bold">?? {log.details?.staff_name || log.staff_id || 'System'}</span>
                                                          <span className="mx-2 text-gray-600">|</span>
                                                          Entity: <span className="text-gray-300">{log.entity_type}</span>
                                                      </p>
                                                      {log.details?.product_name && <p className="text-sm text-gray-500">Nama: <span className="text-yellow-500">{log.details.product_name}</span></p>}
                                                      {log.details?.description && <p className="text-sm text-gray-500">Deskripsi: <span className="text-yellow-500">{log.details.description}</span></p>}
                                                      {log.details?.order_reference && <p className="text-sm text-gray-500">Ref: <span className="text-yellow-500">{log.details.order_reference}</span></p>}
"""

content = content.replace(old_ui, new_ui)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("UI patched")
