import { FaMicrochip, FaServer, FaMemory, FaGamepad, FaHdd, FaFan, FaPlug, FaBox, FaWindows, FaDesktop, FaKeyboard, FaMouse } from "react-icons/fa";
import { CategoryCard } from "./ConfigUI";

export const ConfiguratorGrid = ({ selections, setActiveModal }: any) => {
    return (
        <div className="space-y-10 sm:space-y-16">
            {/* SECTION 1: PC COMPONENTS */}
            <div>
                <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-white uppercase tracking-widest mb-6">PC Components</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CategoryCard title="Processor" icon={FaMicrochip} selectedItem={selections.cpu} onClick={() => setActiveModal('cpu')} />
                    <CategoryCard title="Motherboard" icon={FaServer} selectedItem={selections.motherboard} onClick={() => setActiveModal('motherboard')} warning={!selections.cpu ? "Requires CPU" : undefined} />
                    <CategoryCard title="Memory (RAM)" icon={FaMemory} selectedItem={selections.ram} onClick={() => setActiveModal('ram')} warning={!selections.motherboard ? "Requires Mobo" : undefined} />
                    <CategoryCard title="Graphics Card" icon={FaGamepad} selectedItem={selections.gpu} onClick={() => setActiveModal('gpu')} />
                    <CategoryCard title="Storage" icon={FaHdd} selectedItem={selections.storage} onClick={() => setActiveModal('storage')} />
                    <CategoryCard title="Cooling" icon={FaFan} selectedItem={selections.cooler} onClick={() => setActiveModal('cooler')} />
                    <CategoryCard title="Power Supply" icon={FaPlug} selectedItem={selections.psu} onClick={() => setActiveModal('psu')} />
                    <CategoryCard title="Cabinet" icon={FaBox} selectedItem={selections.cabinet} onClick={() => setActiveModal('cabinet')} />
                </div>
            </div>

            {/* SECTION 2: OPERATING SYSTEM */}
            <div>
                <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-white uppercase tracking-widest mb-6">Operating System</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CategoryCard title="Primary OS" icon={FaWindows} selectedItem={selections.osPrimary} onClick={() => setActiveModal('osPrimary')} />
                </div>
            </div>

            {/* SECTION 3: ACCESSORIES */}
            <div>
                <h2 className="font-orbitron text-xl sm:text-2xl font-bold text-white uppercase tracking-widest mb-6">Accessories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CategoryCard title="Monitor" icon={FaDesktop} selectedItem={selections.monitor} onClick={() => setActiveModal('monitor')} />
                    <CategoryCard title="Keyboard & Mouse" icon={FaKeyboard} selectedItem={selections.combo} onClick={() => setActiveModal('combo')} />
                    <CategoryCard title="Standalone Keyboard" icon={FaKeyboard} selectedItem={selections.keyboard} onClick={() => setActiveModal('keyboard')} />
                    <CategoryCard title="Standalone Mouse" icon={FaMouse} selectedItem={selections.mouse} onClick={() => setActiveModal('mouse')} />
                </div>
            </div>
        </div>
    );
};