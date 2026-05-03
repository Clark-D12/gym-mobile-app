/* ─────────────────────────────────────────
   gym.js  –  landing / login page
   ───────────────────────────────────────── */

// ── SUPABASE ──
const supabaseUrl = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const supabaseKey = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(supabaseUrl, supabaseKey);


// ── OPEN LOGIN CARD ──
function openLogin() {
    document.getElementById("logincard").classList.add("show");
}


// ── CLOSE CARD WHEN CLICKING OUTSIDE ──
document.addEventListener("click", function (event) {
    const loginCard = document.getElementById("logincard");
    const loginBtn  = document.querySelector(".login");   // LOG IN button

    if (!loginCard) return;

    if (
        loginCard.classList.contains("show") &&
        !loginCard.contains(event.target) &&
        (loginBtn ? !loginBtn.contains(event.target) : true)
    ) {
        loginCard.classList.remove("show");
    }
});


// ── SHOW / HIDE PASSWORD ──
function showPass() {
    const passwordInput = document.getElementById("password");
    const passIcon      = document.getElementById("pass-icon");
    if (!passwordInput || !passIcon) return;

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passIcon.src = "img/eye-regular-full.svg";
    } else {
        passwordInput.type = "password";
        passIcon.src = "img/eye-slash-solid-full.svg";
    }
}


// ── LOGIN FORM SUBMIT ──
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email    = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const message  = document.getElementById("login-message");

        if (!email || !password) {
            message.style.display = "block";
            message.className     = "login-message error";
            message.innerHTML     = "Please fill in all fields.";
            return;
        }

        // loading state
        message.style.display = "block";
        message.className     = "login-message loading";
        message.innerHTML     = "Logging in...";

        const { data, error } = await gym.auth.signInWithPassword({ email, password });

        if (error) {
            message.className = "login-message error";
            message.innerHTML = "Incorrect email or password.";
            return;
        }

        // success
        message.className = "login-message success";
        message.innerHTML = "Login successful!";

        setTimeout(() => {
            // Use absolute asset path for Android WebView compatibility
            const base = window.location.href.replace(/\/[^\/]*$/, '');
            const isAndroid = window.location.protocol === 'file:';
            if (isAndroid) {
                window.location.replace("file:///android_asset/pages/homepage.html");
            } else {
                window.location.href = "pages/homepage.html";
            }
        }, 1200);
    });
}