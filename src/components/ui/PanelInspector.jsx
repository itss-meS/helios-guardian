import { useStore } from '../../stores/useStore';
import { format } from 'date-fns'; // Add date-fns to deps

export function PanelInspector() {
  const { selectedPanelId, panels, dispatchDrone, updatePanel } = useStore();
  const panel = panels.get(selectedPanelId);
  if (!panel) return null;

  const statusColor = panel.status === 'OK' ? 'text-green-400' : panel.status === 'UNDERPERFORMING' ? 'text-orange-400' : 'text-red-400';
  const healthPct = (panel.health * 100).toFixed(1);

  const handleDispatch = () => {
    dispatchDrone(panel.id, [panel.x, 5, panel.z], panel.damageType, 'MANUAL');
  };
  const handleRepair = () => {
    // Simulate repair ticket
    updatePanel(panel.id, { health: 1.0, status: 'OK', damageType: 'NONE', anomalyScore: 0 });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-orbitron text-lg text-cyan-300">PANEL #{panel.id}</h3>
          <p className="text-xs text-gray-500">Row {panel.row} | Col {panel.col} | {panel.lat.toFixed(6)}, {panel.lon.toFixed(6)}</p>
        </div>
        <span className={`text-xs font-mono px-2 py-1 rounded border ${statusColor} border-current/50 bg-current/10`}>{panel.status}</span>
      </div>

      {/* Health Gauge */}
      <div className="glass p-4 rounded-lg">
        <div className="flex justify-between text-sm mb-1">
          <span>HEALTH INDEX</span>
          <span className="font-mono text-cyan-300">{healthPct}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
          <div className="h-full rounded-full transition-all duration-500" style={{ 
            width: `${healthPct}%`, 
            background: panel.health > 0.75 ? 'linear-gradient(90deg, #00ff88, #00cc6a)' : panel.health > 0.4 ? 'linear-gradient(90deg, #ffaa00, #ff8800)' : 'linear-gradient(90deg, #ff3333, #cc0000)' 
          }}></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Expected: {panel.expectedKwh} kWh</span>
          <span>Actual: {panel.actualKwh} kWh</span>
          <span>Delta: {((panel.actualKwh/panel.expectedKwh)*100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-2 gap-3">
        <TelemetryCard label="TEMPERATURE" value={`${panel.temperature.toFixed(1)}°C`} icon="🌡️" />
        <TelemetryCard label="IRRADIANCE" value={`${panel.irradiance.toFixed(0)} W/m²`} icon="☀️" />
        <TelemetryCard label="ANOMALY SCORE" value={`${(panel.anomalyScore*100).toFixed(1)}%`} icon="📉" />
        <TelemetryCard label="DAMAGE TYPE" value={panel.damageType} icon="⚠️" />
        <TelemetryCard label="LAST INSPECTED" value={format(panel.lastInspection, 'MMM d, yyyy HH:mm')} icon="🕒" />
        <TelemetryCard label="EFFICIENCY" value={`${((panel.actualKwh/panel.expectedKwh)*100).toFixed(1)}%`} icon="⚡" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-white/10">
        <button onClick={handleDispatch} className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={panel.status === 'OK'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4M3 10a5.006 5.006 0 0110 0v4M3 10l9-7 9 7m-18 0v4a2 2 0 002 2h12a2 2 0 002-2v-4"/></svg>
          DISPATCH DRONE
        </button>
        <button onClick={handleRepair} className="btn-danger flex-1 flex items-center justify-center gap-2" disabled={panel.status === 'OK'}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          LOG REPAIR
        </button>
      </div>
    </div>
  );
}

function TelemetryCard({ label, value, icon }) {
  return (
    <div className="glass p-3 rounded-lg">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><span>{icon}</span>{label}</div>
      <div className="font-mono text-white text-lg truncate">{value}</div>
    </div>
  );
}
