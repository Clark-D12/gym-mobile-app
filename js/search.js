/* ═══════════════════════════════════════════
   search.js  –  Fit Buddy exercise & plan search
   ═══════════════════════════════════════════ */

/* ── Exercise index (all exercises across all categories) ── */
const SEARCH_DATA = [

  /* ── CHEST ── */
  { name: 'Jumping Jacks',                  detail: '00:30', cat: 'Chest', level: 'Rookie',  badge: 'rookie',  src: '../img/jumping jack.mp4',                   link: 'chest-rookie.html'   },
  { name: 'Incline Push-up',                detail: 'x12',   cat: 'Chest', level: 'Rookie',  badge: 'rookie',  src: '../img/incline push up.mp4',                link: 'chest-rookie.html'   },
  { name: 'Band Bench Press',               detail: 'x12',   cat: 'Chest', level: 'Rookie',  badge: 'rookie',  src: '../img/Band Bench Press.mp4',               link: 'chest-rookie.html'   },
  { name: 'Band Chest Press',               detail: 'x12',   cat: 'Chest', level: 'Rookie',  badge: 'rookie',  src: '../img/Band Chest Press.mp4',               link: 'chest-rookie.html'   },
  { name: 'Barbell Incline Bench Press',    detail: 'x23',   cat: 'Chest', level: 'Veteran', badge: 'veteran', src: '../img/Barbell Incline Bench Press.mp4',    link: 'chest-veteran.html'  },
  { name: 'Barbell Bench Press',            detail: 'x23',   cat: 'Chest', level: 'Veteran', badge: 'veteran', src: '../img/Barbell Bench Press.mp4',            link: 'chest-veteran.html'  },
  { name: 'Incline Push-up',                detail: 'x30',   cat: 'Chest', level: 'Master',  badge: 'master',  src: '../img/incline push up.mp4',                link: 'chest-master.html'   },

  /* ── ABS ── */
  { name: 'Push Ups',                       detail: 'x12',   cat: 'Abs',   level: 'Rookie',  badge: 'rookie',  src: '../img/push-up.mp4',                        link: 'abs-rookie.html'     },
  { name: 'Sit Ups',                        detail: 'x12',   cat: 'Abs',   level: 'Rookie',  badge: 'rookie',  src: '../img/sit up.mp4',                         link: 'abs-rookie.html'     },
  { name: 'Decline Reverse Crunch',         detail: 'x12',   cat: 'Abs',   level: 'Rookie',  badge: 'rookie',  src: '../img/Decline Reverse Crunch.mp4',         link: 'abs-rookie.html'     },
  { name: 'Reverse Crunch on Bench',        detail: 'x12',   cat: 'Abs',   level: 'Rookie',  badge: 'rookie',  src: '../img/Reverse Crunch on the Bench.mp4',    link: 'abs-rookie.html'     },
  { name: 'Barbell Abs Strength',           detail: 'x17',   cat: 'Abs',   level: 'Veteran', badge: 'veteran', src: '../img/barbell.mp4',                        link: 'abs-veteran.html'    },
  { name: 'Barbell Incline Press',          detail: 'x17',   cat: 'Abs',   level: 'Veteran', badge: 'veteran', src: '../img/Barbell Incline Bench Press.mp4',    link: 'abs-veteran.html'    },
  { name: 'Barbell Bench Press',            detail: 'x30',   cat: 'Abs',   level: 'Master',  badge: 'master',  src: '../img/Barbell Bench Press.mp4',            link: 'abs-master.html'     },

  /* ── LEGS ── */
  { name: 'Air Squat',                      detail: 'x12',   cat: 'Legs',  level: 'Rookie',  badge: 'rookie',  src: '../img/Air Squat Exercise.mp4',              link: 'legs-rookie.html'    },
  { name: 'Pistol Squat',                   detail: 'x12',   cat: 'Legs',  level: 'Rookie',  badge: 'rookie',  src: '../img/Pistol Squat Exercise.mp4',           link: 'legs-rookie.html'    },
  { name: 'Forward Lunges Alternating',     detail: 'x12',   cat: 'Legs',  level: 'Rookie',  badge: 'rookie',  src: '../img/Forward Lunges Alternating Exercise.mp4', link: 'legs-rookie.html'},
  { name: 'Single-Leg Resistance Band Deadlift', detail: 'x12', cat: 'Legs', level: 'Rookie', badge: 'rookie', src: '../img/Single-Leg Resistance Band Deadlift.mp4', link: 'legs-rookie.html'},
  { name: 'Dumbbell Single Leg',            detail: 'x30',   cat: 'Legs',  level: 'Veteran', badge: 'veteran', src: '../img/Dumbbell Single-Leg.mp4',             link: 'legs-veteran.html'   },
  { name: 'Standing Hamstring Curl',        detail: 'x30',   cat: 'Legs',  level: 'Veteran', badge: 'veteran', src: '../img/Standing Harmstring Curl.mp4',        link: 'legs-veteran.html'   },
  { name: 'Unilateral Hip Thrust',          detail: 'x17',   cat: 'Legs',  level: 'Master',  badge: 'master',  src: '../img/Unilateral Hip Thrush.mp4',           link: 'legs-master.html'    },

  /* ── BACK & SHOULDER ── */
  { name: 'Side Bend Stretching',           detail: 'x12',   cat: 'Back & Shoulder', level: 'Rookie',  badge: 'rookie',  src: '../img/Side Bend Stretching.mp4',  link: 'back-shoulder-rookie.html'  },
  { name: 'Rolling Lat & Rear Deltoid',     detail: 'x12',   cat: 'Back & Shoulder', level: 'Rookie',  badge: 'rookie',  src: '../img/Rolling Lat and Rear Deltoid Exercise.mp4', link: 'back-shoulder-rookie.html' },
  { name: 'Lying Back Extension',           detail: 'x12',   cat: 'Back & Shoulder', level: 'Rookie',  badge: 'rookie',  src: '../img/Lying Back Extension Exercise.mp4', link: 'back-shoulder-rookie.html' },
  { name: 'Plank Shoulder Tap',             detail: 'x12',   cat: 'Back & Shoulder', level: 'Rookie',  badge: 'rookie',  src: '../img/Plank Shoulder Tap Exercise.mp4', link: 'back-shoulder-rookie.html' },
  { name: 'Band External Shoulder Rotation',detail: 'x12',   cat: 'Back & Shoulder', level: 'Rookie',  badge: 'rookie',  src: '../img/Band External Shoulder Rotation Exercise for Rotator Cuff.mp4', link: 'back-shoulder-rookie.html' },
  { name: 'Band Shoulder 90° Internal Rotation', detail: 'x19', cat: 'Back & Shoulder', level: 'Veteran', badge: 'veteran', src: '../img/Band Shoulder 90 Degrees Internal Rotation Exercise for Rotator Cuff.mp4', link: 'back-shoulder-veteran.html' },
  { name: 'Barbell Bench Pullover',         detail: 'x19',   cat: 'Back & Shoulder', level: 'Veteran', badge: 'veteran', src: '../img/Woman Doing Barbell Bench Pullover Exercise for Back and Chest.mp4', link: 'back-shoulder-veteran.html' },
  { name: 'Dumbbell Back Extension',        detail: 'x30',   cat: 'Back & Shoulder', level: 'Master',  badge: 'master',  src: '../img/Woman Doing Dumbbell Back Extension Exercise for Glute and Lower Back.mp4', link: 'back-shoulder-master.html' },
];

/* ── Plan index ── */
const PLAN_DATA = [
  { name: 'Chest Workout Plan',     link: 'plan_chest.html'         },
  { name: 'Abs Workout Plan',       link: 'plan_abs.html'           },
  { name: 'Legs Workout Plan',      link: 'plan_legs.html'          },
  { name: 'Back & Shoulder Plan',   link: 'plan_back_shoulder.html' },
  { name: 'Full Body Workout Plan', link: 'plan_fullbody.html'      },
];

/* ── DOM refs ── */
const overlay    = document.getElementById('searchOverlay');
const inputEl    = document.getElementById('searchInput');
const clearBtn   = document.getElementById('searchClear');
const resultsEl  = document.getElementById('searchResults');

/* ═══════════════════
   OPEN / CLOSE
   ═══════════════════ */
const pageBlur = document.getElementById('pageBlur');

function openSearch() {
  overlay.classList.add('open');
  if (pageBlur) pageBlur.classList.add('blurred');
  document.body.style.overflow = 'hidden';
  setTimeout(() => inputEl && inputEl.focus(), 160);
}

function closeSearch() {
  overlay.classList.remove('open');
  if (pageBlur) pageBlur.classList.remove('blurred');
  document.body.style.overflow = '';
  if (inputEl) inputEl.value = '';
  if (clearBtn) clearBtn.classList.remove('visible');
  showHint();
}

function clearSearch() {
  if (inputEl) { inputEl.value = ''; inputEl.focus(); }
  if (clearBtn) clearBtn.classList.remove('visible');
  showHint();
}

/* ═══════════════════
   RENDER STATES
   ═══════════════════ */
function showHint() {
  resultsEl.innerHTML = `
    <div class="search-hint">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <strong>Find any exercise</strong>
      Search by name, muscle group, or level
    </div>`;
}

function showNoResults(q) {
  resultsEl.innerHTML = `
    <div class="search-no-results">
      No results for <strong>"${escHtml(q)}"</strong><br>
      <span style="font-size:12px;opacity:0.6;margin-top:6px;display:block;">
        Try: push up, squat, chest, abs, legs…
      </span>
    </div>`;
}

/* ═══════════════════
   SEARCH ENGINE
   ═══════════════════ */
function runSearch(raw) {
  const q = raw.trim();
  if (!q) { showHint(); return; }

  const ql = q.toLowerCase();

  /* Match exercises */
  const matchedEx = SEARCH_DATA.filter(e =>
    e.name.toLowerCase().includes(ql) ||
    e.cat.toLowerCase().includes(ql)  ||
    e.level.toLowerCase().includes(ql)
  );

  /* Match plans */
  const matchedPlans = PLAN_DATA.filter(p =>
    p.name.toLowerCase().includes(ql) || 'plan'.includes(ql)
  );

  if (!matchedEx.length && !matchedPlans.length) {
    showNoResults(q);
    return;
  }

  let html = '';

  /* Plans section */
  if (matchedPlans.length) {
    html += `<div class="search-section-label">Workout Plans</div>`;
    matchedPlans.forEach(p => {
      html += `
        <a href="${p.link}" class="search-result-item">
          <div class="search-result-info">
            <div class="search-result-name">${hilite(p.name, ql)}</div>
            <div class="search-result-meta">
              <span class="search-result-badge plan">30-Day Plan</span>
            </div>
          </div>
          <svg class="search-result-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </a>`;
    });
  }

  /* Group exercises by category */
  const byCat = {};
  matchedEx.forEach(e => {
    if (!byCat[e.cat]) byCat[e.cat] = [];
    byCat[e.cat].push(e);
  });

  Object.entries(byCat).forEach(([cat, exs]) => {
    html += `<div class="search-section-label">${cat}</div>`;
    exs.forEach(e => {
      const thumb = e.src.endsWith('.mp4')
        ? `<video class="search-result-thumb" autoplay loop muted playsinline>
             <source src="${e.src}" type="video/mp4">
           </video>`
        : `<img class="search-result-thumb" src="${e.src}" alt="${escHtml(e.name)}">`;

      html += `
        <a href="${e.link}" class="search-result-item">
          ${thumb}
          <div class="search-result-info">
            <div class="search-result-name">${hilite(e.name, ql)}</div>
            <div class="search-result-meta">
              <span class="search-result-badge ${e.badge}">${e.level}</span>
              <span class="search-result-detail">${e.detail}</span>
            </div>
          </div>
          <svg class="search-result-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </a>`;
    });
  });

  resultsEl.innerHTML = html;
}

/* ── Highlight matching text in result name ── */
function hilite(text, q) {
  if (!q) return escHtml(text);
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escHtml(text).replace(re,
    '<mark style="background:#5EEAD4;color:#0A2540;border-radius:3px;padding:0 2px;font-weight:700;">$1</mark>'
  );
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ═══════════════════
   EVENTS
   ═══════════════════ */
if (inputEl) {
  inputEl.addEventListener('input', () => {
    const v = inputEl.value;
    clearBtn && clearBtn.classList.toggle('visible', v.length > 0);
    runSearch(v);
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', clearSearch);
}

/* Escape key closes overlay */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
});

showHint();