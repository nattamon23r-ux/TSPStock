// UI rendering and DOM wiring
import { cache, sendToAppsScript } from './dataService.js';
import { formatDateToDDMMMYYYY, createRipple, showCustomConfirm, generateLotId } from './utils.js';

// Expose some stateful elements
export function initUI() {
  // Tabs
  const tabs = [
    'dashboard','add-product','add-vendor','add-project','purchase','issue',
    'report','vendors-list','project-expenditure-report','budget-estimate','settings'
  ];

  const sections = {};
  tabs.forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) sections[t] = el;
  });

  const tabButtons = document.querySelectorAll('.menu-item');
  const reportsDropdown = document.getElementById('reportsDropdown');
  const toggleReportsDropdownBtn = document.getElementById('toggleReportsDropdown');
  const reportsDropdownArrow = document.getElementById('reportsDropdownArrow');

  function setActiveTab(name) {
    Object.values(sections).forEach(section => section.classList.add('hidden'));
    if (sections[name]) sections[name].classList.remove('hidden');

    tabButtons.forEach(b => b.classList.remove('tab-active'));
    if (toggleReportsDropdownBtn) toggleReportsDropdownBtn.classList.remove('tab-active');

    const clickedTabButton = document.querySelector(`.menu-item[data-tab="${name}"]`);
    if (clickedTabButton) {
      clickedTabButton.classList.add('tab-active');
    } else if (['report','vendors-list','project-expenditure-report'].includes(name)) {
      if (toggleReportsDropdownBtn) toggleReportsDropdownBtn.classList.add('tab-active');
      const subItem = reportsDropdown?.querySelector(`[data-tab="${name}"]`);
      if (subItem) subItem.classList.add('tab-active');
    }

    if (['report','vendors-list','project-expenditure-report'].includes(name)) {
      reportsDropdown?.classList.remove('hidden');
      reportsDropdownArrow?.classList.add('rotate-180');
    } else {
      reportsDropdown?.classList.add('hidden');
      reportsDropdownArrow?.classList.remove('rotate-180');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  tabButtons.forEach(btn => {
    if ((btn).id !== 'toggleReportsDropdown') {
      btn.addEventListener('click', () => setActiveTab((btn).dataset.tab));
    }
  });
  toggleReportsDropdownBtn?.addEventListener('click', () => {
    reportsDropdown?.classList.toggle('hidden');
    reportsDropdownArrow?.classList.toggle('rotate-180');
  });
  setActiveTab('dashboard');

  // Sidebar responsive
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar?.classList.add('sidebar-open');
    sidebarOverlay?.classList.add('overlay-active');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar?.classList.remove('sidebar-open');
    sidebarOverlay?.classList.remove('overlay-active');
    document.body.style.overflow = '';
  }
  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) closeSidebar();
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      sidebar?.classList.remove('sidebar-open');
      sidebarOverlay?.classList.remove('overlay-active');
      document.body.style.overflow = '';
    }
  });

  // Refresh UI
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshIcon = document.getElementById('refreshIcon');
  const btnLabel = document.getElementById('btnLabel');
  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');

  let isRefreshing = false;
  async function startRefresh(onLoad) {
    isRefreshing = true;
    refreshIcon?.classList.add('refresh-spin');
    if (btnLabel) btnLabel.textContent = 'กำลังรีเฟรช...';
    refreshBtn?.classList.add('opacity-80');
    if (progressBar) {
      progressBar.classList.remove('progress-active');
      progressBar.style.width = '0%';
      setTimeout(() => progressBar.classList.add('progress-active'), 100);
    }
    const statuses = ['เชื่อมต่อเซิร์ฟเวอร์...','ดาวน์โหลดข้อมูล...','ประมวลผลข้อมูล...','อัพเดทหน้าจอ...','เสร็จสิ้น!'];
    let errorDuringLoad = false;
    try {
      for (let s of statuses) {
        if (statusText) {
          statusText.textContent = s;
          statusText.classList.add('text-blue-400');
        }
        if (s === 'ดาวน์โหลดข้อมูล...') {
          await onLoad();
        }
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (e) {
      errorDuringLoad = true;
      console.error(e);
      if (statusText) {
        statusText.textContent = `เกิดข้อผิดพลาด: ${e.message}`;
        statusText.classList.remove('text-blue-400');
        statusText.classList.add('text-red-400');
      }
    } finally {
      completeRefresh(errorDuringLoad);
    }
  }
  function completeRefresh(hadError = false) {
    refreshIcon?.classList.remove('refresh-spin');
    if (btnLabel) btnLabel.textContent = 'Refresh';
    refreshBtn?.classList.remove('opacity-80');
    setTimeout(() => {
      if (progressBar) {
        progressBar.classList.remove('progress-active');
        progressBar.style.width = '0%';
      }
    }, 500);
    if (!hadError && statusText) {
      statusText.textContent = 'รีเฟรชเสร็จสิ้น!';
      statusText.classList.remove('text-blue-400','text-red-400');
      statusText.classList.add('text-green-400');
    }
    setTimeout(() => {
      if (statusText) {
        statusText.textContent = 'พร้อมรีเฟรช';
        statusText.classList.remove('text-green-400','text-red-400','text-blue-400');
      }
      isRefreshing = false;
    }, 2000);
  }
  refreshBtn?.addEventListener('click', (e) => {
    if (isRefreshing) return;
    createRipple(e);
    // onLoad to be passed by caller
    document.dispatchEvent(new CustomEvent('app:refresh-clicked'));
  });

  return { setActiveTab, startRefresh, statusText };
}

// Error display helper
export function showError(msg) {
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = `ข้อผิดพลาด: ${msg}`;
    statusText.classList.remove('text-blue-400','text-green-400');
    statusText.classList.add('text-red-400');
  }
  const reportBody = document.getElementById('reportBody');
  if (reportBody) reportBody.innerHTML = `<tr><td class="px-4 py-3 text-red-400" colspan="8">${msg}</td></tr>`;
}

// Render slices used by app.js after data loaded
export async function renderDashboard() {
  const totalQty = cache.stockReport.reduce((s, r) => s + (+r['คงเหลือ'] || 0), 0);
  const totalStockValue = cache.stockReport.reduce((s, r) => s + (+r['ต้นทุนรวมปัจจุบัน'] || 0), 0);
  const productCount = cache.stockReport.length;
  const deadValue = cache.stockReport
    .filter(r => (String(r['ประเภทการเคลื่อนไหวสินค้า'] || '').toLowerCase() === 'deadstock'))
    .reduce((s, r) => s + (+r['ต้นทุนรวมปัจจุบัน'] || 0), 0);
  const deadPercent = totalStockValue > 0 ? (deadValue / totalStockValue) * 100 : 0;
  document.getElementById('kpiTotalQty').textContent = totalQty.toLocaleString('th-TH');
  document.getElementById('kpiStockValue').textContent = totalStockValue.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  document.getElementById('kpiProductCount').textContent = productCount.toLocaleString('th-TH');
  document.getElementById('kpiDeadValue').textContent = deadValue.toLocaleString('th-TH', { minimumFractionDigits: 2 });
  document.getElementById('kpiDeadPercent').textContent = `${deadPercent.toFixed(1)}% ของสต็อกทั้งหมด`;
  document.getElementById('kpiUpdatedAt').textContent = `อัปเดตล่าสุด: ${cache.lastUpdated ? formatDateToDDMMMYYYY(cache.lastUpdated.toISOString()) : '-'}`;

  if (window.purchaseChartInstance) window.purchaseChartInstance.destroy();
  const ctx = document.getElementById('purchaseChart')?.getContext('2d');
  if (ctx) {
    const ChartCtor = window.Chart || (await import('https://cdn.jsdelivr.net/npm/chart.js')).default;
    window.purchaseChartInstance = new ChartCtor(ctx, {
      type: 'bar',
      data: {
        labels: cache.monthlyActivity.labels || [],
        datasets: [{ label: 'มูลค่าการซื้อ', data: cache.monthlyActivity.purchase || [], backgroundColor: '#8b5cf6', borderRadius: 8, borderSkipped: false }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
    });
  }
}

export function renderReport(searchQuery = '') {
  const body = document.getElementById('reportBody');
  if (!body) return;
  body.innerHTML = '';
  const q = (searchQuery || '').toLowerCase().trim();
  const filtered = cache.stockReport.filter(item => String(item['รหัสสินค้า']||'').toLowerCase().includes(q) || String(item['ชื่อสินค้า']||'').toLowerCase().includes(q));
  if (filtered.length === 0) {
    body.innerHTML = '<tr><td class="px-4 py-3 text-gray-400" colspan="9">ไม่พบรายการสินค้า</td></tr>';
    return;
  }
  filtered.forEach(r => {
    let badgeClass = 'bg-gray-600/20 text-gray-300';
    let displayText = String(r['ประเภทการเคลื่อนไหวสินค้า']||'').trim();
    const movementTypeLower = displayText.toLowerCase();
    if (movementTypeLower === 'fast') { badgeClass = 'bg-emerald-600/20 text-emerald-300'; displayText = 'Fast'; }
    else if (movementTypeLower === 'deadstock') { badgeClass = 'bg-red-600/20 text-red-300'; displayText = 'Deadstock'; }
    else if (movementTypeLower === 'slow') { badgeClass = 'bg-yellow-600/20 text-yellow-300'; displayText = 'Slow'; }
    else if (displayText === '') { displayText = 'ไม่ระบุ'; } else { displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1); badgeClass = 'bg-indigo-600/20 text-indigo-300'; }

    const tr = document.createElement('tr');
    tr.className = 'border-t border-gray-700/60';
    tr.innerHTML = `
      <td class="px-4 py-3 text-center"><input type="checkbox" class="stock-checkbox" value="${String(r['รหัสสินค้า']||'').trim()}"></td>
      <td class="px-4 py-3">${String(r['รหัสสินค้า']||'').trim()}</td>
      <td class="px-4 py-3">${String(r['ชื่อสินค้า']||'').trim()}</td>
      <td class="px-4 py-3">${Number(r['สินค้าที่ซื้อทั้งหมด']||0).toLocaleString('th-TH')}</td>
      <td class="px-4 py-3">${Number(r['เบิกทั้งหมด']||0).toLocaleString('th-TH')}</td>
      <td class="px-4 py-3 text-right">${Number(r['คงเหลือ']||0).toLocaleString('th-TH')}</td>
      <td class="px-4 py-3 text-right">${Number(r['จำนวนขั้นต่ำ']||0).toLocaleString('th-TH')}</td>
      <td class="px-4 py-3 text-right">${Number(r['ต้นทุนเฉลี่ยต่อชิ้น']||0).toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
      <td class="px-4 py-3 text-right">${Number(r['ต้นทุนรวมปัจจุบัน']||0).toLocaleString('th-TH', {minimumFractionDigits:2})}</td>
      <td class="px-4 py-3 text-center"><span class="text-xs px-2 py-1 rounded ${badgeClass}">${displayText}</span></td>
      <td class="px-4 py-3 text-center"><button class="view-lot-details-btn px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium" data-sku="${String(r['รหัสสินค้า']||'').trim()}" data-product-name="${String(r['ชื่อสินค้า']||'').trim()}">ดูรายละเอียด</button></td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('.view-lot-details-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const productSku = (e.target).dataset.sku;
      const productName = (e.target).dataset.productName;
      showLotDetails(productSku, productName);
    });
  });
}

export function showLotDetails(productSku, productName) {
  const lotDetailModal = document.getElementById('lotDetailModal');
  const lotDetailModalTitle = document.getElementById('lotDetailModalTitle');
  const lotDetailContent = document.getElementById('lotDetailContent');
  const closeLotDetailModalBtn = document.getElementById('closeLotDetailModal');
  if (!lotDetailModal || !lotDetailModalTitle || !lotDetailContent || !closeLotDetailModalBtn) return;

  const stockRow = cache.stockReport.find(r => String(r['รหัสสินค้า']||'').trim() === productSku);
  lotDetailModalTitle.textContent = `รายละเอียด Lot ของ: ${productName} (${productSku})`;
  lotDetailContent.innerHTML = '';
  if (stockRow) {
    lotDetailContent.innerHTML += `
      <div class="mb-2 flex gap-4">
        <div class="text-sm text-blue-300">สินค้าที่ซื้อทั้งหมด: <span class="font-bold text-white">${Number(stockRow['สินค้าที่ซื้อทั้งหมด']||0).toLocaleString('th-TH')}</span></div>
        <div class="text-sm text-pink-300">เบิกทั้งหมด: <span class="font-bold text-white">${Number(stockRow['เบิกทั้งหมด']||0).toLocaleString('th-TH')}</span></div>
      </div>
    `;
  }
  const productLots = cache.lots.filter(l => String(l['รหัสสินค้า']||'').trim() === productSku && (+l['จำนวนคงเหลือ']||0) > 0).sort((a,b) => new Date(a['วันที่']) - new Date(b['วันที่']));
  if (productLots.length === 0) {
    lotDetailContent.innerHTML = '<p class="text-gray-400">ไม่พบ Lot ที่มีสต็อกคงเหลือสำหรับสินค้านี้</p>';
  } else {
    let totalRemainingQty = 0;
    productLots.forEach(lot => {
      totalRemainingQty += (+lot['จำนวนคงเหลือ']||0);
      const lotItem = document.createElement('div');
      lotItem.className = 'bg-gray-700 border border-gray-600 rounded-md p-3';
      lotItem.innerHTML = `
        <div class="font-medium text-blue-300">Lot ID: ${String(lot.lotId || lot['Lotstoct'] || 'N/A').trim()}</div>
        <div class="text-sm mt-1">วันที่รับเข้า: <span class="text-cyan-300">${formatDateToDDMMMYYYY(lot['วันที่'])}</span></div>
        <div class="text-sm">คงเหลือ: <span class="font-bold text-white">${Number(lot['จำนวนคงเหลือ']||0).toLocaleString('th-TH')}</span> ชิ้น</div>
        <div class="text-sm">ราคาต่อหน่วย: <span class="font-bold text-white">${Number(lot['ราคา']||0).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span> บาท</div>
        <div class="text-sm">มูลค่า Lot: <span class="font-bold text-white">${Number((+lot['จำนวนคงเหลือ']||0) * (+lot['ราคา']||0)).toLocaleString('th-TH', {minimumFractionDigits: 2})}</span> บาท</div>`;
      lotDetailContent.appendChild(lotItem);
    });
    const totalQtyDiv = document.createElement('div');
    totalQtyDiv.className = 'mt-4 text-lg font-bold text-white';
    totalQtyDiv.innerHTML = `รวมคงเหลือทั้งหมด: <span class="text-green-400">${Number(totalRemainingQty).toLocaleString('th-TH')}</span> ชิ้น`;
    lotDetailContent.appendChild(totalQtyDiv);
  }
  lotDetailModal.classList.remove('hidden');
  const closeHandler = () => {
    lotDetailModal.classList.add('hidden');
    closeLotDetailModalBtn.removeEventListener('click', closeHandler);
  };
  closeLotDetailModalBtn.addEventListener('click', closeHandler);
  lotDetailModal.addEventListener('click', (e) => { if (e.target === lotDetailModal) closeHandler(); });
}

// Exported renderers for management tables would be similarly moved here if needed.
