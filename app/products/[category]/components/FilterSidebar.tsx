"use client";

import { useState } from "react";

// Reusable UI for a single filter section
const FilterGroup = ({ title, options, selectedKey, activeFilters, toggleFilter }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!options || options.length === 0) return null;

  // Read from the local state passed down from parent
  const selected = activeFilters[selectedKey] || [];

  return (
    <div className="mb-8 border-b border-white/10 pb-6">
      <div 
        className="flex justify-between items-center cursor-pointer mb-4 hover:text-brand-purple transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-[0.2em]">{title}</h3>
        <span className="text-brand-purple font-light text-xl">{isOpen ? "−" : "+"}</span>
      </div>
      
      {isOpen && (
        <div className="space-y-3">
          {options.map((opt: string) => {
            const isChecked = selected.includes(opt);
            return (
              <label key={opt} className="flex items-center gap-3 cursor-pointer group hover:pl-1 transition-all">
                <div className={`w-3 h-3 border border-white/30 flex items-center justify-center transition-all ${isChecked ? "bg-brand-purple border-brand-purple" : "group-hover:border-white"}`}>
                  {isChecked && <div className="w-1.5 h-1.5 bg-white" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden"
                  checked={isChecked}
                  onChange={() => toggleFilter(selectedKey, opt)}
                />
                <span className={`text-xs font-saira uppercase tracking-wider ${isChecked ? "text-white" : "text-brand-silver group-hover:text-white"}`}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function FilterSidebar({ products, activeFilters, toggleFilter }: any) {
  
  // Extract available filter options from current products
  const availableBrands = Array.from(new Set(products.map((p: any) => p.brand).filter(Boolean)));
  const availableSockets = Array.from(new Set(products.map((p: any) => p.specs?.socket).filter(Boolean)));
  const availableMemory = Array.from(new Set(products.map((p: any) => p.specs?.memory_type).filter(Boolean)));
  const availableCapacities = Array.from(new Set(products.map((p: any) => p.specs?.capacity || p.specs?.vram).filter(Boolean)));
  const availableFormFactors = Array.from(new Set(products.map((p: any) => p.specs?.form_factor).filter(Boolean)));
  const availableRadiators = Array.from(new Set(products.map((p: any) => p.specs?.radiator_size).filter(Boolean)));

  return (
    <>
      <div className="mb-10 pt-4 hidden lg:block">
          <span className="text-[10px] text-brand-purple font-bold tracking-[0.2em] uppercase block mb-2">Refine Results</span>
          <h2 className="font-orbitron text-2xl text-white">SPECS</h2>
      </div>

      <FilterGroup title="Brands" selectedKey="brand" options={availableBrands} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Budget" selectedKey="budget" options={["Under ₹10K", "₹10K - ₹30K", "₹30K - ₹80K", "Above ₹80K"]} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Socket Type" selectedKey="socket" options={availableSockets} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Memory Type" selectedKey="memory" options={availableMemory} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Capacity / VRAM" selectedKey="capacity" options={availableCapacities} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Form Factor" selectedKey="form_factor" options={availableFormFactors} activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <FilterGroup title="Radiator Size" selectedKey="radiator" options={availableRadiators} activeFilters={activeFilters} toggleFilter={toggleFilter} />
    </>
  );
}