'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';

export interface MaterialConverterHelperProps {
    targetUnit: string;
    onApply: (price: number) => void;
    onApplyStock?: (stock: number) => void;
    initialOpen?: boolean;
}

export const convertUnitRate = (oldUnit: string, newUnit: string, price: number, stock: number) => {
    let newPrice = price;
    let newStock = stock;

    const uOld = (oldUnit || '').toLowerCase().trim();
    const uNew = (newUnit || '').toLowerCase().trim();

    if (uOld === uNew) return { price, stock };

    // kg <-> g
    if (uOld === 'kg' && (uNew === 'g' || uNew === 'gr')) {
        newPrice = price / 1000;
        newStock = stock * 1000;
    } else if ((uOld === 'g' || uOld === 'gr') && uNew === 'kg') {
        newPrice = price * 1000;
        newStock = stock / 1000;
    }
    // liter <-> ml
    else if ((uOld === 'liter' || uOld === 'l') && uNew === 'ml') {
        newPrice = price / 1000;
        newStock = stock * 1000;
    } else if (uOld === 'ml' && (uNew === 'liter' || uNew === 'l')) {
        newPrice = price * 1000;
        newStock = stock / 1000;
    }

    return {
        price: Number(newPrice.toFixed(2)),
        stock: Number(newStock.toFixed(2))
    };
};

export default function MaterialConverterHelper({
    targetUnit,
    onApply,
    onApplyStock,
    initialOpen = false
}: MaterialConverterHelperProps) {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [buyQty, setBuyQty] = useState<string>('1');
    const [buyUnit, setBuyUnit] = useState<string>(() => {
        const u = (targetUnit || '').toLowerCase();
        if (u === 'g' || u === 'gr') return 'kg';
        if (u === 'ml') return 'liter';
        if (u === 'liter' || u === 'l') return 'liter';
        return 'kg';
    });
    const [buyPrice, setBuyPrice] = useState<string>('');
    const [packContent, setPackContent] = useState<string>('100');
    const lastAppliedRef = useRef<string>('');

    // Keep buyUnit sensible when targetUnit changes
    useEffect(() => {
        const u = (targetUnit || '').toLowerCase();
        if (u === 'g' || u === 'gr') setBuyUnit('kg');
        else if (u === 'ml') setBuyUnit('liter');
        else if (u === 'kg') setBuyUnit('kg');
        else if (u === 'liter' || u === 'l') setBuyUnit('liter');
    }, [targetUnit]);

    const qty = parseFloat(buyQty) || 0;
    const price = parseFloat(buyPrice) || 0;
    let unitMultiplier = 1;

    const tUnit = (targetUnit || '').toLowerCase();
    const bUnit = (buyUnit || '').toLowerCase();

    if (tUnit === 'g' || tUnit === 'gr') {
        if (bUnit === 'kg') unitMultiplier = 1000;
        else if (bUnit === 'g' || bUnit === 'gr') unitMultiplier = 1;
        else if (bUnit === 'pack' || bUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else if (tUnit === 'ml') {
        if (bUnit === 'liter' || bUnit === 'l') unitMultiplier = 1000;
        else if (bUnit === 'ml') unitMultiplier = 1;
        else if (bUnit === 'pack' || bUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else if (tUnit === 'kg') {
        if (bUnit === 'g' || bUnit === 'gr') unitMultiplier = 0.001;
        else if (bUnit === 'kg') unitMultiplier = 1;
        else if (bUnit === 'pack' || bUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else if (tUnit === 'liter' || tUnit === 'l') {
        if (bUnit === 'ml') unitMultiplier = 0.001;
        else if (bUnit === 'liter' || bUnit === 'l') unitMultiplier = 1;
        else if (bUnit === 'pack' || bUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    } else {
        if (bUnit === 'pack' || bUnit === 'dus') unitMultiplier = parseFloat(packContent) || 1;
    }

    const totalTargetUnits = qty * unitMultiplier;
    const pricePerTargetUnit = totalTargetUnits > 0 && price > 0 ? (price / totalTargetUnits) : 0;

    // OTOMATIS panggil onApply setiap kali nilai konversi valid berubah
    useEffect(() => {
        if (pricePerTargetUnit > 0) {
            const calculatedPrice = Number(pricePerTargetUnit.toFixed(2));
            const calculatedStock = totalTargetUnits > 0 ? Number(totalTargetUnits.toFixed(2)) : undefined;
            const key = `${calculatedPrice}-${calculatedStock}`;
            
            if (lastAppliedRef.current !== key) {
                lastAppliedRef.current = key;
                onApply(calculatedPrice);
                if (onApplyStock && calculatedStock !== undefined) {
                    onApplyStock(calculatedStock);
                }
            }
        }
    }, [pricePerTargetUnit, totalTargetUnits, onApply, onApplyStock]);

    return (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3.5 space-y-2.5">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
                <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                    💡 Kalkulator Konversi Beli (kg / liter / pack / dus)
                </span>
                <span className="text-xs text-accent underline font-semibold">{isOpen ? 'Tutup' : 'Buka Kalkulator'}</span>
            </div>

            {isOpen && (
                <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-text-muted">
                        Beli dalam partai/kemasan besar? Masukkan data belanja untuk konversi otomatis ke harga per <strong>{targetUnit || 'satuan'}</strong>:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-text-muted block mb-1">Jumlah Pembelian</label>
                            <input
                                type="number"
                                step="any"
                                value={buyQty}
                                onChange={e => setBuyQty(e.target.value)}
                                placeholder="Contoh: 1"
                                className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary text-xs outline-none focus:border-accent font-semibold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-text-muted block mb-1">Satuan Pembelian</label>
                            <select
                                value={buyUnit}
                                onChange={e => setBuyUnit(e.target.value)}
                                className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary text-xs outline-none focus:border-accent font-bold"
                            >
                                <option value="kg">kg (Kilogram = 1.000 g)</option>
                                <option value="g">g (Gram)</option>
                                <option value="liter">liter (Liter = 1.000 ml)</option>
                                <option value="ml">ml (Mililiter)</option>
                                <option value="pcs">pcs (Satuan)</option>
                                <option value="pack">pack (Isi pack)</option>
                                <option value="dus">dus (Isi dus/box)</option>
                            </select>
                        </div>
                    </div>

                    {(buyUnit === 'pack' || buyUnit === 'dus') && (
                        <div>
                            <label className="text-[10px] text-text-muted block mb-1">Isi per {buyUnit} (dalam {targetUnit || 'satuan'})</label>
                            <input
                                type="number"
                                step="any"
                                value={packContent}
                                onChange={e => setPackContent(e.target.value)}
                                placeholder={`Contoh: 100 (${targetUnit || 'satuan'})`}
                                className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary text-xs outline-none focus:border-accent"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] text-text-muted block mb-1">Total Harga Beli Belanja (Rp)</label>
                        <input
                            type="number"
                            step="any"
                            value={buyPrice}
                            onChange={e => setBuyPrice(e.target.value)}
                            placeholder="Contoh: 230000"
                            className="w-full p-2 bg-surface-hover border border-border rounded-lg text-text-primary text-xs outline-none focus:border-accent font-semibold text-accent"
                        />
                    </div>

                    {pricePerTargetUnit > 0 && (
                        <div className="bg-surface-glass border border-accent/30 p-2.5 rounded-lg flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <span className="text-[10px] text-green-400 font-bold block">
                                    ✓ Otomatis Diterapkan:
                                </span>
                                <span className="text-sm font-bold text-green-400">
                                    Rp {Number(pricePerTargetUnit.toFixed(2)).toLocaleString('id-ID')} / {targetUnit}
                                </span>
                                {totalTargetUnits > 0 && onApplyStock && (
                                    <span className="text-[10px] text-text-muted block mt-0.5">
                                        Stok diisi otomatis: {totalTargetUnits.toLocaleString('id-ID')} {targetUnit}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const calculatedPrice = Number(pricePerTargetUnit.toFixed(2));
                                    onApply(calculatedPrice);
                                    if (onApplyStock && totalTargetUnits > 0) {
                                        onApplyStock(Number(totalTargetUnits.toFixed(2)));
                                    }
                                    toast.success(`Harga satuan diterapkan: Rp ${calculatedPrice.toLocaleString('id-ID')} / ${targetUnit}`);
                                }}
                                className="px-2.5 py-1.5 bg-accent hover:bg-accent-hover text-text-primary rounded-lg text-xs font-bold transition-colors shrink-0"
                            >
                                Terapkan Ulang
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
