import { useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { Dashboard } from './components/ui/Dashboard';
import { SidePanel } from './components/ui/SidePanel';
import { useStore } from './stores/useStore';

// Initialize AI Worker
const worker = new Worker(new URL('./workers/aiAnalyst.worker.js', import.meta.url), { type: 'module' });

export function App() {
  const { setPanels, updateAI, addAlert, drone } = useStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Expose worker globally for DroneAnimator to post messages back
    window.aiWorker = worker;

    // 1. Send Initial Farm Data to Worker
    const initialPanels = Array.from(useStore.getState().panels.values());
    worker.postMessage({ 
      type: 'INIT', 
      payload: { 
        panels: initialPanels, 
        droneHome: drone.position 
      } 
    });

    // 2. Listen for AI Updates
    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'UPDATE') {
        // Update Panels State (Batched)
        setPanels(payload.panels);
        // Update AI Dashboard Data
        updateAI({ dataSources: payload.dataSources, totalScanned: payload.panels.length });
        // Handle Drone Commands from AI
        payload.commands.forEach(cmd => {
          if (cmd.type === 'DISPATCH_DRONE') {
            addAlert({ id: Date.now() + Math.random(), panelId: cmd.panelId, type: 'DRONE_DISPATCH', message: `AI Auto-Dispatch: Panel ${cmd.panelId} (${cmd.reason})`, time: Date.now(), acknowledged: false });
            useStore.getState().dispatchDrone(cmd.panelId, cmd.targetPos, cmd.reason, cmd.priority);
          }
        });
      }
    };

    return () => { worker.terminate(); window.aiWorker = null; };
  }, [setPanels, updateAI, addAlert]);

  return (
    <div className="w-full h-full relative">
      <Scene />
      <Dashboard />
      <SidePanel />
      
      {/* Global Styles for Animations */}
      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        @keyframes pulse-subtle { 0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } 50% { box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2); } }
        .animate-pulse-subtle { animation: pulse-subtle 2s infinite; }
        /* Font Orbitron fallback */
        .font-orbitron { font-family: 'Orbitron', 'Segoe UI', monospace; }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
      `}</style>
    </div>
  );
}
