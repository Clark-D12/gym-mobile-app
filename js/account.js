/* ═══════════════════════════════════════════
   account.js  –  Fit Buddy Profile / Account page
   Supabase integration:
   - Auth guard + load real user data
   - Display username & name in header
   - Save username + password changes
   - Dynamically unlock achievements
   - Reminder toggle (persisted to localStorage)
   - Logout
   ═══════════════════════════════════════════ */

// ── SUPABASE ──
const SUPA_URL = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const SUPA_KEY = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(SUPA_URL, SUPA_KEY);

/* ══════════════════════════════════════════
   TOAST HELPER
   ══════════════════════════════════════════ */
function showToast(msg, isError = false) {
    const existing = document.querySelector('.profile-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'profile-toast' + (isError ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

/* ══════════════════════════════════════════
   AUTH GUARD
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
   LOAD USER PROFILE
   ══════════════════════════════════════════ */
async function loadProfile(userId) {
    const { data, error } = await gym
        .from('users')
        .select('username, streak, max_streak, workouts_completed')
        .eq('id', userId)
        .single();

    if (error || !data) {
        // Fallback to auth metadata
        const { data: { user } } = await gym.auth.getUser();
        return {
            username:           user.user_metadata?.username || user.email?.split('@')[0] || 'Athlete',
            streak:             0,
            max_streak:         0,
            workouts_completed: 0
        };
    }
    return data;
}

/* ══════════════════════════════════════════
   RENDER HEADER
   ══════════════════════════════════════════ */
function renderHeader(username) {
    const nameEl = document.querySelector('.profile-header h2');
    if (nameEl) nameEl.textContent = username;

    // Also pre-fill the username input
    const input = document.getElementById('newUsername');
    if (input) input.value = username;
}

/* ══════════════════════════════════════════
   ACHIEVEMENTS — unlock based on real data
   - Day badges  → use max_streak (best streak ever)
     so they stay unlocked even if the user misses a day
   - Exercise badges → use workouts_completed (cumulative, never resets)
   ══════════════════════════════════════════ */
const DAY_MILESTONES      = [3,7,15,25,30,40,50,65,70,80,85,90,95,100];
const EXERCISE_MILESTONES = [3,7,20,50,65,80,100,120,150,180,200,230,280,300,330,350,400,480,500];

function renderAchievements(streak, workoutsCompleted) {
    // Day badges
    document.querySelectorAll('.ach-item[data-type="day"]').forEach(item => {
        const target = parseInt(item.dataset.target);
        if (streak >= target) {
            item.classList.add('unlocked');
        } else {
            item.classList.remove('unlocked');
        }
    });

    // Exercise badges
    document.querySelectorAll('.ach-item[data-type="exercise"]').forEach(item => {
        const target = parseInt(item.dataset.target);
        if (workoutsCompleted >= target) {
            item.classList.add('unlocked');
        } else {
            item.classList.remove('unlocked');
        }
    });
}

/* ══════════════════════════════════════════
   MY PROFILE — OPEN / CLOSE
   ══════════════════════════════════════════ */
function openSetting(name) {
    if (name !== "My Profile") return;

    document.getElementById("settingsPage").style.display  = "none";
    document.getElementById("settingsCard2").style.display = "none";
    document.getElementById("myProfilePage").style.display = "block";

    document.querySelectorAll(".section-label").forEach(el => el.style.display = "none");
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) logoutBtn.style.display = "none";
}

function goBack() {
    document.getElementById("settingsPage").style.display  = "block";
    document.getElementById("settingsCard2").style.display = "block";
    document.getElementById("myProfilePage").style.display = "none";

    document.querySelectorAll(".section-label").forEach(el => el.style.display = "");
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) logoutBtn.style.display = "";

    // Clear password fields on cancel
    document.getElementById('password').value        = '';
    document.getElementById('confirmPassword').value = '';
}

/* ══════════════════════════════════════════
   SAVE PROFILE CHANGES
   ══════════════════════════════════════════ */
async function saveProfile() {
    const saveBtn = document.querySelector('.save');
    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('password').value;
    const confirmPwd  = document.getElementById('confirmPassword').value;

    // Validate
    if (!newUsername) {
        showToast('Username cannot be empty.', true);
        return;
    }

    if (newPassword && newPassword !== confirmPwd) {
        showToast('Passwords do not match.', true);
        return;
    }

    if (newPassword && newPassword.length < 6) {
        showToast('Password must be at least 6 characters.', true);
        return;
    }

    // Loading state
    saveBtn.textContent = 'Saving…';
    saveBtn.disabled = true;

    try {
        const { data: { session } } = await gym.auth.getSession();
        if (!session) { window.location.href = "../gym.html"; return; }

        const userId = session.user.id;
        let hasError = false;

        // 1. Update username in public.users
        const { error: dbError } = await gym
            .from('users')
            .update({ username: newUsername })
            .eq('id', userId);

        if (dbError) {
            showToast('Failed to update username.', true);
            hasError = true;
        }

        // 2. Update password if provided
        if (!hasError && newPassword) {
            const { error: pwdError } = await gym.auth.updateUser({ password: newPassword });
            if (pwdError) {
                showToast('Failed to update password: ' + pwdError.message, true);
                hasError = true;
            }
        }

        if (!hasError) {
            // Update header name
            renderHeader(newUsername);

            // Clear password fields
            document.getElementById('password').value        = '';
            document.getElementById('confirmPassword').value = '';

            showToast('✅ Profile updated successfully!');
            setTimeout(() => goBack(), 1200);
        }

    } catch (err) {
        showToast('Something went wrong. Try again.', true);
    } finally {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
    }
}

/* ══════════════════════════════════════════
   TOGGLE PASSWORD (eye icon)
   ══════════════════════════════════════════ */
function togglePassword(id, icon) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        icon.src   = "../img/eye-regular-full.svg";
    } else {
        input.type = "password";
        icon.src   = "../img/eye-slash-solid-full.svg";
    }
}

/* ══════════════════════════════════════════
   REMINDER (persisted via localStorage)
   ══════════════════════════════════════════ */


function toggleReminderClose(event, btn) {
    event.stopPropagation();
    const reminder = btn.closest('.reminder-card');
    if (reminder) reminder.style.display = 'none';
}

function enableReminder() {
    const card = document.querySelector('.reminder-card');

    // Call the Android native bridge
    if (typeof Android !== 'undefined' && Android.enableReminder) {
        Android.enableReminder();
        localStorage.setItem('fitbuddy_reminder', 'true');
        if (card) card.style.display = 'none';
        showToast('🔔 Reminder set for 8:00 AM daily!');
        updateReminderRow();
    } else {
        // Fallback for testing in browser
        localStorage.setItem('fitbuddy_reminder', 'true');
        if (card) card.style.display = 'none';
        showToast('🔔 Reminder enabled!');
        updateReminderRow();
    }
}

function disableReminder() {
    if (typeof Android !== 'undefined' && Android.disableReminder) {
        Android.disableReminder();
    }
    localStorage.removeItem('fitbuddy_reminder');
    updateReminderRow();
    showToast('🔕 Reminder disabled.');
}

function updateReminderRow() {
    const enabled = localStorage.getItem('fitbuddy_reminder') === 'true';
    const row = document.querySelector('.reminder-row');
    if (!row) return;
    const label = row.querySelector('.setting-left span');
    if (label) label.textContent = enabled ? 'Reminder (On)' : 'Reminder';
}

function toggleReminder(row) {
    const reminder = row.querySelector('.reminder-card');
    if (!reminder) return;

    const isOpen = reminder.style.display === 'block';

    // Always update card content to reflect current state before showing
    const enabled  = localStorage.getItem('fitbuddy_reminder') === 'true';
    const q        = document.getElementById('reminderQuestion');
    const yesBtn   = document.getElementById('reminderYesBtn');
    const noBtn    = document.getElementById('reminderNoBtn');

    if (enabled) {
        // Reminder is currently ON — offer to turn it off
        if (q)      q.textContent      = '🔔 Your daily reminder is ON at 8 AM.';
        if (yesBtn) {
            yesBtn.textContent = 'Keep On';
            yesBtn.onclick = (e) => {
                e.stopPropagation();
                reminder.style.display = 'none';
            };
        }
        if (noBtn) {
            noBtn.textContent  = 'Turn Off';
            noBtn.style.background = '#fee2e2';
            noBtn.style.color      = '#ef4444';
            noBtn.onclick = (e) => {
                e.stopPropagation();
                disableReminder();
                reminder.style.display = 'none';
            };
        }
    } else {
        // Reminder is currently OFF — offer to enable
        if (q)      q.textContent      = 'Enable daily workout reminder at 8 AM?';
        if (yesBtn) {
            yesBtn.textContent = 'Yes, Enable';
            yesBtn.onclick = (e) => {
                e.stopPropagation();
                enableReminder();
            };
        }
        if (noBtn) {
            noBtn.textContent  = 'No';
            noBtn.style.background = '';
            noBtn.style.color      = '';
            noBtn.onclick = (e) => toggleReminderClose(e, noBtn);
        }
    }

    reminder.style.display = isOpen ? 'none' : 'block';
}

/* ══════════════════════════════════════════
   ACHIEVEMENTS MODAL
   ══════════════════════════════════════════ */
function openAchievements() {
    document.getElementById("achievementsModal").style.display = "flex";
}
function closeAchievements() {
    document.getElementById("achievementsModal").style.display = "none";
}

/* ══════════════════════════════════════════
   LOGOUT MODAL
   ══════════════════════════════════════════ */
function openLogout() {
    document.getElementById("logoutModal").style.display = "flex";
}
function closeLogout() {
    document.getElementById("logoutModal").style.display = "none";
}
async function confirmLogout() {
    await gym.auth.signOut();
    window.location.href = "../gym.html";
}

/* ══════════════════════════════════════════
   INIT
   ══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

    // Auth guard
    const user = await checkAuth();
    if (!user) return;

    // Load profile data
    const profile = await loadProfile(user.id);

    // Render header with real username
    renderHeader(profile.username);

    // Unlock achievements — use max_streak so earned badges are never lost
    renderAchievements(profile.max_streak || 0, profile.workouts_completed || 0);

    // Update reminder label
    updateReminderRow();

    // Hook Save button
    const saveBtn = document.querySelector('.save');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
});

/* ══════════════════════════════════════════
   SUPPORT PAGE NAVIGATION
   ══════════════════════════════════════════ */
function openRateUs()   { window.location.href = 'rateus.html';   }
function openFeedback() { window.location.href = 'feedback.html'; }
function openFAQs()     { window.location.href = 'faqs.html';     }