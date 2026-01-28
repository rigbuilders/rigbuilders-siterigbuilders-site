import { Product, SelectionState } from "./types";

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

export const calculateTotals = (selections: SelectionState) => {
    const totalPrice = Object.values(selections).reduce((acc, item) => acc + (item?.price || 0), 0);
    
    let totalTDP = 0;
    if (selections.cpu) totalTDP += selections.cpu.wattage || 65;
    if (selections.gpu) totalTDP += selections.gpu.wattage || 0;
    if (selections.motherboard) totalTDP += 50;
    if (selections.ram) totalTDP += 15;
    if (selections.storage) totalTDP += 10;
    if (selections.cooler) totalTDP += 10;
    
    // Add overhead
    const estimatedTDP = totalTDP > 0 ? totalTDP + 100 : 0;
    const psuWattage = selections.psu?.wattage || 0;
    const isPowerSufficient = selections.psu ? psuWattage >= estimatedTDP : true;

    return { totalPrice, estimatedTDP, psuWattage, isPowerSufficient };
};