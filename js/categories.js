/* ─────────────────────────────────────────
   categories.js  –  horizontal plan carousel + category filter + search
   ───────────────────────────────────────── */

/* ══════════════════════════════════════════
   HORIZONTAL PLAN CARD CAROUSEL
   ══════════════════════════════════════════ */

const TOTAL_SLIDES = 3;
let currentSlide   = 0;

/* Drag state */
let pointerStartX  = 0;
let pointerStartY  = 0;
let pointerCurrent = 0;
let isDragging     = false;
let hasMoved       = false;   /* true once finger moved > threshold */
const DRAG_THRESHOLD = 8;     /* px before we lock into horizontal drag */
const SNAP_THRESHOLD = 0.25;  /* fraction of slide width to trigger slide change */


function getTrack() { return document.getElementById('plansTrack'); }
function getWrap()  { return document.querySelector('.plans-slider-wrap'); }
function getSlideWidth() {
    const w = getWrap();
    return w ? w.clientWidth : window.innerWidth;
}

/* ── Move track to a slide with optional animation ── */
function goToSlide(index, animate) {
    animate = animate !== false;
    index   = Math.max(0, Math.min(TOTAL_SLIDES - 1, index));
    currentSlide = index;

    const track = getTrack();
    if (!track) return;

    track.style.transition = animate
        ? 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none';
    track.style.transform = `translateX(-${index * getSlideWidth()}px)`;

    document.querySelectorAll('.plan-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

/* ── Move track live during drag (no transition) ── */
function applyLiveDrag(delta) {
    const track = getTrack();
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform  = `translateX(${-(currentSlide * getSlideWidth()) + delta}px)`;
}

/* ── Decide snap on pointer release ── */
function snapOnRelease(totalDeltaX) {
    const sw = getSlideWidth();
    if (totalDeltaX < -(sw * SNAP_THRESHOLD)) {
        goToSlide(currentSlide + 1);   // swiped left → next
    } else if (totalDeltaX > (sw * SNAP_THRESHOLD)) {
        goToSlide(currentSlide - 1);   // swiped right → prev
    } else {
        goToSlide(currentSlide);       // snap back
    }
}

/* ══════════════════════════════
   TOUCH EVENTS
   ══════════════════════════════ */
function onTouchStart(e) {
    const t      = e.touches[0];
    pointerStartX  = t.clientX;
    pointerStartY  = t.clientY;
    pointerCurrent = t.clientX;
    isDragging     = true;
    hasMoved       = false;
}

function onTouchMove(e) {
    if (!isDragging) return;
    const t      = e.touches[0];
    const dx     = t.clientX - pointerStartX;
    const dy     = t.clientY - pointerStartY;
    pointerCurrent = t.clientX;

    /* Once we know which axis the user intends, lock in */
    if (!hasMoved) {
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
        if (Math.abs(dy) > Math.abs(dx)) {
            /* Primarily vertical — hand control back to page scroll */
            isDragging = false;
            return;
        }
        hasMoved = true;
    }

    /* Prevent page scroll while swiping the carousel */
    e.preventDefault();
    applyLiveDrag(dx);
}

function onTouchEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    if (hasMoved) {
        /* Dragged: snap to correct slide, prevent the tap from navigating */
        const dx = (e.changedTouches[0]?.clientX ?? pointerCurrent) - pointerStartX;
        snapOnRelease(dx);
        /* Block the subsequent click that the browser fires after touchend */
        getWrap().addEventListener('click', absorbClick, { once: true, capture: true });
    }
    hasMoved = false;
}

/* Swallow one click event after a drag so link doesn't navigate */
function absorbClick(e) {
    e.preventDefault();
    e.stopPropagation();
}

/* ══════════════════════════════
   MOUSE EVENTS (desktop)
   ══════════════════════════════ */
function onMouseDown(e) {
    /* only main button */
    if (e.button !== 0) return;
    pointerStartX  = e.clientX;
    pointerCurrent = e.clientX;
    isDragging     = true;
    hasMoved       = false;
    getWrap().style.cursor = 'grabbing';
    /* Prevent text selection while dragging */
    e.preventDefault();
}

function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - pointerStartX;
    pointerCurrent = e.clientX;
    if (!hasMoved && Math.abs(dx) > DRAG_THRESHOLD) hasMoved = true;
    if (hasMoved) applyLiveDrag(dx);
}

function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    getWrap().style.cursor = 'grab';

    if (hasMoved) {
        const dx = e.clientX - pointerStartX;
        snapOnRelease(dx);
        /* block click on links after a mouse drag */
        getWrap().addEventListener('click', absorbClick, { once: true, capture: true });
    }
    hasMoved = false;
}

/* ══════════════════════════════
   MOUSE WHEEL (horizontal)
   ══════════════════════════════ */
let wheelCooldown = false;
function onWheel(e) {
    if (wheelCooldown) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 10) return;
    e.preventDefault();
    wheelCooldown = true;
    setTimeout(() => { wheelCooldown = false; }, 500);
    goToSlide(delta > 0 ? currentSlide + 1 : currentSlide - 1);
}

/* ══════════════════════════════
   INIT CAROUSEL
   ══════════════════════════════ */
function initCarousel() {
    const wrap = getWrap();
    if (!wrap) return;

    wrap.style.cursor = 'grab';

    /* touch — passive:false on move so we can preventDefault */
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove',  onTouchMove,  { passive: false });
    wrap.addEventListener('touchend',   onTouchEnd,   { passive: true });
    wrap.addEventListener('touchcancel', () => { isDragging = false; hasMoved = false; goToSlide(currentSlide); });

    /* mouse */
    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    /* wheel */
    wrap.addEventListener('wheel', onWheel, { passive: false });

    /* resize: re-snap without animation */
    window.addEventListener('resize', () => goToSlide(currentSlide, false));

    /* set initial position */
    goToSlide(0, false);
}


/* ══════════════════════════════════════════
   CATEGORY FILTER + SEARCH
   ══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async function () {

    // Auth guard — mirrors homepage.js
    const { data: { session } } = await gym.auth.getSession();
    if (!session) { window.location.href = "../gym.html"; return; }

    initCarousel();

    const buttons     = document.querySelectorAll('.cat-btn');
    const items       = document.querySelectorAll('.category-item');
    const searchInput = document.querySelector('.search-bar');

    function showCategory(category) {
        items.forEach(item => {
            item.style.display =
                item.getAttribute('data-category') === category ? 'flex' : 'none';
        });
    }

    function setActiveBtn(filter) {
        buttons.forEach(b => b.classList.remove('active'));
        const t = document.querySelector(`[data-filter="${filter}"]`);
        if (t) t.classList.add('active');
    }

    showCategory('chest');
    setActiveBtn('chest');

    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');
            setActiveBtn(filter);
            showCategory(filter);
            if (searchInput) searchInput.value = '';
        });
    });

    if (searchInput) {
        searchInput.addEventListener('keyup', function () {
            const value = this.value.toLowerCase().trim();
            if (value === '') {
                showCategory('chest');
                setActiveBtn('chest');
                return;
            }
            buttons.forEach(b => b.classList.remove('active'));
            items.forEach(item => {
                const text     = item.innerText.toLowerCase();
                const category = item.dataset.category;
                if (text.includes(value)) {
                    item.style.display = 'flex';
                    buttons.forEach(btn => {
                        if (btn.dataset.filter === category) btn.classList.add('active');
                    });
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    /* bottom nav active state */
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(navItem => {
        const page = navItem.getAttribute('data-page');
        if (!page) return;
        const isActive =
            (page === 'training' && currentPage === 'homepage.html') ||
            (page === 'reports'  && currentPage === 'report.html')   ||
            (page === 'account'  && currentPage === 'profile.html');
        navItem.classList.toggle('active', isActive);
    });

});