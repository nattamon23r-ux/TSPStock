// Data service: API endpoints, cache, and network calls

export const READ_API = 'https://script.google.com/macros/s/AKfycbwUIOOrpz5OuBTozDFROkA4_Lxfm8P4N2DuY_DeOplhjiLjiXuCYmGGsVPXDJ0aqh4R/exec';
export const WRITE_API = 'https://script.google.com/macros/s/AKfycbwUIOOrpz5OuBTozDFROkA4_Lxfm8P4N2DuY_DeOplhjiLjiXuCYmGGsVPXDJ0aqh4R/exec';

export const cache = {
  products: [],
  vendors: [],
  projects: [],
  stockReport: [],
  lots: [],
  issues: [],
  recentActivities: [],
  topIssued: [],
  topStockValue: [],
  monthlyActivity: { labels: [], purchase: [], issue: [] },
  projectExpenditureData: [],
  lastUpdated: null,
  nextVendorCode: '001',
  nextProjectNo: 1,
  nextPurchaseNo: 1,
};

export async function loadAll() {
  const res = await fetch(READ_API, { method: 'GET' });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`โหลดข้อมูลไม่สำเร็จ (Status: ${res.status}, Message: ${errorText.substring(0, 100)}...)`);
  }
  const data = await res.json();
  cache.products = Array.isArray(data.products) ? data.products : [];
  cache.vendors = Array.isArray(data.vendors) ? data.vendors : [];
  cache.projects = Array.isArray(data.projects) ? data.projects : [];
  cache.stockReport = Array.isArray(data.stockReport) ? data.stockReport : [];
  cache.lots = Array.isArray(data.lots) ? data.lots : [];
  cache.issues = Array.isArray(data.issues) ? data.issues : [];
  cache.recentActivities = Array.isArray(data.recentActivities) ? data.recentActivities : [];
  cache.topIssued = Array.isArray(data.topIssued) ? data.topIssued : [];
  cache.topStockValue = Array.isArray(data.topStockValue) ? data.topStockValue : [];
  cache.monthlyActivity = data.monthlyActivity || { labels: [], purchase: [], issue: [] };
  cache.projectExpenditureData = Array.isArray(data.projectExpenditureData) ? data.projectExpenditureData : [];
  cache.lastUpdated = new Date();
  cache.nextVendorCode = String(data.nextVendorCode || '1').padStart(3, '0');
  cache.nextProjectNo = data.nextProjectNo || 1;
  cache.nextPurchaseNo = data.nextPurchaseNo || 1;
  return cache;
}

// Send to Apps Script (JSON with fallback to x-www-form-urlencoded), returns parsed result
export async function sendToAppsScript(payload) {
  // First try JSON
  try {
    const r1 = await fetch(WRITE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const t = await r1.text();
    let result;
    try { result = JSON.parse(t); } catch { result = { ok: r1.ok, message: t || (r1.ok ? 'OK' : 'Error') }; }

    if (!r1.ok || result.ok === false) {
      // treat specific delete-not-found as soft success
      if (
        (payload.actionType === 'deleteVendor' || payload.actionType === 'deleteProduct' || payload.actionType === 'deleteProject') &&
        String(result.message || '').includes('ไม่พบ')
      ) {
        return { ok: true, message: result.message || 'รายการอาจถูกลบไปแล้ว', itemNotFound: true };
      }
      throw new Error(result.message || 'บันทึกไม่สำเร็จ');
    }
    return result;
  } catch (errJSON) {
    // Fallback to form-urlencoded
    const r2 = await fetch(WRITE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: 'payload=' + encodeURIComponent(JSON.stringify(payload)),
    });
    const t2 = await r2.text();
    let result2;
    try { result2 = JSON.parse(t2); } catch { result2 = { ok: r2.ok, message: t2 || (r2.ok ? 'OK' : 'Error') }; }

    if (!r2.ok || result2.ok === false) {
      if (
        (payload.actionType === 'deleteVendor' || payload.actionType === 'deleteProduct' || payload.actionType === 'deleteProject') &&
        String(result2.message || '').includes('ไม่พบ')
      ) {
        return { ok: true, message: result2.message || 'รายการอาจถูกลบไปแล้ว', itemNotFound: true };
      }
      throw new Error(result2.message || 'บันทึกไม่สำเร็จ');
    }
    return result2;
  }
}
