import { useStore } from '../../stores/useStore';

export function Dashboard() {
  const { kpis, ai, drone, viewMode, setViewMode } = useStore();
  
  return (
    <div className="fixed top-4 left-4 right-4 z-20 flex flex-wrap gap-3 justify-between items-center px-4 pointer-events-none">
      <div className="glass p-4 rounded-xl flex items-center gap-6 pointer-events-auto min-w-0 flex-1">
        <div className="text-glow font-orbitron text-2xl font-bold tracking-wider">HELIOS GUARDIAN</div>
        <div className="flex gap-4 border-l border-white/10 pl-4">
          <KPI label="TOTAL" value={kpis.total} color="text-gray-400" />
          <KPI label="HEALTHY" value={kpis.ok} color="text-green-400" />
          <KPI label="WARN" value={kpis.warn} color="text-orange-400" />
          <KPI label="CRITICAL" value={kpis.critical} color="text-red-400" />
          <KPI label="ENERGY (MWh)" value={kpis.energyToday.toFixed(1)} color="text-yellow-300" />
        </div>
      </div>

      <div className="glass p-3 rounded-xl flex items-center gap-2 pointer-events-auto">
        <span className="text-xs text-gray-400 uppercase tracking-wider">View Mode:</span>
        {['HEALTH', 'TEMPERATURE', 'IRRADIANCE', 'ANOMALY'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-xs rounded font-mono transition ${viewMode===m ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}>{m}</button>
        ))}
      </div>

      <div className="glass p-3 rounded-xl flex items-center gap-4 pointer-events-auto">
        <div className={`w-3 h-3 rounded-full ${drone.state === 'IDLE' ? 'bg-green-400' : drone.state === 'INSPECTING' ? 'bg-yellow-400 animate-pulse' : 'bg-cyan-400'}`}></div>
        <span className="font-mono text-sm capitalize">Drone: {drone.state.replace('_', ' ')}</span>
        <div className="w-32 h-1.5 bg-gray-800 rounded overflow-hidden">
          <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${drone.battery}%` }}></div>
        </div>
        <span className="text-xs text-gray-400 w-10 text-right">{drone.battery}%</span>
      </div>
    </div>
  );
}

function KPI({ label, value, color }) {
  return (
    <div>
      <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
      <div className={`font-orbitron text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
