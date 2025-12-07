// app/data/products.ts
import { CPU, Motherboard, GPU, RAM, PSU, Cabinet, Cooler, Storage, OS, Product } from "./types";

// --- 1. CPUs ---
export const cpus: CPU[] = [
  { id: "c1", category: "cpu", brand: "AMD", name: "Ryzen 5 5600X (AM4)", price: 13500, socket: "AM4", supportedRam: "DDR4", tdp: 65, integratedGraphics: false, inStock: true },
  { id: "c2", category: "cpu", brand: "AMD", name: "Ryzen 7 7800X3D (AM5)", price: 36000, socket: "AM5", supportedRam: "DDR5", tdp: 120, integratedGraphics: true, inStock: true },
  { id: "c3", category: "cpu", brand: "Intel", name: "Core i5-13600K", price: 29000, socket: "LGA1700", supportedRam: "DDR5", tdp: 125, integratedGraphics: true, inStock: true },
  { id: "c4", category: "cpu", brand: "Intel", name: "Core i9-14900K", price: 55000, socket: "LGA1700", supportedRam: "DDR5", tdp: 253, integratedGraphics: true, inStock: false }, // Out of stock example
];

// --- 2. MOTHERBOARDS ---
export const motherboards: Motherboard[] = [
  { id: "m1", category: "motherboard", brand: "MSI", name: "B550M Pro-VDH (WiFi)", price: 10500, socket: "AM4", ramType: "DDR4", formFactor: "mATX", inStock: true },
  { id: "m2", category: "motherboard", brand: "Gigabyte", name: "B650 Gaming X", price: 18000, socket: "AM5", ramType: "DDR5", formFactor: "ATX", inStock: true },
  { id: "m3", category: "motherboard", brand: "ASUS", name: "ROG Strix Z790-F", price: 34000, socket: "LGA1700", ramType: "DDR5", formFactor: "ATX", inStock: true },
];

// --- 3. GPUs ---
export const gpus: GPU[] = [
  { id: "g1", category: "gpu", brand: "NVIDIA", name: "RTX 4060 Ti", price: 38000, tdp: 160, vram: 8, lengthMm: 250, inStock: true },
  { id: "g2", category: "gpu", brand: "NVIDIA", name: "RTX 4070 Super", price: 62000, tdp: 220, vram: 12, lengthMm: 280, inStock: true },
  { id: "g3", category: "gpu", brand: "NVIDIA", name: "RTX 4090", price: 185000, tdp: 450, vram: 24, lengthMm: 340, inStock: true },
];

// --- 4. RAM ---
export const rams: RAM[] = [
  { id: "r1", category: "ram", brand: "Corsair", name: "16GB Vengeance 3200MHz", price: 4200, type: "DDR4", capacity: 16, inStock: true },
  { id: "r2", category: "ram", brand: "XPG", name: "32GB Lancer 6000MHz", price: 10500, type: "DDR5", capacity: 32, inStock: true },
];

// --- 5. PSU ---
export const psus: PSU[] = [
  { id: "p1", category: "psu", brand: "Deepcool", name: "PM650D (650W)", price: 4800, wattage: 650, rating: "Gold", inStock: true },
  { id: "p2", category: "psu", brand: "Corsair", name: "RM850e (850W)", price: 10500, wattage: 850, rating: "Gold", inStock: true },
  { id: "p3", category: "psu", brand: "ASUS", name: "Thor 1000W Platinum", price: 24000, wattage: 1000, rating: "Platinum", inStock: true },
];

// --- 6. CABINETS ---
export const cabinets: Cabinet[] = [
  { id: "cab1", category: "cabinet", brand: "Ant Esports", name: "ICE-100 (Micro-ATX)", price: 3500, supportedMotherboards: ["mATX"], maxGpuLength: 300, inStock: true },
  { id: "cab2", category: "cabinet", brand: "Lian Li", name: "Lancool 216 (ATX)", price: 8500, supportedMotherboards: ["ATX", "mATX"], maxGpuLength: 390, inStock: true },
];

// --- 7. COOLERS / AIOs ---
export const coolers: Cooler[] = [
  { id: "aio1", category: "cooler", brand: "Deepcool", name: "AG400 (Air)", price: 1800, tdpRating: 200, radiatorSize: 0, inStock: true },
  { id: "aio2", category: "cooler", brand: "Deepcool", name: "LE520 (240mm AIO)", price: 5500, tdpRating: 250, radiatorSize: 240, inStock: true },
  { id: "aio3", category: "cooler", brand: "NZXT", name: "Kraken 360 (360mm AIO)", price: 16000, tdpRating: 350, radiatorSize: 360, inStock: true },
];

// --- 8. STORAGE ---
export const storages: Storage[] = [
  { id: "s1", category: "storage", brand: "WD", name: "Blue SN580 500GB", price: 3800, capacityGB: 500, type: "Gen4 NVMe", inStock: true },
  { id: "s2", category: "storage", brand: "Samsung", name: "980 Pro 1TB", price: 8500, capacityGB: 1000, type: "Gen4 NVMe", inStock: true },
];

// --- 9. OPERATING SYSTEMS ---
export const osList: OS[] = [
  { id: "win-h-1", category: "os", brand: "Microsoft", family: "Windows", series: "Home", licenseType: "Trial", name: "Windows 11 Home (Trial)", price: 0, inStock: true },
  { id: "win-h-2", category: "os", brand: "Microsoft", family: "Windows", series: "Home", licenseType: "Retail", name: "Windows 11 Home (Retail Key)", price: 9500, inStock: true },
  { id: "win-h-3", category: "os", brand: "Microsoft", family: "Windows", series: "Home", licenseType: "FPP", name: "Windows 11 Home (FPP USB)", price: 11500, inStock: true },
  { id: "win-p-1", category: "os", brand: "Microsoft", family: "Windows", series: "Pro", licenseType: "Trial", name: "Windows 11 Pro (Trial)", price: 0, inStock: true },
  { id: "win-p-2", category: "os", brand: "Microsoft", family: "Windows", series: "Pro", licenseType: "Retail", name: "Windows 11 Pro (Retail Key)", price: 12500, inStock: true },
  { id: "win-p-3", category: "os", brand: "Microsoft", family: "Windows", series: "Pro", licenseType: "FPP", name: "Windows 11 Pro (FPP USB)", price: 16500, inStock: true },
  { id: "lin-1", category: "os", brand: "Open Source", family: "Linux", name: "Ubuntu 24.04 LTS", price: 0, inStock: true },
  { id: "lin-2", category: "os", brand: "Open Source", family: "Linux", name: "Linux Mint Cinnamon", price: 0, inStock: true },
  { id: "lin-3", category: "os", brand: "Open Source", family: "Linux", name: "Fedora Workstation", price: 0, inStock: true },
  { id: "lin-4", category: "os", brand: "Open Source", family: "Linux", name: "Debian Stable", price: 0, inStock: true },
  { id: "lin-5", category: "os", brand: "Open Source", family: "Linux", name: "Manjaro Linux", price: 0, inStock: true },
  { id: "lin-6", category: "os", brand: "Open Source", family: "Linux", name: "Arch Linux", price: 0, inStock: true },
  { id: "lin-7", category: "os", brand: "System76", family: "Linux", name: "Pop!_OS", price: 0, inStock: true },
  { id: "lin-8", category: "os", brand: "OffSec", family: "Linux", name: "Kali Linux", price: 0, inStock: true },
  { id: "lin-9", category: "os", brand: "Open Source", family: "Linux", name: "openSUSE Tumbleweed", price: 0, inStock: true },
  { id: "lin-10", category: "os", brand: "Elementary", family: "Linux", name: "Elementary OS", price: 0, inStock: true },
];

// --- MASTER LIST ---
export const allProducts: Product[] = [
  ...cpus, ...motherboards, ...gpus, ...rams, ...psus, ...cabinets, ...coolers, ...storages, ...osList
];