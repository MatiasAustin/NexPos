import React from 'react';
import { Plus, Trash2, CheckCircle2, ListFilter, Sparkles, Layers } from 'lucide-react';

export interface OptionChoice {
    id?: string;
    name: string;
    price_adjustment: number;
}

export interface OptionCategory {
    id: string;
    name: string;
    type?: 'single' | 'multiple'; // single = radio (pilih 1), multiple = checkbox (add-ons)
    is_required?: boolean;
    choices: OptionChoice[];
}

export default function ProductOptionsEditor({
    options,
    onChange
}: {
    options: OptionCategory[];
    onChange: (options: OptionCategory[]) => void;
}) {
    const addCategory = () => {
        onChange([
            ...options,
            {
                id: 'opt_' + Date.now().toString(),
                name: '',
                type: 'single',
                is_required: false,
                choices: [{ id: 'ch_' + Date.now(), name: '', price_adjustment: 0 }]
            }
        ]);
    };

    const removeCategory = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        onChange(newOptions);
    };

    const updateCategory = (index: number, field: keyof OptionCategory, value: any) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        onChange(newOptions);
    };

    const addChoice = (catIndex: number) => {
        const newOptions = [...options];
        const newChoice: OptionChoice = { id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5), name: '', price_adjustment: 0 };
        newOptions[catIndex].choices = [...(newOptions[catIndex].choices || []), newChoice];
        onChange(newOptions);
    };

    const updateChoice = (catIndex: number, choiceIndex: number, field: keyof OptionChoice, value: any) => {
        const newOptions = [...options];
        const choices = [...newOptions[catIndex].choices];
        choices[choiceIndex] = { ...choices[choiceIndex], [field]: value };
        newOptions[catIndex].choices = choices;
        onChange(newOptions);
    };

    const removeChoice = (catIndex: number, choiceIndex: number) => {
        const newOptions = [...options];
        const choices = [...newOptions[catIndex].choices];
        choices.splice(choiceIndex, 1);
        newOptions[catIndex].choices = choices;
        onChange(newOptions);
    };

    // Quick Templates
    const applyTemplateSuhu = () => {
        const exists = options.some(o => o.name.toLowerCase().includes('suhu') || o.name.toLowerCase().includes('temperature'));
        if (exists) return;
        onChange([
            ...options,
            {
                id: 'opt_suhu_' + Date.now(),
                name: 'Varian Suhu',
                type: 'single',
                is_required: true,
                choices: [
                    { id: 'hot', name: 'Hot', price_adjustment: 0 },
                    { id: 'ice', name: 'Ice', price_adjustment: 2000 }
                ]
            }
        ]);
    };

    const applyTemplateSugar = () => {
        const exists = options.some(o => o.name.toLowerCase().includes('sugar') || o.name.toLowerCase().includes('gula'));
        if (exists) return;
        onChange([
            ...options,
            {
                id: 'opt_sugar_' + Date.now(),
                name: 'Level Gula',
                type: 'single',
                is_required: false,
                choices: [
                    { id: 'normal', name: 'Normal Sugar', price_adjustment: 0 },
                    { id: 'less', name: 'Less Sugar', price_adjustment: 0 },
                    { id: 'no', name: 'No Sugar', price_adjustment: 0 }
                ]
            }
        ]);
    };

    const applyTemplateAddon = () => {
        const exists = options.some(o => o.name.toLowerCase().includes('addon') || o.name.toLowerCase().includes('add-on') || o.name.toLowerCase().includes('topping'));
        if (exists) return;
        onChange([
            ...options,
            {
                id: 'opt_addon_' + Date.now(),
                name: 'Add-on / Tambahan',
                type: 'multiple',
                is_required: false,
                choices: [
                    { id: 'oatmilk', name: 'Oatmilk', price_adjustment: 5000 },
                    { id: 'extra_shot', name: 'Extra Shot Espresso', price_adjustment: 5000 },
                    { id: 'syrup_vanilla', name: 'Syrup Vanilla', price_adjustment: 4000 }
                ]
            }
        ]);
    };

    const applyTemplateComplete = () => {
        const filtered = options.filter(o => 
            !o.name.toLowerCase().includes('suhu') && 
            !o.name.toLowerCase().includes('sugar') && 
            !o.name.toLowerCase().includes('gula') && 
            !o.name.toLowerCase().includes('addon') &&
            !o.name.toLowerCase().includes('add-on')
        );
        onChange([
            ...filtered,
            {
                id: 'opt_suhu_' + Date.now(),
                name: 'Varian Suhu',
                type: 'single',
                is_required: true,
                choices: [
                    { id: 'hot', name: 'Hot', price_adjustment: 0 },
                    { id: 'ice', name: 'Ice', price_adjustment: 2000 }
                ]
            },
            {
                id: 'opt_sugar_' + (Date.now() + 1),
                name: 'Level Gula',
                type: 'single',
                is_required: false,
                choices: [
                    { id: 'normal', name: 'Normal Sugar', price_adjustment: 0 },
                    { id: 'less', name: 'Less Sugar', price_adjustment: 0 },
                    { id: 'no', name: 'No Sugar', price_adjustment: 0 }
                ]
            },
            {
                id: 'opt_addon_' + (Date.now() + 2),
                name: 'Add-on / Tambahan',
                type: 'multiple',
                is_required: false,
                choices: [
                    { id: 'oatmilk', name: 'Oatmilk', price_adjustment: 5000 },
                    { id: 'extra_shot', name: 'Extra Shot Espresso', price_adjustment: 5000 }
                ]
            }
        ]);
    };

    return (
        <div className="p-4 md:p-5 bg-gray-900/90 border border-gray-800 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                <div>
                    <h4 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                        <Layers className="w-5 h-5 text-blue-400" /> Opsi Varian & Add-on Menu
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Atur varian (Ice/Hot, Level Gula) dan tambahan add-on berbayar (Oatmilk, Extra Shot, dll).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addCategory}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
            </div>

            {/* Quick Templates Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Template Cepat:
                </span>
                <button
                    type="button"
                    onClick={applyTemplateComplete}
                    className="text-xs px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg font-bold transition-all"
                >
                    ✨ Paket Minuman Lengkap
                </button>
                <button
                    type="button"
                    onClick={applyTemplateSuhu}
                    className="text-xs px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg font-semibold transition-all"
                >
                    🧊 Varian Suhu (Hot/Ice)
                </button>
                <button
                    type="button"
                    onClick={applyTemplateSugar}
                    className="text-xs px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg font-semibold transition-all"
                >
                    🍬 Level Gula (Normal/Less/No)
                </button>
                <button
                    type="button"
                    onClick={applyTemplateAddon}
                    className="text-xs px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg font-semibold transition-all"
                >
                    🥛 Add-on (+5rb)
                </button>
            </div>

            {/* Categories List */}
            {options.length === 0 ? (
                <div className="py-6 px-4 text-center border-2 border-dashed border-gray-800 rounded-xl bg-gray-950/40 text-gray-500 text-xs">
                    Belum ada opsi varian atau addon pada produk ini. Klik tombol di atas atau gunakan <strong>Template Cepat</strong>.
                </div>
            ) : (
                <div className="space-y-4">
                    {options.map((cat, catIndex) => {
                        const isMulti = cat.type === 'multiple';
                        return (
                            <div key={cat.id || catIndex} className="p-3.5 sm:p-4 border border-gray-700/80 rounded-xl bg-[#0B0F19] shadow-md space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex-1 flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nama Kategori (contoh: Varian Suhu / Add-on)"
                                            value={cat.name}
                                            onChange={e => updateCategory(catIndex, 'name', e.target.value)}
                                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-bold text-sm outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Type Selector: Single (Radio) vs Multiple (Add-on Checkbox) */}
                                        <div className="flex bg-gray-800 p-0.5 rounded-lg border border-gray-700 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => updateCategory(catIndex, 'type', 'single')}
                                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                                    !isMulti ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                                }`}
                                                title="Hanya bisa pilih 1 (Radio)"
                                            >
                                                Pilih 1 (Radio)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateCategory(catIndex, 'type', 'multiple')}
                                                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                                                    isMulti ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                                }`}
                                                title="Bisa pilih lebih dari satu (Add-on)"
                                            >
                                                Add-on (Banyak)
                                            </button>
                                        </div>

                                        {/* Required toggle (only relevant for single selection) */}
                                        {!isMulti && (
                                            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer px-2 py-1 bg-gray-800/80 border border-gray-700 rounded-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={!!cat.is_required}
                                                    onChange={e => updateCategory(catIndex, 'is_required', e.target.checked)}
                                                    className="rounded text-blue-500"
                                                />
                                                <span>Wajib</span>
                                            </label>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeCategory(catIndex)}
                                            className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                                            title="Hapus Kategori"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Choices */}
                                <div className="pl-3 sm:pl-4 border-l-2 border-gray-700/80 space-y-2">
                                    {(cat.choices || []).map((choice, choiceIndex) => (
                                        <div key={choice.id || choiceIndex} className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 shrink-0 w-4 text-center">
                                                {isMulti ? '☑' : '●'}
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Nama Pilihan (cth: Hot, Ice, Oatmilk)"
                                                value={choice.name}
                                                onChange={e => updateChoice(catIndex, choiceIndex, 'name', e.target.value)}
                                                className="flex-1 p-2 bg-gray-800/90 border border-gray-700 rounded-lg text-white text-xs sm:text-sm outline-none focus:border-blue-500"
                                                required
                                            />
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-xs text-gray-400">+Rp</span>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="0"
                                                    value={choice.price_adjustment === 0 ? '0' : (choice.price_adjustment || '')}
                                                    onChange={e => updateChoice(catIndex, choiceIndex, 'price_adjustment', Number(e.target.value))}
                                                    className="w-24 sm:w-28 p-2 bg-gray-800/90 border border-gray-700 rounded-lg text-white text-xs sm:text-sm outline-none focus:border-blue-500 text-right"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeChoice(catIndex, choiceIndex)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-colors shrink-0"
                                                title="Hapus pilihan"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => addChoice(catIndex)}
                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold pt-1 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Pilihan / Add-on
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
