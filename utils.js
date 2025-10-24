// Utility helpers shared across modules

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Custom confirmation modal that returns a Promise<boolean>
export function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('customConfirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYes = document.getElementById('confirmYes');
    const confirmNo = document.getElementById('confirmNo');

    if (!modal || !confirmMessage || !confirmYes || !confirmNo) {
      // If the modal isn't present, fallback to native confirm
      const ok = window.confirm(message);
      resolve(ok);
      return;
    }

    confirmMessage.innerHTML = message;
    modal.classList.remove('hidden');

    const handleYes = () => {
      cleanup();
      resolve(true);
    };
    const handleNo = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      modal.classList.add('hidden');
      confirmYes.removeEventListener('click', handleYes);
      confirmNo.removeEventListener('click', handleNo);
    };

    confirmYes.addEventListener('click', handleYes);
    confirmNo.addEventListener('click', handleNo);
  });
}

export function formatDateToDDMMMYYYY(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function parseSheetDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = (monthNames.indexOf(parts[1]) + 1).toString().padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
}

// Button ripple and pulse effect
export function createRipple(e) {
  const button = e.currentTarget;
  if (!button || !button.getBoundingClientRect) return;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.classList.add('ripple');
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';

  button.appendChild(ripple);

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ring = document.createElement('div');
      ring.classList.add('pulse-ring');
      ring.style.width = ring.style.height = '60px';
      ring.style.left = '50%';
      ring.style.top = '50%';
      ring.style.marginLeft = '-30px';
      ring.style.marginTop = '-30px';
      button.appendChild(ring);
      setTimeout(() => ring.remove(), 1500);
    }, i * 200);
  }
  setTimeout(() => ripple.remove(), 600);
}

export function generateLotId(productCode, dateStr, lotIndex = 1) {
  let ymd = '';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return `${productCode}-${ymd}-${String(lotIndex).padStart(2, '0')}`;
}

// Configure Tailwind (CDN) theme at runtime
export function configureTailwind() {
  try {
    const w = typeof window !== 'undefined' ? window : undefined;
    if (!w || !w.tailwind) return;
    w.tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Kanit', 'sans-serif'] },
          colors: {
            base: { bg: '#0a0b12', card: '#121326', line: '#1f2140' },
            neon: { blue: '#4cc1ff', violet: '#a78b45', fuchsia: '#ff6bff', cyan: '#3fe3ff' },
          },
          boxShadow: {
            neonBlue: '0 0 22px rgba(76,193,255,.35)',
            neonViolet: '0 0 22px rgba(167,139,250,.35)',
          },
        },
      },
    };
  } catch {
    // ignore
  }
}
