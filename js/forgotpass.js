/* ─────────────────────────────────────────
   forgotpass.js  –  3-step password reset
   ───────────────────────────────────────── */

// ── SUPABASE ──
const supabaseUrl = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const supabaseKey = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(supabaseUrl, supabaseKey);


// ── DOM ELEMENTS ──
const step1 = document.getElementById("form-step-1");
const step2 = document.getElementById("form-step-2");
const step3 = document.getElementById("form-step-3");

const send1 = document.getElementById("sendBtn1");
const send2 = document.getElementById("sendBtn2");
const send3 = document.getElementById("sendBtn3");

const emailInput   = document.getElementById("email");
const otpInputs    = document.querySelectorAll(".otp");
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirmpassword");
const errorMsg     = document.getElementById("password-error");
const successMsg   = document.getElementById("success-msg");
const resendBtn    = document.getElementById("resendBtn");
const timerText    = document.getElementById("timer");

// hide messages on load
if (errorMsg)   errorMsg.classList.add("hidden");
if (successMsg) successMsg.classList.add("hidden");


// ── RESEND TIMER ──
let timerRunning = false;

function startTimer(duration = 30) {
    if (timerRunning) return;

    let time = duration;
    resendBtn.disabled = true;
    timerRunning = true;
    timerText.innerText = `Resend in ${time}s`;

    const timer = setInterval(() => {
        time--;
        timerText.innerText = `Resend in ${time}s`;

        if (time <= 0) {
            clearInterval(timer);
            timerText.innerText = "";
            resendBtn.disabled  = false;
            timerRunning        = false;
        }
    }, 1000);
}


// ── STEP 1: SEND OTP ──
async function sendOtp() {
    const email = emailInput.value.trim();
    if (!email) {
        alert("Please enter your email.");
        return;
    }

    const { error } = await gym.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false }
    });

    if (error) {
        if (error.message.toLowerCase().includes("rate limit")) {
            alert("Too many requests. Please wait a moment before trying again.");
        } else {
            alert(error.message);
        }
        return;
    }

    // clear OTP fields from any previous attempt
    otpInputs.forEach(i => { i.value = ""; });
    otpInputs[0]?.focus();

    startTimer();

    step1.classList.add("hidden");
    step2.classList.remove("hidden");
}


// ── STEP 2: VERIFY OTP ──
async function verifyOtp() {
    let code = "";
    otpInputs.forEach(i => { code += i.value.toUpperCase(); });

    if (code.length < otpInputs.length) {
        alert("Please enter the full verification code.");
        return;
    }

    const { error } = await gym.auth.verifyOtp({
        email: emailInput.value.trim(),
        token: code,
        type:  "email"
    });

    if (error) {
        alert("Invalid or expired code. Please try again.");
        return;
    }

    step2.classList.add("hidden");
    step3.classList.remove("hidden");

    // reset step 3 fields
    if (successMsg)   successMsg.classList.add("hidden");
    passwordInput.value = "";
    confirmInput.value  = "";
    send3.disabled      = true;
}


// ── OTP INPUT: auto-advance and backspace ──
otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
        // force uppercase
        input.value = input.value.toUpperCase();
        // move to next box
        if (input.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});


// ── STEP 3: PASSWORD VALIDATION ──
function validatePasswords() {
    const pwd  = passwordInput.value;
    const cpwd = confirmInput.value;

    passwordInput.classList.remove("error-border");
    confirmInput.classList.remove("error-border");

    if (cpwd === "") {
        errorMsg.classList.add("hidden");
        send3.disabled = true;
        return;
    }

    if (pwd !== cpwd) {
        errorMsg.classList.remove("hidden");
        passwordInput.classList.add("error-border");
        confirmInput.classList.add("error-border");
        send3.disabled = true;
    } else {
        errorMsg.classList.add("hidden");
        send3.disabled = false;
    }
}

passwordInput.addEventListener("input", validatePasswords);
confirmInput.addEventListener("input",  validatePasswords);


// ── STEP 3: UPDATE PASSWORD ──
async function updatePassword() {
    if (!passwordInput.value) {
        alert("Please enter a new password.");
        return;
    }

    const { error } = await gym.auth.updateUser({
        password: passwordInput.value
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (successMsg) successMsg.classList.remove("hidden");

    setTimeout(() => {
        window.location.href = "../gym.html";
    }, 2000);
}


// ── PASSWORD TOGGLE ──
document.querySelectorAll(".toggle-icon").forEach(btn => {
    btn.addEventListener("click", () => {
        const id    = btn.dataset.target;
        const input = document.getElementById(id);
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
    });
});


// ── EVENT LISTENERS ──
if (send1)     send1.addEventListener("click", sendOtp);
if (send2)     send2.addEventListener("click", verifyOtp);
if (send3)     send3.addEventListener("click", updatePassword);
if (resendBtn) resendBtn.addEventListener("click", sendOtp);