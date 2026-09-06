import React, { useState } from 'react';

export default function ProductOptionsEditor({ options, onChange }: { options: any[], onChange: (options: any[]) => void }) {
    const addCategory = () => {
        onChange([...options, { id: Date.now().toString(), name: '', is_required: false, choices: [] }]);
    };

    const removeCategory = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        onChange(newOptions);
    };

    const updateCategoryName = (index: number, name: string) => {
        const newOptions = [...options];
        newOptions[index].name = name;
        onChange(newOptions);
    };

    const addChoice = (catIndex: number) => {
        const newOptions = [...options];
        newOptions[catIndex].choices.push({ name: '', price_adjustment: 0 });
        onChange(newOptions);
    };

    const updateChoice = (catIndex: number, choiceIndex: number, field: string, value: any) => {
        const newOptions = [...options];
        newOptions[catIndex].choices[choiceIndex][field] = value;
        onChange(newOptions);
    };

    const removeChoice = (catIndex: number, choiceIndex: number) => {
        const newOptions = [...options];
        newOptions[catIndex].choices.splice(choiceIndex, 1);
        onChange(newOptions);
    };

    return (
        <div className="mb-6 p-4 md:p-5 bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-gray-300">Opsi & Add-on (Ice/Hot, Topping)</h4>
                <button type="button" onClick={addCategory} className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold rounded-lg hover:bg-blue-500/20">+ Kategori Opsi</button>
            </div>
            
            {options.map((cat, catIndex) => (
                <div key={cat.id || catIndex} className="mb-4 p-3 border border-gray-700 rounded-lg bg-[#0B0F19]">
                    <div className="flex gap-2 items-center mb-2">
                        <input type="text" placeholder="Nama Kategori (ex: Suhu, Ukuran, Addon)" value={cat.name} onChange={e => updateCategoryName(catIndex, e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none focus:border-blue-500" required />
                        <button type="button" onClick={() => removeCategory(catIndex)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg">Hapus Kategori</button>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-gray-700">
                        {cat.choices.map((choice: any, choiceIndex: number) => (
                            <div key={choiceIndex} className="flex gap-2 items-center mb-2">
                                <input type="text" placeholder="Pilihan (ex: Ice, Hot, Oatmilk)" value={choice.name} onChange={e => updateChoice(catIndex, choiceIndex, 'name', e.target.value)} className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none text-sm" required />
                                <input type="number" placeholder="Tambahan Harga (ex: 5000)" value={choice.price_adjustment} onChange={e => updateChoice(catIndex, choiceIndex, 'price_adjustment', Number(e.target.value))} className="w-32 p-2 bg-gray-800 border border-gray-700 rounded-lg text-white outline-none text-sm" />
                                <button type="button" onClick={() => removeChoice(catIndex, choiceIndex)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg text-sm">✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addChoice(catIndex)} className="text-xs mt-1 text-blue-400 hover:underline">+ Tambah Pilihan</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
