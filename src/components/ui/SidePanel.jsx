import { PanelInspector } from './PanelInspector';
import { DataSourceFeed } from './DataSourceFeed';
import { AlertLog } from './AlertLog';
import { useStore } from '../../stores/useStore';
import { motion, AnimatePresence } from 'framer-motion'; // Add framer-motion to deps for this

export function SidePanel() {
  const { selectedPanelId, alerts, acknowledgeAlert } = useStore();
  const hasCritical = alerts.some(a => !a.acknowledged && a.type !== 'DRONE_DISPATCH');
  
  return (
    <div className="fixed right-4 top-20 bottom-4 w-96 max-h-full flex flex-col gap-4 pointer-events-auto z-10">
      {/* Alert Banner */}
      <AnimatePresence>
        {hasCritical && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 50 }}
            className="glass border-red-500/50 bg-red-500/10 p-3 rounded-lg flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            <span className="text-sm text-red-300 flex-1">Critical Anomalies Detected. Drone Deploying.</span>
            <button onClick={() => alerts.filter(a=>!a.acknowledged).forEach(a=>acknowledgeAlert(a.id))} className="text-xs px-2 py-1 bg-red-500/20 rounded hover:bg-red-500/40">Ack All</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass flex-1 flex flex-col overflow-hidden rounded-xl">
        <div className="border-b border-white/10 p-3 flex gap-2">
          <TabButton id="inspector" label="INSPECTOR" />
          <TabButton id="sources" label="DATA SOURCES" />
          <TabButton id="logs" label="ALERT LOG" />
        </div>
        <AnimatePresence mode="wait">
          {selectedPanelId ? <PanelInspector key="inspector" /> : <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">Select a panel from the Virtual Twin to inspect telemetry.</div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Simple Tab Logic (Use state or context in real app)
function TabButton({id, label}) {
  // Simplified: Just renders. Real app needs activeTab state.
  return <button className="px-3 py-1 text-xs font-mono text-gray-400 hover:text-white rounded transition">{label}</button>;
}
