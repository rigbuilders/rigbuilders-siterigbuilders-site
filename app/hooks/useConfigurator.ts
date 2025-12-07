// app/hooks/useConfigurator.ts
import { useState, useMemo } from "react";
import { cpus, motherboards, gpus, rams, psus, cabinets, coolers, storages, osList } from "../data/products";
import { CPU, Motherboard, GPU, RAM, PSU, Cabinet, Cooler, Storage, OS } from "../data/types";

export function useConfigurator() {
  // --- STATE (Initialized to NULL for Zero State) ---
  const [selectedCPU, setSelectedCPU] = useState<CPU | null>(null);
  const [selectedMobo, setSelectedMobo] = useState<Motherboard | null>(null); 
  const [selectedGPU, setSelectedGPU] = useState<GPU | null>(null);
  const [selectedRAM, setSelectedRAM] = useState<RAM | null>(null);
  const [selectedPSU, setSelectedPSU] = useState<PSU | null>(null);
  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [selectedCooler, setSelectedCooler] = useState<Cooler | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  
  // OS State
  const [primaryOS, setPrimaryOS] = useState<OS | null>(null);
  const [secondaryOS, setSecondaryOS] = useState<OS | null>(null);

  // --- LOGIC: COMPATIBILITY FILTERS ---
  
  // 1. Motherboards: Depend on CPU
  const compatibleMotherboards = useMemo(() => {
    if (!selectedCPU) return []; // No CPU = No Mobos shown
    return motherboards.filter((m) => m.socket === selectedCPU.socket);
  }, [selectedCPU]);

  // 2. RAM: Depend on CPU
  const compatibleRAM = useMemo(() => {
    if (!selectedCPU) return rams; // Show all if no CPU (or return [] to be strict. Let's show all for browsing)
    return rams.filter((r) => r.type === selectedCPU.supportedRam);
  }, [selectedCPU]);

  // 3. Cabinets: Depend on Mobo Size & GPU Length
  const compatibleCabinets = useMemo(() => {
    return cabinets.map(cab => ({
        ...cab,
        // If no mobo selected, assume it fits. If mobo selected, check size.
        isCompatible: selectedMobo ? cab.supportedMotherboards.includes(selectedMobo.formFactor) : true,
        // If no GPU selected, assume it fits.
        isGpuFit: selectedGPU ? cab.maxGpuLength >= selectedGPU.lengthMm : true
    }));
  }, [selectedMobo, selectedGPU]);

  // 4. Coolers: Depend on CPU TDP
  const compatibleCoolers = useMemo(() => {
    return coolers.map(cooler => ({ 
        ...cooler, 
        isSufficient: selectedCPU ? cooler.tdpRating >= selectedCPU.tdp : true 
    }));
  }, [selectedCPU]);

  // --- LOGIC: POWER CALCULATOR ---
  const powerStats = useMemo(() => {
    let totalTDP = 0;
    
    // Only add power if component is selected
    if (selectedCPU) totalTDP += selectedCPU.tdp;
    if (selectedGPU) totalTDP += selectedGPU.tdp;
    
    // Add base system overhead only if core parts are picked, else 0 or minimal
    if (selectedCPU || selectedMobo) totalTDP += 80;

    const recommended = Math.ceil(totalTDP * 1.3);
    return { totalTDP, recommended };
  }, [selectedCPU, selectedGPU, selectedMobo]);

  // --- LOGIC: PSU RECOMMENDATION ---
  const processedPSUs = useMemo(() => {
    return psus.map((psu) => ({
      ...psu,
      isCompatible: psu.wattage >= powerStats.totalTDP,
      isRecommended: psu.wattage >= powerStats.recommended,
    }));
  }, [powerStats]);

  // --- TOTAL PRICE CALCULATION ---
  const totalPrice = 
    (selectedCPU?.price || 0) + 
    (selectedMobo?.price || 0) + 
    (selectedGPU?.price || 0) + 
    (selectedRAM?.price || 0) + 
    (selectedPSU?.price || 0) + 
    (selectedCabinet?.price || 0) + 
    (selectedCooler?.price || 0) + 
    (selectedStorage?.price || 0) + 
    (primaryOS?.price || 0) + 
    (secondaryOS?.price || 0);

  // --- HANDLERS ---
  const handleCPUChange = (cpu: CPU | null) => {
    setSelectedCPU(cpu);
    
    // If CPU is removed or changed, check socket compatibility
    if (cpu && selectedMobo && selectedMobo.socket !== cpu.socket) {
      setSelectedMobo(null); // Reset invalid mobo
    } else if (!cpu) {
      setSelectedMobo(null); // No CPU = No Mobo
    }

    // Check RAM compatibility
    if (cpu && selectedRAM && selectedRAM.type !== cpu.supportedRam) {
        setSelectedRAM(null);
    }
  };

  return {
    selections: { cpu: selectedCPU, mobo: selectedMobo, gpu: selectedGPU, ram: selectedRAM, psu: selectedPSU, cabinet: selectedCabinet, cooler: selectedCooler, storage: selectedStorage, primaryOS, secondaryOS },
    setters: { setCPU: handleCPUChange, setMobo: setSelectedMobo, setGPU: setSelectedGPU, setRAM: setSelectedRAM, setPSU: setSelectedPSU, setCabinet: setSelectedCabinet, setCooler: setSelectedCooler, setStorage: setSelectedStorage, setPrimaryOS, setSecondaryOS },
    data: { cpus, motherboards: compatibleMotherboards, gpus, rams: compatibleRAM, psus: processedPSUs, cabinets: compatibleCabinets, coolers: compatibleCoolers, storages, osList },
    stats: { powerStats, totalPrice }
  };
}