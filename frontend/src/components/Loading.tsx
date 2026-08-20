'use client';

// Skeleton loading components for NexPos
export function SkeletonRow({ cols = 3 }: { cols?: number }) {
    return (
        <tr className="border-b border-gray-800">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="p-4">
                    <div className="h-4 bg-gray-800/60 rounded-lg animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                </td>
            ))}
        </tr>
    );
}

export function SkeletonCard() {
    return (
        <div className="p-5 rounded-2xl bg-[#131B2C] border border-gray-800 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-800 rounded-lg w-40" />
                <div className="h-5 bg-gray-800 rounded-lg w-20" />
            </div>
            <div className="h-4 bg-gray-800 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-800 rounded-lg w-1/2" />
        </div>
    );
}

export function SkeletonTable({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-800">
            <div className="p-4 border-b border-gray-800 bg-gray-800/30">
                <div className="h-5 bg-gray-700 rounded-lg w-40 animate-pulse" />
            </div>
            <table className="w-full">
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonRow key={i} cols={cols} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function SkeletonStat() {
    return (
        <div className="p-6 bg-[#131B2C] border border-gray-800 rounded-2xl animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-700 rounded w-36" />
        </div>
    );
}

export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className={`${sizes[size]} border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin`} />
            {text && <p className="text-gray-500 text-sm font-medium">{text}</p>}
        </div>
    );
}

export function LoadingOverlay({ text = 'Memuat...' }: { text?: string }) {
    return (
        <div className="absolute inset-0 bg-[#0B0F19]/80 flex items-center justify-center z-10 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-400 text-sm font-medium">{text}</span>
            </div>
        </div>
    );
}
