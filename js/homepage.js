/* ═══════════════════════════════════════════
   homepage.js  –  Fit Buddy homepage
   Supabase integration using public.users table
   ═══════════════════════════════════════════ */

// ── SUPABASE ──
const SUPA_URL = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const SUPA_KEY = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
var gym = window.supabase.createClient(SUPA_URL, SUPA_KEY);

/* ══════════════════════════════════════════
   1. AUTH GUARD — redirect if not logged in
   ══════════════════════════════════════════ */
async function checkAuth() {
    const { data: { session } } = await gym.auth.getSession();
    if (!session) {
        window.location.href = "../gym.html";
        return null;
    }
    return session.user;
}

/* ══════════════════════════════════════════
   2. LOAD USER FROM public.users
   ══════════════════════════════════════════ */
async function loadUser(userId) {
    const { data, error } = await gym
        .from('users')
        .select('username, streak, max_streak, last_workout_date, workouts_completed')
        .eq('id', userId)
        .single();

    if (error || !data) {
        // Fallback: get username from auth metadata
        const { data: { user } } = await gym.auth.getUser();
        return {
            username:            user.user_metadata?.username || user.email?.split('@')[0] || 'Athlete',
            streak:              0,
            last_workout_date:   null,
            workouts_completed:  0
        };
    }
    return data;
}

/* ══════════════════════════════════════════
   3. STREAK LOGIC
   ══════════════════════════════════════════ */
function calcCurrentStreak(userData) {
    const today = new Date().toISOString().split('T')[0];
    const last  = userData.last_workout_date;
    const saved = userData.streak || 0;

    if (!last) return saved;

    const diffDays = Math.floor(
        (new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24)
    );

    // Missed more than 1 day — streak broken
    if (diffDays > 1) return 0;

    return saved;
}

/* ══════════════════════════════════════════
   4. RENDER STREAK CIRCLES
   ══════════════════════════════════════════ */
function renderStreak(streakDays) {
    const milestones = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    const track = document.querySelector('.streak-track');
    if (!track) return;

    track.innerHTML = '';

    let currentSet = false;

    milestones.forEach(day => {
        const circle = document.createElement('div');
        circle.className = 'streak-circle';
        circle.textContent = day;

        if (streakDays >= day) {
            // Completed milestone
            circle.classList.add('done');
        } else if (!currentSet) {
            // First uncompleted = current target
            circle.classList.add('current');
            currentSet = true;
        }

        track.appendChild(circle);
    });
}

/* ══════════════════════════════════════════
   5. SHOW USERNAME
   ══════════════════════════════════════════ */
function showUsername(username) {
    const el = document.getElementById('welcomeUser');
    if (el) el.textContent = `Hi, ${username} 👋`;
}

/* ══════════════════════════════════════════
   6. SAVE WORKOUT — called from workout pages
   window.logWorkout(name, category, level, durationMins)
   ══════════════════════════════════════════ */
async function saveWorkout(workoutName, category, level, durationMins) {
    const { data: { user } } = await gym.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Insert into workout_logs
    const { error: logError } = await gym
        .from('workout_logs')
        .insert({
            user_id:      user.id,
            workout:      workoutName,
            category:     category,
            level:        level,
            duration:     durationMins,
            completed_at: new Date().toISOString()
        });

    if (logError) console.error('Log error:', logError.message);

    // Load current user data
    const userData = await loadUser(user.id);
    const last     = userData.last_workout_date;
    let   streak   = userData.streak     || 0;
    let   maxStreak = userData.max_streak || 0;

    // Update streak
    if (last === today) {
        // Already worked out today — no streak change
    } else {
        const diffDays = last
            ? Math.floor((new Date(today) - new Date(last)) / (1000 * 60 * 60 * 24))
            : 999;
        streak = diffDays <= 1 ? streak + 1 : 1;
    }

    // max_streak only ever goes UP — never resets
    if (streak > maxStreak) {
        maxStreak = streak;
    }

    // Update public.users
    const { error: updateError } = await gym
        .from('users')
        .update({
            streak:             streak,
            max_streak:         maxStreak,
            last_workout_date:  today,
            workouts_completed: (userData.workouts_completed || 0) + 1
        })
        .eq('id', user.id);

    if (updateError) console.error('Update error:', updateError.message);
}

// Expose globally so workout pages can call it
window.logWorkout = saveWorkout;

/* ══════════════════════════════════════════
   7. INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    // Auth guard
    const user = await checkAuth();
    if (!user) return;

    // Load user data from public.users
    const userData = await loadUser(user.id);

    // Show username
    showUsername(userData.username);

    // Calculate and render streak
    const streak = calcCurrentStreak(userData);
    renderStreak(streak);
});