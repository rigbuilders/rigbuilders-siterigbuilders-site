import { Product, SelectionState } from "./types";

// Friendly display names for the selection keys (used by the summary panels &
// mobile bar). Keeps the left "receipt" wording consistent with the grid cards
// instead of showing raw keys like "Cpu" / "Gpu" / "Psu".
export const PART_LABELS: Record<string, string> = {
    cpu: "Processor",
    motherboard: "Motherboard",
    gpu: "Graphics Card",
    ram: "Memory (RAM)",
    storage: "Storage",
    cooler: "Cooling",
    psu: "Power Supply",
    cabinet: "Cabinet",
    monitor: "Monitor",
    keyboard: "Keyboard",
    mouse: "Mouse",
    combo: "Keyboard & Mouse",
    osPrimary: "Primary OS",
    osSecondary: "Secondary OS",
};

export const partLabel = (key: string) =>
    PART_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export const filterInventory = (inventory: Product[], selections: SelectionState) => {
    const getCat = (cat: string) => inventory.filter(p => p.category === cat);

    let gpus = getCat('gpu');
    let mobos = getCat('motherboard');
    let rams = getCat('ram');
    let cabinets = getCat('cabinet');
    let coolers = getCat('cooler');

    // --- 1. CPU <-> MOTHERBOARD (Socket) ---
    if (selections.cpu?.socket) {
        mobos = mobos.map(m => ({
            ...m,
            isCompatible: m.socket === selections.cpu?.socket,
            compatibilityMsg: m.socket !== selections.cpu?.socket 
                ? `Requires ${selections.cpu?.socket} socket` : undefined
        }));
    }

    // --- 2. MOTHERBOARD <-> RAM (DDR Type) ---
    if (selections.motherboard?.memory_type) {
        rams = rams.map(r => ({
            ...r,
            isCompatible: r.memory_type === selections.motherboard?.memory_type,
            compatibilityMsg: r.memory_type !== selections.motherboard?.memory_type 
                ? `Requires ${selections.motherboard?.memory_type}` : undefined
        }));
    }

    // --- 3. CABINET <-> MOTHERBOARD (Form Factor) [NEW] ---
    // Rule: Cabinet must support Mobo's size (e.g. ATX)
    if (selections.cabinet?.supported_motherboards) {
        // If Cabinet is selected, filter Mobos
        mobos = mobos.map(m => {
            const isFit = m.form_factor ? selections.cabinet!.supported_motherboards!.includes(m.form_factor) : true;
            return {
                ...m,
                isCompatible: m.isCompatible !== false && isFit, // Don't override previous incompatibility
                compatibilityMsg: m.compatibilityMsg || (!isFit ? `Cabinet fits only: ${selections.cabinet!.supported_motherboards!.join(', ')}` : undefined)
            };
        });
    }
    if (selections.motherboard?.form_factor) {
        // If Mobo is selected, filter Cabinets
        cabinets = cabinets.map(c => {
            const isFit = c.supported_motherboards ? c.supported_motherboards.includes(selections.motherboard!.form_factor!) : true;
            return {
                ...c,
                isCompatible: isFit,
                compatibilityMsg: !isFit ? `Too small for ${selections.motherboard!.form_factor} Mobo` : undefined
            };
        });
    }

    // --- 4. CABINET <-> COOLER (Radiator Size) [NEW] ---
    // Rule: Cabinet must support Cooler's radiator (e.g. 360mm)
    if (selections.cabinet?.supported_radiators) {
        coolers = coolers.map(c => {
            // "Air Cooler" is usually always supported, check specifically for Liquid/AIO sizes
            const isAir = c.radiator_size === "Air Cooler";
            const isFit = isAir || (c.radiator_size ? selections.cabinet!.supported_radiators!.includes(c.radiator_size) : true);
            return {
                ...c,
                isCompatible: isFit,
                compatibilityMsg: !isFit ? `Cabinet supports: ${selections.cabinet!.supported_radiators!.join(', ')}` : undefined
            };
        });
    }
    if (selections.cooler?.radiator_size && selections.cooler.radiator_size !== "Air Cooler") {
        cabinets = cabinets.map(c => {
            const isFit = c.supported_radiators ? c.supported_radiators.includes(selections.cooler!.radiator_size!) : false;
            return {
                ...c,
                isCompatible: c.isCompatible !== false && isFit,
                compatibilityMsg: c.compatibilityMsg || (!isFit ? `Doesn't support ${selections.cooler!.radiator_size} Radiator` : undefined)
            };
        });
    }

    // --- 5. CABINET <-> GPU (Clearance) ---
    if (selections.cabinet?.max_gpu_length_mm) {
        const maxLen = selections.cabinet.max_gpu_length_mm;
        gpus = gpus.map(g => ({
            ...g,
            isCompatible: (g.length_mm || 0) <= maxLen,
            compatibilityMsg: (g.length_mm || 0) > maxLen ? `Too long (${g.length_mm}mm > ${maxLen}mm)` : undefined
        }));
    }
    if (selections.gpu?.length_mm) {
        const gpuLen = selections.gpu.length_mm;
        cabinets = cabinets.map(c => {
            const isFit = (c.max_gpu_length_mm || 400) >= gpuLen;
            return {
                ...c,
                isCompatible: c.isCompatible !== false && isFit,
                compatibilityMsg: c.compatibilityMsg || (!isFit ? `Too small for GPU (${gpuLen}mm)` : undefined)
            };
        });
    }

    return {
        cpus: getCat('cpu'),
        gpus, mobos, rams, cabinets, coolers,
        storages: getCat('storage'),
        psus: getCat('psu'),
        monitors: inventory.filter(p => p.category === 'monitor' || p.category === 'display'),
        keyboards: inventory.filter(p => p.category === 'keyboard'),
        mice: inventory.filter(p => p.category === 'mouse'),
        combos: inventory.filter(p => p.category === 'combo'),
        osList: inventory.filter(p => p.category === 'os'),
    };
};

// --- HELPER TO CLEAN WATTAGE STRINGS (e.g., "120W" -> 120) ---
const getCleanWattage = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    // Extract digits to strictly force mathematical addition
    const match = String(val).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
};

export const calculateTotals = (selections: SelectionState) => {
    // 1. Strictly cast prices to Numbers to prevent "0100" string concatenation bugs
    const totalPrice = Object.values(selections).reduce((acc, item) => {
        const price = item && item.price ? Number(item.price) : 0;
        return acc + (isNaN(price) ? 0 : price);
    }, 0);
    
    let totalTDP = 0;

    // 2. Read pure wattage from the database, respecting exactly what you type (including 0)
    const getPower = (item: any) => {
        if (!item) return 0;
        return getCleanWattage(item.wattage);
    };

    totalTDP += getPower(selections.cpu);
    totalTDP += getPower(selections.gpu);
    totalTDP += getPower(selections.motherboard);
    totalTDP += getPower(selections.ram);
    totalTDP += getPower(selections.storage);
    totalTDP += getPower(selections.cooler);
    
    // 3. System Overhead Buffer
    // Reduced from the massive 100W to a 50W buffer to account for case fans, RGB, and the motherboard chipset.
    // (If you want 100% pure DB accuracy with zero hidden math, change this 50 to a 0)
    const systemOverhead = 0;
    const estimatedTDP = totalTDP + systemOverhead;
    
    const psuWattage = selections.psu ? getCleanWattage(selections.psu.wattage) : 0;
    const isPowerSufficient = selections.psu ? psuWattage >= estimatedTDP : true;

    return { totalPrice, estimatedTDP, psuWattage, isPowerSufficient };
};