import { useStore } from '../../stores/useStore';

const SOURCE_DETAILS = {
  'SATELLITE_IR_THERMAL': { desc: 'Landsat 9 / Sentinel-3 Thermal Bands', unit: '°C', icon: '🛰️' },
  'DRONE_VISUAL_RGB': { desc: 'High-Res Orthomosaic (2cm/px)', unit: 'MP', icon: '📷' },
  'DRONE_EL_IMAGING': { desc: 'Electroluminescence Night Scan', unit: 'Defects', icon: '🔬' },
  'INVERTER_TELEMETRY': { desc: 'String Level IV Curves & Power', unit: 'kW', icon: '🔌' },
  'WEATHER_STATION_GROUND': { desc: 'Pyranometer, Anemometer, Thermometer', unit: 'Various', icon: '🌤️' },
  'SATELLITE_SAR': { desc: 'Sentinel-1 Subsidence/Deformation', unit: 'mm', icon: '📡' },
  'SOIL_MOISTURE_SENSORS': { desc: 'Capacitive Probes @ Root Zone', unit: '%', icon: '🌱' },
  'AIR_QUALITY_INDEX': { desc: 'PM2.5 / PM10 / NO2 (EPA/API)', unit: 'AQI', icon: '💨' },
  'VEGETATION_INDEX_NDVI': { desc: 'Sentinel-2 Red/NIR Bands', unit: 'Index', icon: '🌿' },
  'HISTORICAL_DEGRADATION_MODEL': { desc: 'Physics-Informed ML (25yr Baseline)', unit: '%/yr', icon: '📈' },
  'GRID_FREQUENCY_STABILITY': { desc: 'ISO/RTO Frequency & Voltage Ride-thru', unit: 'Hz', icon: '⚡' },
};

export function DataSourceFeed() {
  const { ai } = useStore();
  const sources = ai.dataSources || {};

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      <h4 className="font-mono text-xs text-cyan-400 uppercase tracking-wider mb-2 border-b border-white/10 pb-2">LIVE DATA INGESTION (11 SOURCES)</h4>
      {Object.entries(SOURCE_DETAILS).map(([key, meta]) => {
        const val = sources[key] ?? (Math.random() * 100);
        const isAnomaly = val > 80; // Arbitrary threshold for demo
        return (
          <div key={key} className={`glass p-3 rounded-lg flex items-center justify-between gap-2 transition ${isAnomaly ? 'border-orange-500/50 bg-orange-500/5 animate-pulse-subtle' : ''}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <p className="font-mono text-xs text-gray-400 truncate max-w-[180px]">{key}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{meta.desc}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-orbitron text-lg font-bold {isAnomaly ? 'text-orange-400' : 'text-green-400'}">{val.toFixed(1)}</p>
              <p className="text-[10px] text-gray-500">{meta.unit}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
