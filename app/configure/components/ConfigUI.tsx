import { useState, useEffect } from "react";
import Image from "next/image";
import { FaCheck, FaInfoCircle, FaChevronDown, FaChevronUp, FaSave, FaShoppingCart } from "react-icons/fa";
import { Product } from "../types";
import { generateSpecSheetPDF } from "@/utils/generatePdf";
import { createPortal } from "react-dom";
import { toast } from "sonner";

// --- NEW: CATEGORY CARD (For Grid Layout) ---
export const CategoryCard = ({ title, icon: Icon, selectedItem, onClick, warning }: any) => {
    return (
        <div onClick={onClick} className={`relative flex flex-col items-center justify-center p-6 rounded-xl border cursor-pointer transition-all duration-300 min-h-[160px] group ${selectedItem ? 'bg-brand-purple/10 border-brand-purple' : 'bg-[#151515] border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
            {warning && <div className="absolute top-3 right-3 text-brand-purple"><FaInfoCircle size={14} title={warning}/></div>}
            <div className={`text-5xl mb-4 transition-transform duration-500 group-hover:scale-110 ${selectedItem ? 'text-brand-purple' : 'text-white/20'}`}>
                <Icon />
            </div>
            <h3 className="font-orbitron font-bold text-sm tracking-wider text-white text-center">{title}</h3>
            <p className="text-[10px] text-brand-silver mt-2 text-center px-2 line-clamp-2 h-7">
                {selectedItem ? (selectedItem.configurator_name || selectedItem.name) : `Select ${title}`}
            </p>
            {selectedItem && (
                <div className="absolute top-3 left-3 text-brand-purple bg-brand-purple/20 p-1 rounded-full">
                    <FaCheck size={10} />
                </div>
            )}
        </div>
    );
};

// --- NEW: PREMIUM MODAL WITH BRAND SPLIT ---
export const PremiumSelectionModal = ({ isOpen, onClose, title, items, selectedId, onSelect, warning }: any) => {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) setSelectedBrand(null);
    }, [isOpen]);

    if (!isOpen) return null;
    
    const validItems = items.filter((item: any) => item.isCompatible !== false);
    const groupedItems = validItems.reduce((acc: any, item: any) => {
        const brand = item.brand || "Other";
        if (!acc[brand]) acc[brand] = [];
        acc[brand].push(item);
        return acc;
    }, {});

    const brands = Object.keys(groupedItems).sort();

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-[#121212] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#151515] rounded-t-2xl">
                    <div>
                        <h2 className="font-orbitron text-2xl font-bold text-white uppercase tracking-wider">
                            {selectedBrand ? `${selectedBrand} ${title}` : `Select ${title}`}
                        </h2>
                        {warning && !selectedBrand && <p className="text-sm text-brand-purple mt-1 flex items-center gap-2"><FaInfoCircle /> {warning}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedBrand && (
                            <button onClick={() => setSelectedBrand(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-xs font-bold text-white uppercase tracking-wider transition-colors border border-white/10">
                                Back to Brands
                            </button>
                        )}
                        <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center text-white/50 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {!selectedBrand ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {brands.map(brand => (
                                <div key={brand} onClick={() => setSelectedBrand(brand)} className="bg-[#1A1A1A] border border-white/10 hover:border-brand-purple cursor-pointer rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all hover:bg-brand-purple/5 group shadow-lg">
                                    <h3 className="font-orbitron text-3xl font-bold text-white tracking-widest uppercase group-hover:text-brand-purple transition-colors">{brand}</h3>
                                    <span className="text-xs text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full">{groupedItems[brand].length} Options Available</span>
                                </div>
                            ))}
                            {brands.length === 0 && (
                                <div className="col-span-full text-center text-brand-silver py-12 bg-white/5 rounded-xl border border-dashed border-white/20">No compatible options found based on your current build.</div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedItems[selectedBrand].map((item: any) => {
                                const isDisabled = (item.category !== 'os' && !item.inStock);
                                return (
                                    <div key={item.id} onClick={() => { if(!isDisabled) { onSelect(item); onClose(); } }} className={`relative p-5 rounded-lg border transition-all flex flex-col justify-between min-h-[130px] cursor-pointer ${selectedId === item.id ? "bg-brand-purple/10 border-brand-purple" : isDisabled ? "bg-black/20 border-white/5 opacity-50 grayscale cursor-not-allowed" : "bg-[#1A1A1A] border-white/10 hover:border-white/30"}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-bold text-brand-silver uppercase tracking-wider">{item.category}</span>
                                            {selectedId === item.id && <div className="text-brand-purple"><FaCheck /></div>}
                                        </div>
                                        <h4 className="font-bold text-sm text-white mb-1 leading-snug">{item.configurator_name || item.name}</h4>
                                        <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-auto">
                                            <span className="font-bold text-brand-purple font-orbitron text-sm">{item.price === 0 ? "FREE" : `₹${item.price.toLocaleString("en-IN")}`}</span>
                                            {isDisabled && <span className="text-[9px] font-bold text-red-500 uppercase px-2 py-1 bg-red-500/10 rounded">Out of Stock</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- SUMMARY PANEL (Unchanged) ---
export const SummaryPanel = ({ selections, totals, user, onSave, onAddToCart, saving }: any) => {
    const { totalPrice, estimatedTDP, psuWattage, isPowerSufficient } = totals;

    const downloadPDF = () => {
        if (!Object.values(selections).some(i => i !== null)) return toast.error("Selection Empty");
        generateSpecSheetPDF({ id: "custom", name: "Custom Configuration", total_price: totalPrice, specs: selections });
    };

    return (
        <div className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="relative w-full h-[250px] mb-6 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden border border-white/5">
                {selections.cabinet?.image ? <Image src={selections.cabinet.image} alt="Cabinet" fill className="object-contain p-4" /> : <div className="text-white/20 font-orbitron text-xl">Select Cabinet</div>}
            </div>

            <div className="bg-black/50 rounded-xl p-4 mb-6 border border-white/5">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] uppercase tracking-wider text-brand-silver font-bold">TDP Estimate</span>
                    <span className={`font-bold ${!isPowerSufficient ? "text-red-500" : "text-brand-purple"}`}>{estimatedTDP}W <span className="text-white/40">/ {psuWattage}W</span></span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${!isPowerSufficient ? "bg-red-500" : "bg-brand-purple"}`} style={{ width: `${Math.min((estimatedTDP / (psuWattage || 1)) * 100, 100)}%` }}></div>
                </div>
                {!isPowerSufficient && selections.psu && <p className="text-[10px] text-red-400 mt-2 flex items-center gap-2 animate-pulse"><FaInfoCircle /> Upgrade PSU Required</p>}
            </div>

            <div className="space-y-3 mb-6 text-xs max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {Object.entries(selections).filter(([k]) => k !== 'osSecondary').map(([key, val]: any) => (
                    <div key={key} className="flex justify-between items-start">
                        <span className="text-brand-silver w-1/3 capitalize">{key}</span>
                        <span className={`w-2/3 text-right truncate ${val ? "text-white" : "text-white/20 italic"}`}>
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
                    <button onClick={onSave} disabled={saving} className="col-span-1 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                        <FaSave className="text-sm" /> {user ? (saving ? "Saving..." : "Save Config") : "Login to Save"}
                    </button>
                    <button onClick={onAddToCart} disabled={!selections.cpu || !selections.motherboard} className="col-span-1 py-4 bg-brand-purple rounded-xl text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-brand-purple/80 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50">
                        <FaShoppingCart className="text-sm" /> Add to Cart
                    </button>
                    <button onClick={downloadPDF} className="col-span-2 py-3 bg-[#121212] border border-white/20 rounded-xl text-brand-silver hover:text-white font-bold font-orbitron uppercase tracking-widest text-[10px] transition-all">Download Specification PDF</button>
                </div>
            </div>
        </div>
    );
};

// --- MOBILE BAR (Unchanged) ---
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