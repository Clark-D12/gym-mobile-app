/* ═══════════════════════════════════════════
   report.js  –  Fit Buddy Reports page
   Loads real data from Supabase per account:
   - Workout count, total minutes, streak
   - BMI from user profile (height/weight)
   - Weight progress chart
   - Workout logs modal
   ═══════════════════════════════════════════ */

// ── SUPABASE ──
const SUPA_URL = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const SUPA_KEY = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(SUPA_URL, SUPA_KEY);

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
async function loadUserProfile(userId) {
    const { data } = await gym
        .from('users')
        .select('username, streak, max_streak, height, weight, workouts_completed')
        .eq('id', userId)
        .single();
    return data || {};
}

/* ══════════════════════════════════════════
   LOAD WORKOUT LOGS
   ══════════════════════════════════════════ */
async function loadWorkoutLogs(userId) {
    const { data } = await gym
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
    return data || [];
}

/* ══════════════════════════════════════════
   BMI CALCULATION + UI
   ══════════════════════════════════════════ */
function calcBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const hm = heightCm / 100;
    return parseFloat((weightKg / (hm * hm)).toFixed(1));
}

function updateBMI(bmi) {
    const pointer  = document.getElementById('bmiPointer');
    const category = document.getElementById('bmiCategory');
    const badge    = document.getElementById('bmiCategoryBadge');
    const dot      = document.getElementById('statusDot');
    const valueEl  = document.getElementById('bmiValue');
    if (!pointer) return;

    // Position pointer — matches the 7 bar segments exactly
    // HTML bar flex: 1, 2.5, 6.5, 5, 5, 5, 5 = total 30
    // BMI ranges:   15-16, 16-18.5, 18.5-25, 25-28, 28-32, 32-36, 36-40
    const bmiSegments = [
        { start: 15,   end: 16,   flex: 1   },
        { start: 16,   end: 18.5, flex: 2.5 },
        { start: 18.5, end: 25,   flex: 6.5 },
        { start: 25,   end: 28,   flex: 5   },
        { start: 28,   end: 32,   flex: 5   },
        { start: 32,   end: 36,   flex: 5   },
        { start: 36,   end: 40,   flex: 5   },
    ];
    const totalFlex = bmiSegments.reduce((s, sg) => s + sg.flex, 0); // 30
    const clampedBmi = Math.max(15, Math.min(40, bmi));
    let cumFlex = 0;
    let percent = 0;
    for (const sg of bmiSegments) {
        if (clampedBmi <= sg.end) {
            const fracInSeg = (clampedBmi - sg.start) / (sg.end - sg.start);
            percent = ((cumFlex + fracInSeg * sg.flex) / totalFlex) * 100;
            break;
        }
        cumFlex += sg.flex;
    }
    pointer.style.left = Math.max(0, Math.min(100, percent)) + '%';

    // Show BMI number
    if (valueEl) valueEl.textContent = bmi;

    // Category + color
    let label, color, bg;
    if (bmi < 16) {
        label = 'Severely Underweight'; color = '#004a99'; bg = '#e3eeff';
    } else if (bmi < 18.5) {
        label = 'Underweight';          color = '#0E7490'; bg = '#e0f7f4';
    } else if (bmi < 25) {
        label = 'Healthy';              color = '#15803d'; bg = '#dcfce7';
    } else if (bmi < 30) {
        label = 'Overweight';           color = '#b45309'; bg = '#fef3c7';
    } else {
        label = 'Obese';                color = '#dc2626'; bg = '#fee2e2';
    }

    if (category) category.textContent = label;
    if (dot)      dot.style.backgroundColor = color;
    if (badge) {
        badge.textContent = label;
        badge.style.background = bg;
        badge.style.color = color;
    }
}

/* ══════════════════════════════════════════
   STREAK CIRCLES (report page version)
   ══════════════════════════════════════════ */
function renderStreakCircles(streakDays) {
    const container = document.getElementById('streakTrack');
    if (!container) return;

    const milestones = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];
    container.innerHTML = '';

    let currentSet = false;

    milestones.forEach(day => {
        const circle = document.createElement('div');
        circle.className = 'streak-circle';
        circle.textContent = day;

        if (streakDays >= day) {
            circle.classList.add('done');
        } else if (!currentSet) {
            circle.classList.add('current');
            currentSet = true;
        }

        container.appendChild(circle);
    });
}

/* ══════════════════════════════════════════
   PROGRESS CHART (BMI over time from logs)
   ══════════════════════════════════════════ */
function renderChart(logs, currentWeight, currentHeight) {
    if (typeof Chart === 'undefined') return;

    const canvas = document.getElementById('progressChart');
    if (!canvas) return;

    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const days  = new Date(year, month + 1, 0).getDate();

    // Build a BMI-per-day map for the current month using log weight + stored height
    const bmiByDay = {};
    logs.forEach(log => {
        const d = new Date(log.completed_at);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const w = log.weight || currentWeight;
            const h = currentHeight;
            if (w && h) {
                const hm = h / 100;
                const bmi = parseFloat((w / (hm * hm)).toFixed(1));
                const day = d.getDate();
                // Keep the last entry for the day
                bmiByDay[day] = bmi;
            }
        }
    });

    // If no log data, seed today with the current BMI
    if (Object.keys(bmiByDay).length === 0 && currentWeight && currentHeight) {
        const hm = currentHeight / 100;
        bmiByDay[now.getDate()] = parseFloat((currentWeight / (hm * hm)).toFixed(1));
    }

    // Build labels + data; null for days with no data
    const labels = Array.from({ length: days }, (_, i) => i + 1);
    const data   = labels.map(d => bmiByDay[d] ?? null);

    // Scrollable canvas — 28px per day fits all phones cleanly
    const scroller = document.getElementById('chartScroll') || canvas.parentElement;
    const dayWidth = 28;
    canvas.style.width  = (days * dayWidth) + 'px';
    canvas.style.height = '100%';
    canvas.width        = days * dayWidth * (window.devicePixelRatio || 1);

    const ctx = canvas.getContext('2d');
    if (window._reportChart) window._reportChart.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 180);
    gradient.addColorStop(0, 'rgba(14,116,144,0.35)');
    gradient.addColorStop(1, 'rgba(14,116,144,0)');

    window._reportChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'BMI',
                data,
                borderColor: '#0E7490',
                borderWidth: 2.5,
                pointBackgroundColor: '#0E7490',
                pointRadius: data.map(v => v !== null ? 3 : 0),
                pointHoverRadius: 5,
                fill: true,
                backgroundColor: gradient,
                tension: 0.4,
                spanGaps: true,
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: c => ` BMI: ${c.parsed.y}`
                    }
                }
            },
            scales: {
                y: {
                    min: 15,
                    max: 40,
                    ticks: {
                        font: { size: 10, weight: '600' },
                        color: '#444',
                        stepSize: 5,
                    },
                    grid: { color: '#ddd', borderDash: [4, 4] }
                },
                x: {
                    ticks: {
                        font: { size: 10, weight: '600' },
                        color: '#444',
                        maxRotation: 0,
                        autoSkip: false,
                    },
                    grid: { display: false }
                }
            }
        }
    });

    // Auto-scroll to today
    setTimeout(() => {
        scroller.scrollLeft = Math.max(0, (now.getDate() - 4) * dayWidth);
    }, 150);
}

/* ══════════════════════════════════════════
   LOGS MODAL + CALENDAR
   ══════════════════════════════════════════ */

let _allLogs       = [];
let _calYear       = new Date().getFullYear();
let _calMonth      = new Date().getMonth();
let _selectedDate  = null; // 'YYYY-MM-DD' or null = show all

function renderLogsModal(logs) {
    _allLogs = logs;
    renderCalendar();
    renderLogList(null);
}

/* ── Calendar ── */
function renderCalendar() {
    const label   = document.getElementById('calMonthLabel');
    const grid    = document.getElementById('calGrid');
    if (!label || !grid) return;

    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    label.textContent = `${monthNames[_calMonth]} ${_calYear}`;

    // Build set of worked days "YYYY-MM-DD"
    const workedDays = new Set();
    _allLogs.forEach(log => {
        const d = new Date(log.completed_at);
        if (d.getFullYear() === _calYear && d.getMonth() === _calMonth) {
            workedDays.add(d.getDate());
        }
    });

    const today    = new Date();
    const isToday  = (d) => today.getFullYear() === _calYear && today.getMonth() === _calMonth && today.getDate() === d;

    const firstDay = new Date(_calYear, _calMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();

    let html = '';
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${_calYear}-${String(_calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const worked  = workedDays.has(d);
        const todayCls = isToday(d) ? ' today' : '';
        const workedCls = worked ? ' worked' : '';
        const selCls = _selectedDate === dateKey ? ' selected' : '';
        html += `<div class="cal-cell${workedCls}${todayCls}${selCls}" onclick="selectDay('${dateKey}',${d})">${d}</div>`;
    }

    grid.innerHTML = html;
}

function selectDay(dateKey, day) {
    if (_selectedDate === dateKey) {
        // Deselect — show all
        _selectedDate = null;
        renderLogList(null);
    } else {
        _selectedDate = dateKey;
        renderLogList(dateKey);
    }
    renderCalendar(); // re-render to update selected highlight
}

function calPrev() {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    _selectedDate = null;
    renderCalendar();
    renderLogList(null);
}

function calNext() {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    _selectedDate = null;
    renderCalendar();
    renderLogList(null);
}

/* ── Log list ── */
function renderLogList(dateKey) {
    const list     = document.getElementById('logsList');
    const dayLabel = document.getElementById('logsDayLabel');
    if (!list) return;

    let filtered = _allLogs;
    if (dateKey) {
        filtered = _allLogs.filter(log => {
            const d = new Date(log.completed_at);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            return key === dateKey;
        });
        const [yr, mo, dy] = dateKey.split('-');
        const dateObj = new Date(yr, mo-1, dy);
        const label = dateObj.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
        if (dayLabel) dayLabel.textContent = label;
    } else {
        if (dayLabel) dayLabel.textContent = 'All workouts';
    }

    if (!filtered.length) {
        list.innerHTML = `<div class="logs-empty">${dateKey ? 'No workout this day 😴' : 'No workouts yet. Start one! 💪'}</div>`;
        return;
    }

    list.innerHTML = filtered.map(log => {
        const date    = new Date(log.completed_at);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const badge   = (log.level || 'rookie').toLowerCase();
        return `
        <div class="log-item">
          <div class="log-left">
            <span class="log-name">${log.workout || 'Workout'}</span>
            <span class="log-meta">${dateStr} · ${timeStr} · ${log.duration || 0} mins</span>
          </div>
          <span class="log-badge ${badge}">${log.level || 'Rookie'}</span>
        </div>`;
    }).join('');
}

function logs() {
    const modal = document.getElementById('logsModal');
    if (modal) modal.classList.add('open');
    // Reset to current month on open
    _calYear  = new Date().getFullYear();
    _calMonth = new Date().getMonth();
    _selectedDate = null;
    renderCalendar();
    renderLogList(null);
}

function closeLogsModal() {
    const modal = document.getElementById('logsModal');
    if (modal) modal.classList.remove('open');
}

/* ══════════════════════════════════════════
   BMI MODAL — SAVE to Supabase
   ══════════════════════════════════════════ */
function closeBmiModal() {
    document.getElementById('bmiModal').style.display = 'none';
    // Also hide tooltip if open
    const tip = document.getElementById('bmiInfoTooltip');
    if (tip) tip.classList.remove('show');
}

function toggleBmiInfo() {
    const tip = document.getElementById('bmiInfoTooltip');
    if (tip) tip.classList.toggle('show');
}

function editing() {
    // Pre-fill height
    const heightEl = document.getElementById('height');
    const heightInput = document.getElementById('heightInput');
    if (heightEl && heightInput && heightEl.textContent !== '–' && heightEl.textContent !== '0') {
        heightInput.value = heightEl.textContent;
    }
    // Pre-fill weight
    const weightEl = document.getElementById('heaviest');
    const weightInput = document.getElementById('weightInput');
    if (weightEl && weightInput && weightEl.textContent !== '–' && weightEl.textContent !== '0') {
        weightInput.value = weightEl.textContent;
    }
    // Reset toggles to kg/cm defaults
    document.getElementById('weightUnitLabel').textContent = 'kg';
    document.getElementById('heightUnitLabel').textContent = 'cm';
    document.querySelectorAll('.unit-toggle').forEach(group => {
        group.querySelectorAll('.unit-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === 0);
        });
    });
    document.getElementById('bmiModal').style.display = 'flex';
}

function setUnit(field, unit, btn) {
    const group = btn.closest('.unit-toggle');
    const prevUnit = group.querySelector('.unit-btn.active').textContent;
    group.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const input = document.getElementById(field + 'Input');
    const label = document.getElementById(field + 'UnitLabel');
    const val = parseFloat(input.value);
    label.textContent = unit;

    if (!val || isNaN(val)) return;

    // Convert existing value live when toggling
    if (field === 'weight') {
        if (prevUnit === 'kg' && unit === 'lbs') {
            input.value = (val * 2.20462).toFixed(1);
        } else if (prevUnit === 'lbs' && unit === 'kg') {
            input.value = (val * 0.453592).toFixed(1);
        }
    } else if (field === 'height') {
        if (prevUnit === 'cm' && unit === 'ft') {
            input.value = (val / 30.48).toFixed(2);
        } else if (prevUnit === 'ft' && unit === 'cm') {
            input.value = (val * 30.48).toFixed(1);
        }
    }
}

async function saveBmi() {
    const w = parseFloat(document.getElementById('weightInput').value);
    const h = parseFloat(document.getElementById('heightInput').value);

    if (!w || !h) { closeBmiModal(); return; }

    const weightUnit = document.getElementById('weightUnitLabel').textContent;
    const heightUnit = document.getElementById('heightUnitLabel').textContent;

    const weightKg  = weightUnit === 'lbs' ? w * 0.453592 : w;
    const heightCm  = heightUnit === 'ft'  ? h * 30.48    : h;

    // Update UI
    const bmi = calcBMI(weightKg, heightCm);
    if (bmi) updateBMI(bmi);
    document.getElementById('height').textContent  = Math.round(heightCm);
    document.getElementById('heaviest').textContent = weightKg.toFixed(1);

    // Refresh BMI chart with updated values
    const { data: logsData } = await gym
        .from('workout_logs')
        .select('*')
        .eq('user_id', (await gym.auth.getSession()).data.session.user.id)
        .order('completed_at', { ascending: false });
    renderChart(logsData || [], weightKg, heightCm);

    // Save to Supabase
    const { data: { session } } = await gym.auth.getSession();
    if (session) {
        await gym.from('users')
            .update({ weight: weightKg, height: heightCm })
            .eq('id', session.user.id);
    }

    closeBmiModal();
}

/* ══════════════════════════════════════════
    ON LOAD — CHECK AUTH, LOAD DATA, RENDER UI
   ══════════════════════════════════════════ */
window.onload = async function () {

    // Month label
    const monthDisplay = document.getElementById('monthDisplay');
    if (monthDisplay) {
        monthDisplay.innerText = new Date().toLocaleString('default', { month: 'long' });
    }

    // Auth guard
    const user = await checkAuth();
    if (!user) return;

    // Load data in parallel
    const [profile, workoutLogs] = await Promise.all([
        loadUserProfile(user.id),
        loadWorkoutLogs(user.id)
    ]);

    // ── Report card numbers ──
    const totalWorkouts = profile.workouts_completed || workoutLogs.length || 0;
    const totalMinutes  = workoutLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
    const streak        = profile.streak || 0;

    document.getElementById('workout').textContent = totalWorkouts;
    document.getElementById('minutes').textContent = totalMinutes;

    // Count achievements using same logic as the profile page grid
    // Day badges: max_streak vs targets [3,7,15,25,30,40,50,65,70,80,85,90,95,100]
    // Exercise badges: workouts_completed vs targets [3,7,20,50,65,80,100,120,150,180,200,230,280,300,330,350,400,480,500]
    const maxStreak = profile.max_streak || 0;
    const dayTargets      = [3,7,15,25,30,40,50,65,70,80,85,90,95,100];
    const exerciseTargets = [3,7,20,50,65,80,100,120,150,180,200,230,280,300,330,350,400,480,500];
    const unlockedCount =
        dayTargets.filter(t => maxStreak >= t).length +
        exerciseTargets.filter(t => totalWorkouts >= t).length;
    document.getElementById('achieve').textContent = unlockedCount;

    // ── Height display ──
    if (profile.height) {
        document.getElementById('height').textContent = Math.round(profile.height);
    }

    // ── BMI Progress stats ──
    if (profile.height && profile.weight) {
        const currentBmi = calcBMI(profile.weight, profile.height);
        if (currentBmi) document.getElementById('current').textContent = currentBmi;
        document.getElementById('heaviest').textContent = profile.weight.toFixed(1);
    }

    // ── BMI ──
    if (profile.height && profile.weight) {
        const bmi = calcBMI(profile.weight, profile.height);
        if (bmi) updateBMI(bmi);
    }

    // ── Streak circles ──
    renderStreakCircles(streak);

    // ── Chart ──
    renderChart(workoutLogs, profile.weight, profile.height);

    // ── Logs modal ──
    renderLogsModal(workoutLogs);
};