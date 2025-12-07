"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import Link from "next/link";
import { FaBoxOpen, FaSave, FaTicketAlt, FaDownload, FaMicrochip } from "react-icons/fa"; 
// Note: If you haven't installed react-icons yet, run: npm install react-icons

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("orders");

  return (
    <main className="min-h-screen bg-[#121212] text-white font-saira">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#1A1A1A] p-6 rounded-xl border border-white/5 mb-6 text-center">
            <div className="w-20 h-20 'bg-gradient-to-br' from-[#4E2C8B] to-[#265DAB] rounded-full mx-auto mb-4 flex items-center justify-center font-orbitron font-bold text-2xl">
              JD
            </div>
            <h2 className="font-orbitron font-bold text-lg">John Doe</h2>
            <p className="text-xs text-[#A0A0A0]">Member since 2025</p>
          </div>

          <nav className="space-y-2">
            <SidebarBtn 
              icon={<FaBoxOpen />} 
              label="My Orders" 
              isActive={activeTab === "orders"} 
              onClick={() => setActiveTab("orders")} 
            />
            <SidebarBtn 
              icon={<FaSave />} 
              label="Saved Configurations" 
              isActive={activeTab === "saved"} 
              onClick={() => setActiveTab("saved")} 
            />
            <SidebarBtn 
              icon={<FaTicketAlt />} 
              label="Support & Warranty" 
              isActive={activeTab === "support"} 
              onClick={() => setActiveTab("support")} 
            />
            <button className="w-full text-left px-6 py-4 rounded-lg text-[#A0A0A0] hover:bg-white/5 hover:text-white transition-colors flex items-center gap-3">
               <span>Sign Out</span>
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 bg-[#1A1A1A] rounded-xl border border-white/5 p-8 min-h-[600px]">
          
          {/* TAB: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <h2 className="font-orbitron text-2xl font-bold mb-6">Active Commissions</h2>
              
              {/* Order Card 1 (Active) */}
              <div className="border border-[#4E2C8B]/50 bg-[#121212] rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#4E2C8B] text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider">
                  Phase: Stress Testing
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-center">
                   <div className="w-24 h-24 bg-[#1A1A1A] rounded flex items-center justify-center border border-white/10">
                      <FaMicrochip size={32} className="text-[#4E2C8B]" />
                   </div>
                   <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">Signature Edition #RB-8821</h3>
                      <p className="text-sm text-[#A0A0A0] mb-2">Order Date: Dec 1, 2025</p>
                      <div className="flex gap-4 text-xs">
                        <span className="bg-white/5 px-2 py-1 rounded">RTX 4090</span>
                        <span className="bg-white/5 px-2 py-1 rounded">Ryzen 9 7950X3D</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="font-bold text-xl">₹3,45,000</p>
                      <button className="mt-2 text-xs text-[#4E2C8B] hover:text-white underline">View Build Log</button>
                   </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] uppercase text-[#A0A0A0] mb-2 tracking-wider">
                    <span>Confirmed</span>
                    <span>Assembly</span>
                    <span className="text-white font-bold">Stress Test</span>
                    <span>Shipping</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full 'bg-gradient-to-r' from-[#4E2C8B] to-[#265DAB]"></div>
                  </div>
                </div>
              </div>

              {/* Order Card 2 (Completed) */}
              <div className="border border-white/5 bg-[#121212] rounded-lg p-6 opacity-75">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                   <div className="w-24 h-24 bg-[#1A1A1A] rounded flex items-center justify-center border border-white/10">
                      <FaBoxOpen size={32} className="text-[#A0A0A0]" />
                   </div>
                   <div className="flex-1">
                      <h3 className="font-bold text-lg text-white">Creator Studio Config</h3>
                      <p className="text-sm text-[#A0A0A0] mb-2">Delivered: Aug 14, 2025</p>
                   </div>
                   <div className="text-right space-y-2">
                      <button className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-3 py-2 rounded transition-colors">
                        <FaDownload /> Invoice
                      </button>
                      <button className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 px-3 py-2 rounded transition-colors">
                        <FaTicketAlt /> Warranty
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SAVED BUILDS */}
          {activeTab === "saved" && (
            <div>
              <h2 className="font-orbitron text-2xl font-bold mb-6">Saved Configurations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="border border-white/10 bg-[#121212] p-6 rounded-lg hover:border-[#4E2C8B] transition-colors group">
                    <h3 className="font-bold text-white group-hover:text-[#4E2C8B] transition-colors">Dream Gaming Rig</h3>
                    <p className="text-sm text-[#A0A0A0] mb-4">Saved on Dec 5, 2025</p>
                    <p className="font-bold text-lg mb-4">₹1,85,000</p>
                    <Link href="/configure">
                      <button className="w-full py-2 bg-[#4E2C8B] text-white text-xs font-bold rounded uppercase tracking-wider">Resume Build</button>
                    </Link>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: SUPPORT */}
          {activeTab === "support" && (
            <div>
              <h2 className="font-orbitron text-2xl font-bold mb-6">Support & Warranty</h2>
              <div className="bg-[#4E2C8B]/10 border border-[#4E2C8B] p-6 rounded-lg mb-8">
                 <h3 className="font-bold text-white mb-2">Premium Support Active</h3>
                 <p className="text-sm text-[#A0A0A0]">Your dedicated support line is available 10 AM - 7 PM.</p>
                 <p className="text-[#4E2C8B] font-bold mt-2">+91 99999 XXXXX</p>
              </div>

              <h3 className="font-bold text-white mb-4">Open Tickets</h3>
              <div className="text-center py-10 border border-dashed border-white/10 rounded-lg">
                 <p className="text-[#A0A0A0]">No open support tickets.</p>
                 <button className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-sm rounded transition-colors">
                    Create New Ticket
                 </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

// Helper Component for Sidebar Buttons
function SidebarBtn({ icon, label, isActive, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full text-left px-6 py-4 rounded-lg flex items-center gap-3 transition-all
        ${isActive ? "bg-[#4E2C8B] text-white font-bold shadow-[0_0_15px_rgba(78,44,139,0.3)]" : "text-[#A0A0A0] hover:bg-white/5 hover:text-white"}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}