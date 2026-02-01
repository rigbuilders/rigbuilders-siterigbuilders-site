import { useState } from "react";
import Image from "next/image";
import { FaCheck, FaInfoCircle, FaChevronDown, FaChevronUp, FaWindows, FaLinux, FaSave, FaShoppingCart } from "react-icons/fa";
import { Product, SelectionState } from "../types";
import { generateSpecSheetPDF } from "@/utils/generatePdf";
import { createPortal } from "react-dom";
import { toast } from "sonner";

// --- SELECTION GRID ---
export const SelectionGrid = ({ items, selectedId, onSelect, warning }: { items: Product[], selectedId?: string, onSelect: (p: Product) => void, warning?: string }) => {
    const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>({});

    const validItems = items.filter((item) => item.isCompatible !== false);
    
    if (validItems.length === 0) {
        return <div className="text-center text-brand-silver text-sm py-8 bg-white/5 rounded border border-dashed border-white/10 italic">No compatible items found.</div>;
    }

    const groupedItems = validItems.reduce((acc: any, item: any) => {
        const brand = item.brand || "Other";
        if (!acc[brand]) acc[brand] = [];
        acc[brand].push(item);
        return acc;
    }, {});

    const toggleBrand = (brand: string) => setExpandedBrands(p => ({ ...p, [brand]: !p[brand] }));

    return (
        <div className="space-y-4">
            {warning && <div className="p-3 bg-brand-purple/10 border border-brand-purple/20 rounded text-xs text-brand-purple flex items-center gap-2 mb-4"><FaInfoCircle /> {warning}</div>}
            
            {Object.keys(groupedItems).sort().map(brand => {
                const isOpen = expandedBrands[brand];
                return (
                    <div key={brand} className="bg-[#151515] border border-white/5 rounded-lg overflow-hidden">
                        <button onClick={() => toggleBrand(brand)} className={`w-full px-4 py-3 flex justify-between items-center transition-colors ${isOpen ? "bg-white/10" : "bg-white/5 hover:bg-white/10"}`}>
                            <div className="flex items-center gap-3">
                                <span className="font-orbitron text-sm font-bold uppercase tracking-wider text-white">{brand}</span>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-brand-silver">{groupedItems[brand].length}</span>
                            </div>
                            <div className={`text-brand-silver transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}><FaChevronDown size={12} /></div>
                        </button>
                        <div className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/5">
                                {groupedItems[brand].map((item: Product) => {
                                    const isDisabled = (item.category !== 'os' && !item.inStock);
                                    return (
                                        <div key={item.id} onClick={() => !isDisabled && onSelect(item)} className={`relative p-4 rounded-lg border transition-all flex flex-col justify-between min-h-[100px] cursor-pointer ${selectedId === item.id ? "bg-brand-purple/10 border-brand-purple" : isDisabled ? "bg-black/20 border-white/5 opacity-50 grayscale cursor-not-allowed" : "bg-[#121212] border-white/10 hover:border-white/30"}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{item.category}</span>
                                                {selectedId === item.id && <div className="text-brand-purple"><FaCheck /></div>}
                                            </div>
                                            <h4 className="font-bold text-sm text-white mb-1 leading-tight">
    {item.configurator_name || item.name}
</h4>
                                            <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-3">
                                                <span className="font-bold text-white font-orbitron text-sm">{item.price === 0 ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}</span>
                                                {isDisabled && <span className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-500/10 rounded">Out of Stock</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- SUMMARY PANEL ---
export const SummaryPanel = ({ selections, totals, user, onSave, onAddToCart, saving }: any) => {
    const { totalPrice, estimatedTDP, psuWattage, isPowerSufficient } = totals;

    const downloadPDF = () => {
        if (!Object.values(selections).some(i => i !== null)) return toast.error("Selection Empty");
        generateSpecSheetPDF({ id: "custom", name: "Custom Configuration", total_price: totalPrice, specs: selections });
    };

    return (
        <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
            <div className="relative w-full h-[250px] mb-6 flex items-center justify-center bg-black/20 rounded-lg overflow-hidden border border-white/5">
                {selections.cabinet?.image ? <Image src={selections.cabinet.image} alt="Cabinet" fill className="object-contain p-4" /> : <div className="text-white/20 font-orbitron text-xl">Select Cabinet</div>}
            </div>

            <div className="bg-black/40 rounded-lg p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-brand-silver">TDP Estimate</span>
                    <span className={`font-bold ${!isPowerSufficient ? "text-red-500" : "text-brand-purple"}`}>{estimatedTDP}W <span className="text-white/40">/ {psuWattage}W</span></span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${!isPowerSufficient ? "bg-red-500" : "bg-brand-purple"}`} style={{ width: `${Math.min((estimatedTDP / (psuWattage || 1)) * 100, 100)}%` }}></div>
                </div>
                {!isPowerSufficient && selections.psu && <p className="text-[10px] text-red-400 mt-2 flex items-center gap-2 animate-pulse"><FaInfoCircle /> Upgrade PSU Required</p>}
            </div>

            <div className="space-y-3 mb-6 text-xs max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
    {Object.entries(selections).filter(([k]) => k !== 'osSecondary').map(([key, val]: any) => (
        <div key={key} className="flex justify-between items-start">
            <span className="text-brand-silver w-1/3 capitalize">{key}</span>
            <span className={`w-2/3 text-right truncate ${val ? "text-white" : "text-white/20 italic"}`}>
                {/* USE SHORT NAME HERE */}
                {val ? (val.configurator_name || val.name) : "-"}
            </span>
        </div>
    ))}
</div>

            <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-brand-silver text-sm">Total Estimate</span>
                    <span className="text-3xl font-bold font-orbitron text-white">₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onSave} disabled={saving} className="col-span-1 py-4 bg-white/5 border border-white/10 text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                        <FaSave className="text-sm" /> {user ? (saving ? "Saving..." : "Save Config") : "Login to Save"}
                    </button>
                    <button onClick={onAddToCart} disabled={!selections.cpu || !selections.motherboard} className="col-span-1 py-4 bg-brand-purple text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-brand-purple/80 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                        <FaShoppingCart className="text-sm" /> Add to Cart
                    </button>
                    <button onClick={downloadPDF} className="col-span-2 py-3 bg-[#121212] border border-white/20 text-brand-silver hover:text-white font-bold font-orbitron uppercase tracking-widest text-[10px] transition-all">Download Specification PDF</button>
                </div>
            </div>
        </div>
    );
};

// --- MOBILE BAR ---
export const MobileBar = ({ show, totalPrice, totals, selections, onAddToCart }: any) => {
    const [showList, setShowList] = useState(false);
    return createPortal(
        <div className={`fixed bottom-0 left-0 w-full bg-[#121212] border-t border-white/20 p-4 z-[9999] md:hidden transition-transform duration-300 ease-out shadow-[0_-5px_20px_rgba(0,0,0,0.8)] ${show ? "translate-y-0" : "translate-y-[120%]"}`}>
            {showList && (
                <div className="absolute bottom-full left-0 w-full bg-[#1A1A1A] border-t border-white/10 p-4 rounded-t-xl shadow-2xl max-h-[50vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                        <h4 className="font-orbitron text-sm text-brand-purple uppercase">Selected Components</h4>
                        <button onClick={() => setShowList(false)} className="text-xs text-brand-silver hover:text-white bg-white/10 px-2 py-1 rounded">Close</button>
                    </div>
                    <div className="space-y-2 text-xs">
    {Object.entries(selections).map(([key, val]: any) => val ? (
        <div key={key} className="flex justify-between border-b border-white/5 pb-1">
            <span className="text-brand-silver capitalize">{key}</span>
            <span className="text-white font-bold truncate max-w-[150px]">
                {/* USE SHORT NAME HERE */}
                {val.configurator_name || val.name}
            </span>
        </div>
    ) : null)}
</div>
                </div>
            )}
            <div className="flex justify-between items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-lg font-bold font-orbitron text-white leading-none">₹{totalPrice.toLocaleString("en-IN")}</span>
                    <div className="flex items-center gap-2 text-[10px] text-brand-silver uppercase tracking-wider mt-1">
                        <span className={`${!totals.isPowerSufficient ? "text-red-500 font-bold" : ""}`}>{totals.estimatedTDP}W Power</span>
                        <span className="w-[1px] h-3 bg-white/20"></span>
                        <button onClick={() => setShowList(!showList)} className="text-brand-purple underline decoration-dotted font-bold">{showList ? "Hide List" : "View List"}</button>
                    </div>
                </div>
                <button onClick={onAddToCart} disabled={!selections.cpu || !selections.motherboard} className="bg-brand-purple px-5 py-3 rounded text-xs font-bold font-orbitron uppercase tracking-widest text-white hover:bg-brand-purple/90 shadow-[0_0_15px_rgba(124,58,237,0.3)]">Add to Cart</button>
            </div>
        </div>, document.body
    );
};

export const CollapsibleSection = ({ title, selected, children, icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full px-6 py-5 flex justify-between items-center transition-all ${isOpen ? "bg-white/5" : "bg-transparent hover:bg-white/5"}`}>
                <div className="flex items-center gap-4 text-left">
                    {icon && <span className="text-brand-purple text-lg">{icon}</span>}
                    <div>
                        <h3 className="font-orbitron font-bold text-white uppercase text-sm md:text-base tracking-wider">{title}</h3>
                        {selected && !isOpen && <p className="text-xs text-brand-purple mt-1 truncate max-w-[200px] font-saira">{selected}</p>}
                    </div>
                </div>
                <div className="text-brand-silver">{isOpen ? <FaChevronUp /> : <FaChevronDown />}</div>
            </button>
            {isOpen && <div className="p-6 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">{children}</div>}
        </div>
    );
};