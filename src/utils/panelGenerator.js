export const FARM_CONFIG = {
  rows: 50,
  cols: 40,
  panelWidth: 2.2,    // meters
  panelHeight: 1.1,
  gapX: 0.5,
  gapY: 3.0,          // Row spacing for maintenance access
  tilt: Math.PI / 6,  // 30 degrees
  baseLat: 34.0522,   // LA Coords
  baseLon: -118.2437,
  metersPerDegreeLat: 111000,
  metersPerDegreeLon: 111000 * Math.cos(34.0522 * Math.PI / 180)
};

export function generatePanels() {
  const panels = [];
  const { rows, cols, panelWidth, panelHeight, gapX, gapY, tilt, baseLat, baseLon, metersPerDegreeLat, metersPerDegreeLon } = FARM_CONFIG;
  const totalWidth = cols * (panelWidth + gapX);
  const totalHeight = rows * (panelHeight + gapY);
  const startX = -totalWidth / 2;
  const startZ = -totalHeight / 2;

  let id = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * (panelWidth + gapX) + panelWidth / 2;
      const z = startZ + r * (panelHeight + gapY) + panelHeight / 2;
      
      // Simulate "Expected Generation" based on position (edge effect, shading)
      const expectedKwh = 1.8 + Math.random() * 0.4 + (c / cols) * 0.2; 
      
      panels.push({
        id: id++,
        row: r, col: c,
        x, y: 0.1, z, // y slightly above ground
        rotation: -tilt, // Tilted towards sun (negative X rotation in Three.js)
        lat: baseLat + (z / metersPerDegreeLat),
        lon: baseLon + (x / metersPerDegreeLon),
        health: 1.0, // 1.0 = Green, 0.5 = Orange, 0.0 = Red
        status: 'OK', // OK, UNDERPERFORMING, CRITICAL
        expectedKwh: parseFloat(expectedKwh.toFixed(2)),
        actualKwh: 0, // Updated by AI
        temperature: 25 + Math.random() * 15,
        irradiance: 800 + Math.random() * 200,
        lastInspection: Date.now() - Math.random() * 86400000 * 30,
        anomalyScore: 0,
        damageType: 'NONE'
      });
    }
  }
  return panels;
}
