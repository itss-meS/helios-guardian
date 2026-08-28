import { create } from 'zustand';
import { generatePanels, FARM_CONFIG } from '../utils/panelGenerator';

const initialPanelsArray = generatePanels();
const panelsMap = new Map(initialPanelsArray.map(p => [p.id, p]));

export const useStore = create((set, get) => ({
  // --- State ---
  panels: panelsMap,
  selectedPanelId: null,
  drone: { 
    state: 'IDLE', // IDLE, EN_ROUTE, INSPECTING, RETURNING
    position: [0, 30, 0], 
    target: null, 
    path: null, 
    progress: 0,
    battery: 100 
  },
  ai: { 
    lastCycle: 0, 
    dataSources: {}, 
    isAnalyzing: true,
    totalScanned: 0 
  },
  alerts: [], // {id, panelId, type, message, time, acknowledged}
  kpis: { total: initialPanelsArray.length, ok: 0, warn: 0, critical: 0, energyToday: 0 },
  viewMode: 'HEALTH', // HEALTH, TEMPERATURE, IRRADIANCE, ANOMALY
  
  // --- Actions ---
  setPanels: (newPanelsArray) => {
    const map = new Map();
    let ok=0, warn=0, crit=0, energy=0;
    newPanelsArray.forEach(p => { 
      map.set(p.id, p); 
      if(p.status==='OK') ok++; else if(p.status==='UNDERPERFORMING') warn++; else crit++;
      energy += p.actualKwh;
    });
    set({ panels: map, kpis: { ...get().kpis, ok, warn, critical: crit, energyToday: parseFloat(energy.toFixed(1)) }});
  },
  
  updatePanel: (id, data) => set(state => { 
    const p = state.panels.get(id); if(!p) return state; 
    const newMap = new Map(state.panels); newMap.set(id, {...p, ...data}); 
    return { panels: newMap }; 
  }),

  selectPanel: (id) => set({ selectedPanelId: id, drone: {...get().drone, target: null } }), // Cancel drone on manual select
  
  dispatchDrone: (panelId, targetPos, reason, priority) => {
    const state = get();
    const drone = state.drone;
    if (drone.state !== 'IDLE' && drone.state !== 'RETURNING') return; // Busy
    
    const path = generateFlightPath(drone.position, targetPos); // Import needed
    set({ 
      drone: { ...drone, state: 'EN_ROUTE', target: panelId, path, progress: 0, battery: 100 },
      alerts: [...state.alerts, { id: Date.now(), panelId, type: 'DRONE_DISPATCH', message: `Drone dispatched to Panel ${panelId} (${reason})`, time: Date.now(), acknowledged: false }]
    });
  },

  addAlert: (alert) => set(state => ({ alerts: [alert, ...state.alerts].slice(0, 50) })),
  acknowledgeAlert: (id) => set(state => ({ alerts: state.alerts.map(a => a.id===id?{...a,acknowledged:true}:a) })),
  
  setDroneProgress: (progress, pos) => set(state => ({ drone: {...state.drone, progress, position: pos} })),
  setDroneState: (stateName) => set(state => ({ drone: {...state.drone, state: stateName} })),
  
  updateAI: (data) => set(state => ({ ai: { ...state.ai, ...data, lastCycle: Date.now() } })),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Drone returns home logic handled in Drone component loop
}));

// Import here to avoid circular dependency with store
import { generateFlightPath } from '../utils/dronePath';
