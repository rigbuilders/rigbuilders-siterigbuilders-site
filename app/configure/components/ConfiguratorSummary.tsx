import Image from "next/image";
import { FaSave, FaShoppingCart, FaInfoCircle } from "react-icons/fa";
import { toast } from "sonner";
import { generateSpecSheetPDF } from "@/utils/generatePdf";
import { partLabel } from "../logic";

export const ConfiguratorSummary = ({ selections, totals, user, onSave, onAddToCart, saving }: any) => {
    const { totalPrice, estimatedTDP, psuWattage, isPowerSufficient } = totals;

    const downloadPDF = () => {
        if (!Object.values(selections).some(i => i !== null)) return toast.error("Selection Empty");
        generateSpecSheetPDF({ id: "custom", name: "Custom Configuration", total_price: totalPrice, specs: selections });
    };

    // Define the strict order for the live receipt list
    const orderList = [
        "cpu", "motherboard", "gpu", "ram", "storage", "cooler", 
        "psu", "cabinet", "monitor", "keyboard", "mouse"
    ];

    return (
        <div className="bg-[#151515] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col lg:max-h-[calc(100vh-8rem)]">
            
            {/* CABINET VIEWER */}
            <div className="relative w-full h-[250px] shrink-0 mb-6 flex items-center justify-center bg-[#111111] rounded-xl overflow-hidden border border-white/5">
                {selections.cabinet?.image ? (
                    <Image src={selections.cabinet.image} alt="Cabinet" fill className="object-contain p-4" />
                ) : (
                    <div className="text-white/20 font-orbitron text-lg tracking-widest uppercase">Select Cabinet</div>
                )}
            </div>

            {/* TDP ESTIMATOR (Yellow Theme) */}
            <div className="bg-[#111111] rounded-xl p-4 mb-6 border border-white/5 shrink-0">
                <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">TDP Estimate</span>
                    <span className={`font-orbitron font-bold text-xs ${!isPowerSufficient ? "text-red-500" : "text-[#FFE600]"}`}>
                        {estimatedTDP}W <span className="text-white/30">/ {psuWattage}W</span>
                    </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${!isPowerSufficient ? "bg-red-500" : "bg-[#FFE600]"}`} 
                        style={{ width: `${Math.min((estimatedTDP / (psuWattage || 1)) * 100, 100)}%` }}
                    ></div>
                </div>
                {!isPowerSufficient && selections.psu && (
                    <p className="text-[10px] text-red-400 mt-2 flex items-center gap-2 animate-pulse"><FaInfoCircle /> Upgrade PSU Required</p>
                )}
            </div>

            {/* LIVE RECEIPT LIST (Scrollable) */}
            <div className="lg:flex-1 lg:min-h-0 overflow-y-auto custom-scrollbar pr-2 sm:pr-4 space-y-4 mb-6 max-h-[45vh] lg:max-h-none">
                {orderList.map((key) => {
                    const val = selections[key];
                    return (
                        <div key={key} className="flex justify-between items-start gap-4">
                            <span className="text-xs text-white/40 shrink-0 w-24">{partLabel(key)}</span>
                            <span className={`text-xs text-right truncate ${val ? "text-white font-bold" : "text-white/10"}`}>
                                {val ? (val.configurator_name || val.name) : "-"}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="pt-6 border-t border-white/5 shrink-0 space-y-4">
                <div className="flex justify-between items-end">
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Estimate</span>
                    <span className="text-2xl font-bold font-orbitron text-white leading-none">
                        ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onSave} disabled={saving} className="col-span-1 py-3 bg-[#111111] border border-white/10 rounded-lg text-white font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                        <FaSave /> {user ? (saving ? "..." : "Save") : "Login to Save"}
                    </button>
                    <button onClick={onAddToCart} disabled={!selections.cpu || !selections.motherboard} className="col-span-1 py-3 bg-[#FFE600] text-black rounded-lg font-bold font-orbitron uppercase tracking-widest text-[10px] hover:bg-[#FFE600]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-white/10 disabled:text-white/50">
                        <FaShoppingCart /> Add to Cart
                    </button>
                    <button onClick={downloadPDF} className="col-span-2 py-3 bg-transparent border border-white/10 rounded-lg text-white/40 hover:text-white font-bold font-orbitron uppercase tracking-widest text-[10px] transition-all">
                        Download Specification PDF
                    </button>
                </div>
            </div>
        </div>
    );
};