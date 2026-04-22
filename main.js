/* ── GSAP required for magnetic blobs - loaded via CDN in HTML ── */

const SECTIONS = ['hero', 'about', 'work', 'contact'];
let current = 0;
let isAnimating = false;
let blobsInitialized = false;

/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});
document.querySelectorAll('a, button, .menu-circle, .nav-link, .project-card, .social-btn, .contact-title, .dot').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
});

/* ── LOADER ── */
function runLoader() {
  const count = document.querySelector('.loader-count');
  const status = document.querySelector('.loader-status');
  const messages = ['Initializing...', 'Loading assets...', 'Compiling shaders...', 'Almost there...', 'Welcome.'];
  let n = 0;
  const interval = setInterval(() => {
    n++;
    count.textContent = String(n).padStart(2, '0');
    const idx = Math.floor((n / 100) * messages.length);
    status.textContent = messages[Math.min(idx, messages.length - 1)];
    if (n >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.style.transition = 'opacity 0.8s cubic-bezier(0.23,1,0.32,1)';
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
          showSection(0);
        }, 800);
      }, 400);
    }
  }, 22);
}

/* ── SECTION TRANSITIONS ── */
function showSection(idx, dir = 1) {
  if (isAnimating) return;
  isAnimating = true;
  const sections = document.querySelectorAll('.section');
  const dots = document.querySelectorAll('.dot');
  const progCurrent = document.querySelector('.prog-current');

  // Hide old section
  const prevIdx = current;
  if (sections[prevIdx]) {
    const old = sections[prevIdx];
    old.style.transition = 'opacity 0.45s cubic-bezier(0.23,1,0.32,1), transform 0.45s cubic-bezier(0.23,1,0.32,1)';
    old.style.opacity = '0';
    old.style.transform = `scale(${dir > 0 ? 0.96 : 1.04})`;
    old.classList.remove('active');
    // Reset inline styles after transition so CSS class takes over
    setTimeout(() => {
      old.style.transition = '';
      old.style.opacity = '';
      old.style.transform = '';
    }, 460);
  }

  current = idx;

  setTimeout(() => {
    const next = sections[current];
    next.style.transform = `scale(${dir > 0 ? 1.04 : 0.96})`;
    next.style.opacity = '0';
    next.classList.add('active');
    // Force reflow
    void next.offsetWidth;
    next.style.transition = 'opacity 0.55s cubic-bezier(0.23,1,0.32,1), transform 0.55s cubic-bezier(0.23,1,0.32,1)';
    next.style.opacity = '1';
    next.style.transform = 'scale(1)';
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    progCurrent.textContent = String(current + 1).padStart(2, '0');
    setTimeout(() => {
      next.style.transition = '';
      next.style.opacity = '';
      next.style.transform = '';
      isAnimating = false;
    }, 560);
  }, 460);
}

function nextSection() { if (current < SECTIONS.length - 1) showSection(current + 1, 1); }
function prevSection() { if (current > 0) showSection(current - 1, -1); }

/* ── WHEEL / TOUCH NAV ── */
let wheelCooldown = false;
document.addEventListener('wheel', e => {
  if (wheelCooldown || document.getElementById('nav-overlay').classList.contains('open')) return;
  // Allow scroll inside work section
  const workEl = document.getElementById('work');
  if (current === 2 && workEl.scrollHeight > workEl.clientHeight) {
    const atBottom = workEl.scrollTop + workEl.clientHeight >= workEl.scrollHeight - 10;
    const atTop = workEl.scrollTop <= 5;
    if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return;
  }
  wheelCooldown = true;
  if (e.deltaY > 0) nextSection(); else prevSection();
  setTimeout(() => wheelCooldown = false, 900);
});

let touchStartY = 0;
document.addEventListener('touchstart', e => touchStartY = e.touches[0].clientY);
document.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) { if (dy > 0) nextSection(); else prevSection(); }
});

/* ── KEYBOARD NAV ── */
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') nextSection();
  if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') prevSection();
  if (e.key === 'Escape') closeNav();
});

/* ── NAV DOTS ── */
document.querySelectorAll('.dot').forEach((dot, i) => {
  dot.addEventListener('click', () => showSection(i, i > current ? 1 : -1));
});

/* ── CIRCULAR NAV ── */
const navOverlay = document.getElementById('nav-overlay');
const menuBtn = document.querySelector('.menu-circle');
const navClose = document.querySelector('.nav-close');

function openNav() { navOverlay.classList.add('open'); }
function closeNav() { navOverlay.classList.remove('open'); }

menuBtn.addEventListener('click', openNav);
navClose.addEventListener('click', closeNav);

// Nav links -> section jump
document.querySelectorAll('.nav-link[data-section]').forEach(link => {
  link.addEventListener('click', () => {
    const idx = parseInt(link.dataset.section);
    closeNav();
    setTimeout(() => showSection(idx, idx > current ? 1 : -1), 500);
  });
});

// Preview images on nav hover
const previewImgs = document.querySelectorAll('.nav-preview img');
document.querySelectorAll('.nav-link[data-preview]').forEach(link => {
  link.addEventListener('mouseenter', () => {
    previewImgs.forEach(img => img.classList.remove('visible'));
    const target = link.dataset.preview;
    const img = document.querySelector(`.nav-preview img[data-key="${target}"]`);
    if (img) img.classList.add('visible');
  });
});

/* ── MAGNETIC BLOBS (GSAP) ── */
function initBlobs() {
  if (blobsInitialized) return;
  blobsInitialized = true;
  const blobs = document.querySelectorAll('.blob');
  const multipliers = [0.5, 1.0, 1.5];
  document.addEventListener('mousemove', e => {
    const mx = (e.clientX / window.innerWidth - 0.5) * 40;
    const my = (e.clientY / window.innerHeight - 0.5) * 40;
    blobs.forEach((blob, i) => {
      const m = multipliers[i];
      gsap.to(blob, {
        x: mx * m, y: my * m,
        duration: 1.5 + i * 0.3,
        ease: 'power2.out'
      });
    });
  });
}

/* ── GSAP-safe init: poll until gsap is available ── */
function tryInitGsap() {
  if (typeof gsap !== 'undefined') {
    initBlobs();
  } else {
    setTimeout(tryInitGsap, 100);
  }
}

/* ── INIT ── */
window.addEventListener('load', () => {
  runLoader();
  tryInitGsap();
});
