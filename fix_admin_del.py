import re

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

del_fn = """    const handleDeleteSession = async (id: string) => {
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

    const handleDeleteProduct"""

content = content.replace("    const handleDeleteProduct", del_fn)

row_target = """                                                      <p className="text-xs text-gray-500">
                                                          Buka: {new Date(session.opened_at).toLocaleString('id-ID')}
                                                          {session.closed_at && ` | Tutup: ${new Date(session.closed_at).toLocaleString('id-ID')}`}
                                                      </p>
                                                  </div>"""
row_replacement = """                                                      <p className="text-xs text-gray-500">
                                                          Buka: {new Date(session.opened_at).toLocaleString('id-ID')}
                                                          {session.closed_at && ` | Tutup: ${new Date(session.closed_at).toLocaleString('id-ID')}`}
                                                      </p>
                                                      <button onClick={() => handleDeleteSession(session.id)} disabled={loading} className="mt-2 text-[10px] uppercase font-bold tracking-wider px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500/20 w-fit transition-colors">
                                                          Hapus
                                                      </button>
                                                  </div>"""
content = content.replace(row_target, row_replacement)

with open("d:/WORK/BUILD_APP/NexPos/frontend/src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

