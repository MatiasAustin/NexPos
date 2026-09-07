/**
 * Utility helpers for expense quantity and unit parsing & formatting.
 * Ensures that whenever an expense is opened for editing, the previously entered
 * quantity and unit are displayed accurately on both Cashier (POS) and Admin dashboards.
 */

export interface ParsedExpenseQty {
    qty: number | string;
    unit: string;
}

export function parseExpenseQtyAndUnit(
    exp: any,
    material?: any,
    logs?: any[]
): ParsedExpenseQty {
    const defaultUnit = material
        ? (material.unit === 'g' || material.unit === 'gr')
            ? 'kg'
            : (material.unit === 'ml' ? 'liter' : material.unit)
        : 'pcs';

    if (!exp) return { qty: '', unit: defaultUnit };

    // 1. Direct database column (if quantity exists and > 0)
    if (exp.quantity !== undefined && exp.quantity !== null && Number(exp.quantity) > 0) {
        return {
            qty: Number(exp.quantity),
            unit: exp.buy_unit || defaultUnit
        };
    }

    const desc = (exp.description || '').trim();

    // 2. Bracketed or parenthesized quantity in description:
    // e.g. "(12 liter)", "[12 kg]", "(2 pcs)", "[qty: 12 liter]", "(12)"
    const bracketMatch = desc.match(/[\(\[]\s*(?:qty:)?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?[\)\]]/i);
    if (bracketMatch) {
        const qty = parseFloat(bracketMatch[1]);
        const unit = bracketMatch[2]?.toLowerCase() || defaultUnit;
        return { qty, unit };
    }

    // 3. Trailing number with optional unit word in description:
    // e.g. "beli fresh milk 12" -> 12 liter
    // "fresh milk 2" -> 2 liter
    // "es batu 1ball" -> 1 ball
    // "yakult 10" -> 10 pcs
    const trailingMatch = desc.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/i);
    if (trailingMatch) {
        const qty = parseFloat(trailingMatch[1]);
        const unitCand = trailingMatch[2]?.toLowerCase();
        const recognizedUnits = ['ball', 'bal', 'pack', 'dus', 'btl', 'botol', 'can', 'kaleng', 'kg', 'liter', 'ml', 'g', 'gr', 'pcs'];
        if (unitCand && recognizedUnits.includes(unitCand)) {
            return { qty, unit: unitCand };
        }
        return { qty, unit: defaultUnit };
    }

    // 4. Stock logs lookup for matching material & note
    if (logs && Array.isArray(logs)) {
        const matId = exp.raw_material_id || exp.material_id;
        for (const l of logs) {
            if (l.material_id === matId && l.note) {
                const noteLower = l.note.toLowerCase();
                const descLower = desc.toLowerCase();
                if (noteLower.includes(descLower) || (descLower.length >= 6 && noteLower.includes(descLower.slice(0, 8)))) {
                    const logMatch = l.note.match(/[\(\[]\s*(?:qty:)?\s*(\d+(?:\.\d+)?)\s*([a-zA-Z]+)[\)\]]/i);
                    if (logMatch) {
                        return { qty: parseFloat(logMatch[1]), unit: logMatch[2].toLowerCase() };
                    }
                }
            }
        }
    }

    return { qty: '', unit: defaultUnit };
}

/**
 * Strips any trailing parenthesized quantity like " (12 liter)" from description.
 */
export function cleanExpenseDescription(rawDesc: string): string {
    if (!rawDesc) return '';
    return rawDesc.replace(/\s*[\(\[]\s*(?:qty:)?\s*\d+(?:\.\d+)?\s*[a-zA-Z]*\s*[\)\]]\s*$/i, '').trim();
}

/**
 * Formats description by updating or appending " (qty unit)" so it persists reliably.
 */
export function formatExpenseDescription(rawDesc: string, qty?: number | string, unit?: string): string {
    const clean = cleanExpenseDescription(rawDesc);
    if (qty !== undefined && qty !== null && String(qty).trim() !== '' && Number(qty) > 0 && unit) {
        return `${clean} (${qty} ${unit})`;
    }
    return clean;
}
