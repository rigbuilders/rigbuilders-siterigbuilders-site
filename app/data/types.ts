// app/data/types.ts

export type SocketType = "AM4" | "AM5" | "LGA1700";
export type RamType = "DDR4" | "DDR5";
export type FormFactor = "ATX" | "mATX" | "E-ATX";

export interface ProductBase {
  id: string;
  name: string;
  price: number;
  brand: string;      // NEW: For filtering (e.g. "AMD", "Corsair")
  inStock: boolean;   // NEW: For inventory management
  image?: string;     // NEW: For product visuals
}

export interface CPU extends ProductBase {
  category: "cpu";
  socket: SocketType;
  supportedRam: RamType;
  tdp: number; 
  integratedGraphics: boolean;
}

export interface Motherboard extends ProductBase {
  category: "motherboard";
  socket: SocketType;
  ramType: RamType;
  formFactor: FormFactor; 
}

export interface GPU extends ProductBase {
  category: "gpu";
  tdp: number;
  vram: number;
  lengthMm: number; 
}

export interface RAM extends ProductBase {
  category: "ram";
  type: RamType;
  capacity: number;
}

export interface PSU extends ProductBase {
  category: "psu";
  wattage: number;
  rating: string;
  // UI Flags (Calculated at runtime)
  isCompatible?: boolean;
  isRecommended?: boolean;
}

export interface Cabinet extends ProductBase {
  category: "cabinet";
  supportedMotherboards: FormFactor[]; 
  maxGpuLength: number; 
  // UI Flags
  isCompatible?: boolean;
  isGpuFit?: boolean;
}

export interface Cooler extends ProductBase {
  category: "cooler";
  tdpRating: number; 
  radiatorSize: number; 
  // UI Flags
  isSufficient?: boolean;
}

export interface Storage extends ProductBase {
  category: "storage";
  capacityGB: number;
  type: "Gen4 NVMe" | "Gen3 NVMe";
}

export interface OS extends ProductBase {
  category: "os";
  family: "Windows" | "Linux"; 
  series?: "Home" | "Pro";     
  licenseType?: "Trial" | "Retail" | "FPP"; 
}

// Union type
export type Product = CPU | Motherboard | GPU | RAM | PSU | Cabinet | Cooler | Storage | OS;