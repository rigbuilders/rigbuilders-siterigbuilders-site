export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  image: string;
  inStock: boolean;
  
  // Specs from DB
  socket?: string;
  memory_type?: string;
  wattage?: number;
  length_mm?: number;          // GPU Length
  max_gpu_length_mm?: number;  // Cabinet GPU Clearance
  
  // --- NEW FIELDS FROM ADMIN UPDATE ---
  form_factor?: string;        // Mobo Form Factor (e.g. "ATX")
  radiator_size?: string;      // Cooler Size (e.g. "360mm")
  supported_motherboards?: string[]; // Cabinet supported sizes
  supported_radiators?: string[];    // Cabinet supported coolers

  // Logic Flags
  isCompatible?: boolean;
  compatibilityMsg?: string;
}

export interface SelectionState {
  cpu: Product | null;
  motherboard: Product | null;
  gpu: Product | null;
  ram: Product | null;
  storage: Product | null;
  cooler: Product | null;
  psu: Product | null;
  cabinet: Product | null;
  monitor: Product | null;
  keyboard: Product | null;
  mouse: Product | null;
  combo: Product | null;
  osPrimary: Product | null;
  osSecondary: Product | null;
}