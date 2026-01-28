// app/admin/products/constants.ts

export const GROUPS = [
    { id: "components", name: "PC Components" },
    { id: "desktops", name: "Pre-Built Desktops" },
    { id: "accessories", name: "Accessories" }
];

export const BASE_CATEGORY_MAP: Record<string, string> = {
    cpu: "components", gpu: "components", motherboard: "components", ram: "components",
    storage: "components", psu: "components", cabinet: "components", cooler: "components",
    os: "components",
    prebuilt: "desktops",
    monitor: "accessories", keyboard: "accessories", mouse: "accessories",
    combo: "accessories", mousepad: "accessories", usb: "accessories"
};

export const BASE_CATEGORIES = [
  { id: "prebuilt", name: "Pre-built Desktop" },
  { id: "cpu", name: "Processor" },         
  { id: "gpu", name: "Graphics Card" },
  { id: "motherboard", name: "Motherboard" },   
  { id: "ram", name: "Memory (RAM)" },
  { id: "storage", name: "Storage" },
  { id: "psu", name: "Power Supply" },
  { id: "cabinet", name: "Cabinet" },
  { id: "cooler", name: "Cooling" },
  { id: "os", name: "Operating System" },
  { id: "monitor", name: "Display / Monitor" },
  { id: "keyboard", name: "Keyboard" },
  { id: "mouse", name: "Mouse" },
  { id: "combo", name: "Keyboard & Mouse Combo" },
  { id: "mousepad", name: "Mouse Pad" },
  { id: "usb", name: "USB Drive" }
];

// --- COMPATIBILITY LISTS ---
export const FORM_FACTORS = ["E-ATX", "ATX", "mATX", "ITX"];
export const RADIATOR_SIZES = ["Air Cooler", "120mm", "240mm", "280mm", "360mm", "420mm"];

export const SERIES_OPTS = ["ascend", "workpro", "creator", "signature"];
export const TIER_OPTS = ["5", "7", "9"];
export const BASE_SOCKETS = ["AM5", "AM4", "LGA1700", "LGA1851", "LGA1200", "TR4"];
export const BASE_MEMORY_TYPES = ["DDR5", "DDR4", "GDDR6", "GDDR6X", "GDDR7"];
export const STORAGE_TYPES = ["NVMe M.2 Gen4", "NVMe M.2 Gen3", "SATA SSD", "HDD (7200RPM)"];