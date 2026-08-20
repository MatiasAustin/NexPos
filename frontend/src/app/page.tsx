"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-400">Memeriksa sesi...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900">
      <h1 className="text-4xl font-bold mb-4">NexPos System</h1>
      <p className="text-gray-500 mb-8">Pilih modul untuk masuk</p>
      
      <div className="flex gap-4">
        <Link 
            href="/pos"
            className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg"
        >
            Buka Terminal Kasir
        </Link>
        <Link 
            href="/admin"
            className="px-8 py-4 bg-white border border-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-50 shadow-sm"
        >
            Dashboard Admin
        </Link>
        <Link 
            href="/customer"
            className="px-8 py-4 bg-orange-100 border border-orange-200 text-orange-700 rounded-xl font-bold hover:bg-orange-200 shadow-sm"
        >
            Kiosk Customer
        </Link>
      </div>
    </div>
  );
}
