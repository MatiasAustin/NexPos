import Link from "next/link";

export default function Home() {
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
      </div>
    </div>
  );
}
