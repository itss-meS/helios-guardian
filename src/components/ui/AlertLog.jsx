import { useStore } from '../../stores/useStore';

export function AlertLog() {
  const { alerts, acknowledgeAlert } = useStore();
  
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      <h4 className="font-mono text-xs text-cyan-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-2">MISSION LOG</h4>
      {alerts.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No alerts. All systems nominal.</p>}
      {alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onAck={() => acknowledgeAlert(alert.id)} />
      ))}
    </div>
  );
}

function AlertItem({ alert, onAck }) {
  const colors = {
    DRONE_DISPATCH: 'border-cyan-500/50 bg-cyan-500/5 text-cyan-300',
    INSPECTION_COMPLETE: 'border-green-500/50 bg-green-500/5 text-green-300',
    CRITICAL: 'border-red-500/50 bg-red-500/5 text-red-300',
  };
  const cls = colors[alert.type] || 'border-gray-500/50';
  const time = new Date(alert.time).toLocaleTimeString();
  
  return (
    <div className={`glass p-3 rounded-lg border-l-4 ${cls} flex items-start gap-3 animate-slide-in`}>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-mono text-sm truncate">{alert.message}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{time}</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">Panel ID: {alert.panelId}</p>
      </div>
      {!alert.acknowledged && (
        <button onClick={onAck} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/10 transition flex-shrink-0">ACK</button>
      )}
    </div>
  );
}
