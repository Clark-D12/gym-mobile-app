/* ═══════════════════════════════════════════
   workout.js  –  Fit Buddy workout detail page
   - Intercepts START button
   - Runs through exercises with a timer
   - On completion: saves to Supabase workout_logs,
     updates streak + max_streak in public.users
   ═══════════════════════════════════════════ */

// ── BACK / HOME NAVIGATION ──
function goHome() {
    window.location.href = "homepage.html";
}

// ── SUPABASE ──
const SUPA_URL = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const SUPA_KEY = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(SUPA_URL, SUPA_KEY);

/* ══════════════════════════════════════════
   READ WORKOUT INFO FROM THE PAGE
   ══════════════════════════════════════════ */
function getWorkoutInfo() {
    const h1  = document.querySelector('#workout-content h1');
    const name = h1 ? h1.textContent.trim() : document.title.replace('– Fit Buddy', '').trim();

    const levels     = ['Rookie', 'Veteran', 'Master'];
    const categories = ['Chest', 'Abs', 'Legs', 'Back & Shoulder', 'Full Body'];

    let level    = levels.find(l => name.includes(l))     || 'Rookie';
    let category = categories.find(c => name.includes(c)) || 'General';

    const statH3 = document.querySelectorAll('.stat-box h3');
    let duration = 10;
    statH3.forEach(el => {
        const match = el.textContent.match(/(\d+)\s*min/);
        if (match) duration = parseInt(match[1]);
    });

    return { name, category, level, duration };
}

/* ══════════════════════════════════════════
   SAVE WORKOUT TO SUPABASE
   — current streak can reset on missed days
   — max_streak only ever goes UP, never resets
   ══════════════════════════════════════════ */
async function saveWorkoutToSupabase(info) {
    const { data: { session } } = await gym.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const today  = new Date().toISOString().split('T')[0];

    // 1. Load current user data (includes weight for BMI tracking)
    const { data: userData } = await gym
        .from('users')
        .select('streak, max_streak, last_workout_date, workouts_completed, weight')
        .eq('id', userId)
        .single();

    // 2. Insert workout log — save weight so BMI chart can track over time
    await gym.from('workout_logs').insert({
        user_id:      userId,
        workout:      info.name,
        category:     info.category,
        level:        info.level,
        duration:     info.duration,
        completed_at: new Date().toISOString(),
        weight:       userData?.weight || null
    });

    let streak    = userData?.streak              || 0;
    let maxStreak = userData?.max_streak          || 0;
    const last    = userData?.last_workout_date;
    const done    = userData?.workouts_completed  || 0;

    // 3. Update current streak (resets if a day was missed)
    if (last !== today) {
        const diffDays = last
            ? Math.floor((new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24))
            : 999;
        streak = diffDays <= 1 ? streak + 1 : 1;
    }

    // 4. max_streak only ever goes UP — achievements are permanent
    if (streak > maxStreak) {
        maxStreak = streak;
    }

    // 5. Save back to public.users
    await gym.from('users')
        .update({
            streak:             streak,
            max_streak:         maxStreak,
            last_workout_date:  today,
            workouts_completed: done + 1
        })
        .eq('id', userId);

    console.log(` Workout saved: ${info.name} | Streak: ${streak} | Best ever: ${maxStreak}`);
}

/* ══════════════════════════════════════════
   WORKOUT SESSION UI
   ══════════════════════════════════════════ */
function buildSessionOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'workoutSession';
    overlay.innerHTML = `
      <div class="session-box">
        <div class="session-header">
          <span id="sessionTitle">Get Ready!</span>
          <button class="session-close" id="sessionClose">✕</button>
        </div>
        <div class="session-exercise">
          <video id="sessionVideo" class="session-video" autoplay loop muted playsinline></video>
        </div>
        <div class="session-name" id="sessionName">–</div>
        <div class="session-detail" id="sessionDetail">–</div>
        <div class="session-timer" id="sessionTimer">–</div>
        <div class="session-progress">
          <div class="session-progress-fill" id="sessionProgressFill"></div>
        </div>
        <div class="session-nav">
          <button class="session-btn secondary" id="sessionPrev">‹ Prev</button>
          <button class="session-btn primary"   id="sessionNext">Next ›</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
}

/* ══════════════════════════════════════════
   SESSION LOGIC
   ══════════════════════════════════════════ */
let sessionTimer = null;

function startSession(exercises) {
    const overlay = buildSessionOverlay();
    overlay.classList.add('open');

    let current = 0;
    let timeLeft = 0;

    const titleEl  = document.getElementById('sessionTitle');
    const nameEl   = document.getElementById('sessionName');
    const detailEl = document.getElementById('sessionDetail');
    const timerEl  = document.getElementById('sessionTimer');
    const videoEl  = document.getElementById('sessionVideo');
    const fillEl   = document.getElementById('sessionProgressFill');
    const nextBtn  = document.getElementById('sessionNext');
    const prevBtn  = document.getElementById('sessionPrev');
    const closeBtn = document.getElementById('sessionClose');

    function loadExercise(index) {
        clearInterval(sessionTimer);
        const ex = exercises[index];
        if (!ex) return;

        titleEl.textContent  = `Exercise ${index + 1} / ${exercises.length}`;
        nameEl.textContent   = ex.name;
        detailEl.textContent = ex.detail;

        videoEl.src = ex.src;
        videoEl.load();
        videoEl.play().catch(() => {});

        fillEl.style.width  = `${((index + 1) / exercises.length) * 100}%`;
        prevBtn.disabled    = index === 0;
        nextBtn.textContent = index === exercises.length - 1 ? 'Finish ✓' : 'Next ›';

        const timeMatch = ex.detail.match(/^(\d+):(\d+)$/);
        if (timeMatch) {
            timeLeft = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
            timerEl.textContent = ex.detail;
            timerEl.style.color = '#5EEAD4';

            sessionTimer = setInterval(() => {
                timeLeft--;
                const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
                const s = String(timeLeft % 60).padStart(2, '0');
                timerEl.textContent = `${m}:${s}`;
                if (timeLeft <= 0) {
                    clearInterval(sessionTimer);
                    timerEl.textContent = 'Done!';
                }
            }, 1000);
        } else {
            timerEl.textContent = ex.detail;
            timerEl.style.color = '#fff';
        }
    }

    function closeSession(completed) {
        clearInterval(sessionTimer);
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
        if (completed) {
            showCompletionToast();
            const info = getWorkoutInfo();
            saveWorkoutToSupabase(info);
        }
    }

    function showCompletionToast() {
        const toast = document.createElement('div');
        toast.className = 'workout-toast';
        toast.innerHTML = `🎉 Workout Complete! Streak updated.`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    nextBtn.addEventListener('click', () => {
        if (current < exercises.length - 1) {
            current++;
            loadExercise(current);
        } else {
            closeSession(true);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (current > 0) { current--; loadExercise(current); }
    });

    closeBtn.addEventListener('click', () => closeSession(false));

    loadExercise(0);
}

/* ══════════════════════════════════════════
   COLLECT EXERCISES FROM THE PAGE
   ══════════════════════════════════════════ */
function collectExercises() {
    const items = document.querySelectorAll('.exercise-item');
    const exs   = [];
    items.forEach(item => {
        const video  = item.querySelector('video source');
        const name   = item.querySelector('p')?.textContent?.trim()    || '–';
        const detail = item.querySelector('span')?.textContent?.trim() || '–';
        const src    = video ? video.getAttribute('src') : '';
        exs.push({ name, detail, src });
    });
    return exs;
}

/* ══════════════════════════════════════════
   HOOK START BUTTON
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.querySelector('.start-btn');
    if (!startBtn) return;
    startBtn.addEventListener('click', () => {
        const exercises = collectExercises();
        if (exercises.length === 0) return;
        startSession(exercises);
    });
});