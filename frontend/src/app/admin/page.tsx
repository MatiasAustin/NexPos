"use client";

import { useState, useEffect } from "react";
import { getReconciliationReport, getAuditLogs } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"reconciliation" | "audit">("reconciliation");
    const [reconciliation, setReconciliation] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "reconciliation") {
                // Fetching for today as an example
                const today = new Date().toISOString().split('T')[0];
                const report = await getReconciliationReport(today, today + "T23:59:59Z");
                setReconciliation(report);
            } else {
                const logs = await getAuditLogs();
                setAuditLogs(logs);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/" className="flex items-center text-gray-500 hover:text-blue-600 mb-2">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Home
                        </Link>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-gray-500">NexPos Control Center</p>
                    </div>
                    <button 
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button 
                        onClick={() => setActiveTab("reconciliation")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "reconciliation" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Laporan Rekonsiliasi
                    </button>
                    <button 
                        onClick={() => setActiveTab("audit")}
                        className={`pb-4 px-2 font-semibold ${activeTab === "audit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                    >
                        Audit & Security Log
                    </button>
                </div>

                {/* Content */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">Loading data...</div>
                    ) : (
                        <>
                            {/* RECONCILIATION TAB */}
                            {activeTab === "reconciliation" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Bandingkan POS vs Aktual
                                    </h2>
                                    {reconciliation.length === 0 ? (
                                        <p className="text-gray-500">Belum ada transaksi hari ini.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-4 font-semibold text-gray-600">Metode Pembayaran</th>
                                                        <th className="p-4 font-semibold text-gray-600">Jml Transaksi</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Total POS (Rp)</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Tercatat di Provider (Rp)</th>
                                                        <th className="p-4 font-semibold text-gray-600 text-right">Selisih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reconciliation.map((row, idx) => (
                                                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="p-4 font-medium">{row.method_name}</td>
                                                            <td className="p-4 text-gray-600">{row.transaction_count}</td>
                                                            <td className="p-4 text-right font-bold text-blue-600">
                                                                {row.pos_total.toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="p-4 text-right text-gray-600">
                                                                {/* Simulasi data aktual provider, aslinya diambil dari integrasi */}
                                                                {row.pos_total.toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="p-4 text-right font-bold text-green-500">0</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AUDIT LOG TAB */}
                            {activeTab === "audit" && (
                                <div>
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        Jejak Audit Sistem
                                    </h2>
                                    {auditLogs.length === 0 ? (
                                        <p className="text-gray-500">Belum ada jejak audit yang terekam.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {auditLogs.map((log) => (
                                                <div key={log.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-gray-800 capitalize">
                                                            Aksi: {log.action.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            Entity: {log.entity_type} | Staff ID: {log.staff_id}
                                                        </p>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-400">
                                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
