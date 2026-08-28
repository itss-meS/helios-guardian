// 11 Simulated Data Sources
const DATA_SOURCES = [
  'SATELLITE_IR_THERMAL', 'DRONE_VISUAL_RGB', 'DRONE_EL_IMAGING', 
  'INVERTER_TELEMETRY', 'WEATHER_STATION_GROUND', 'SATELLITE_SAR', 
  'SOIL_MOISTURE_SENSORS', 'AIR_QUALITY_INDEX', 'VEGETATION_INDEX_NDVI', 
  'HISTORICAL_DEGRADATION_MODEL', 'GRID_FREQUENCY_STABILITY'
];

const DAMAGE_TYPES = ['MICROCRACKS', 'HOTSPOT', 'PID_DEGRADATION', 'DELAMINATION', 'BIRD_DAMAGE', 'SOILING', 'TRACKER_MALFUNCTION'];

// Physics-based degradation simulation
function calculateHealth(panel, sources) {
  let health = panel.health;
  const ageFactor = 0.9999; // Slow natural decay
  
  // 1. Thermal Stress (Satellite IR + Weather)
  if (sources.SATELLITE_IR_THERMAL > 65) health -= 0.002; // Hotspot risk
  
  // 2. Soiling (Air Quality + Rain lack + NDVI)
  if (sources.AIR_QUALITY_INDEX > 150 && sources.WEATHER_STATION_GROUND < 5) health -= 0.005; // Dust accumulation
  
  // 3. Microcracks (EL Imaging + Thermal Cycling)
  if (sources.DRONE_EL_IMAGING > 0.7 && Math.abs(sources.WEATHER_STATION_GROUND - 25) > 20) health -= 0.003;
  
  // 4. PID (High Voltage + Humidity)
  if (sources.INVERTER_TELEMETRY > 1000 && sources.SOIL_MOISTURE_SENSORS > 80) health -= 0.001;
  
  // 5. Tracker Malfunction (Inverter Telemetry mismatch)
  if (sources.INVERTER_TELEMETRY < 100 && sources.SATELLITE_IR_THERMAL > 40) health -= 0.02; // Stuck tracker = hot panel
  
  // Random acute events (Storm, Bird, Vandalism)
  if (Math.random() < 0.00005) { // ~1 event per 20k panels per cycle
    health -= 0.3 + Math.random() * 0.5;
    return { health: Math.max(0, health), damageType: DAMAGE_TYPES[Math.floor(Math.random()*DAMAGE_TYPES.length)], acute: true };
  }

  return { health: Math.max(0, health * ageFactor), damageType: 'NONE', acute: false };
}

// Main Worker Loop
let panelStates = [];
let droneHome = [0, 30, 0];

self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  if (type === 'INIT') {
    panelStates = payload.panels.map(p => ({ ...p, health: 1.0 }));
    droneHome = payload.droneHome;
    runAnalysisCycle();
  } 
  else if (type === 'DRONE_REPORT') {
    // Drone verified: Ground Truth Update
    const idx = panelStates.findIndex(p => p.id === payload.panelId);
    if (idx !== -1) {
      panelStates[idx].health = payload.verifiedHealth;
      panelStates[idx].damageType = 'VERIFIED_' + payload.damageType;
      panelStates[idx].lastInspection = Date.now();
    }
  }
  else if (type === 'MANUAL_REPAIR') {
    const idx = panelStates.findIndex(p => p.id === payload.panelId);
    if (idx !== -1) { panelStates[idx].health = 1.0; panelStates[idx].damageType = 'NONE'; panelStates[idx].anomalyScore = 0; }
  }
};

function runAnalysisCycle() {
  // Simulate Live Data Feeds for 11 sources
  const liveSources = {};
  DATA_SOURCES.forEach(src => liveSources[src] = Math.random() * 100); // Normalized 0-100
  
  // Inject correlated anomalies for realism
  const anomalyZoneCenter = Math.floor(Math.random() * panelStates.length);
  
  const commands = [];
  const updates = panelStates.map((panel, i) => {
    // Spatial correlation: neighbors of anomaly zone get hit harder
    const dist = Math.abs(i - anomalyZoneCenter);
    let localSources = { ...liveSources };
    if (dist < 50) { // Localized storm/dust event
      localSources.SATELLITE_IR_THERMAL += 20;
      localSources.AIR_QUALITY_INDEX += 50;
    }
    
    const result = calculateHealth(panel, localSources);
    const newHealth = result.health;
    const anomalyScore = 1.0 - newHealth;
    
    let status = 'OK';
    if (newHealth < 0.4) status = 'CRITICAL';
    else if (newHealth < 0.75) status = 'UNDERPERFORMING';
    
    // Calculate Actual Energy based on health
    const actualKwh = panel.expectedKwh * newHealth * (0.95 + Math.random() * 0.1);

    const updatedPanel = { ...panel, health: newHealth, actualKwh: parseFloat(actualKwh.toFixed(2)), anomalyScore: parseFloat(anomalyScore.toFixed(3)), status, temperature: 25 + localSources.SATELLITE_IR_THERMAL * 0.3, irradiance: 800 + localSources.SATELLITE_IR_THERMAL * 2 };

    // AI Decision: Dispatch Drone?
    if (status === 'CRITICAL' && panel.status !== 'CRITICAL' && !panel.droneDispatched) {
      commands.push({ type: 'DISPATCH_DRONE', panelId: panel.id, targetPos: [panel.x, 5, panel.z], reason: result.damageType, priority: result.acute ? 'HIGH' : 'NORMAL' });
      updatedPanel.droneDispatched = true;
    }
    
    return updatedPanel;
  });

  panelStates = updates;
  
  self.postMessage({ type: 'UPDATE', payload: { panels: updates, commands, dataSources: liveSources, timestamp: Date.now() } });
  
  // Next Cycle (2-5 seconds)
  setTimeout(runAnalysisCycle, 2000 + Math.random() * 3000);
}
