// App entrypoint: orchestrates data loading, UI, and events
import { loadAll, cache, sendToAppsScript } from './dataService.js';
import { initUI, renderDashboard, renderReport, showError } from './ui.js';
import { createRipple } from './utils.js';

// Initialize UI bindings
const { startRefresh } = initUI();

async function doLoadAllAndRender() {
  try {
    await loadAll();
    // Render slices
    renderDashboard();
    renderReport('');
  } catch (e) {
    showError(e.message || 'โหลดข้อมูลล้มเหลว');
    throw e;
  }
}

// First load on startup
startRefresh(doLoadAllAndRender);

// Hook refresh button custom event from UI
document.addEventListener('app:refresh-clicked', () => {
  startRefresh(doLoadAllAndRender);
});

// Stock search input
const stockSearchInput = document.getElementById('reportSearch');
stockSearchInput?.addEventListener('input', (e) => {
  renderReport(e.target.value);
});
