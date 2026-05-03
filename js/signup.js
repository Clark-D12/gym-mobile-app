/* ─────────────────────────────────────────
   signup.js  –  2-step registration
   ───────────────────────────────────────── */

// ── SUPABASE ──
const supabaseUrl = "https://sgsncmwrepgpohzmvxfd.supabase.co";
const supabaseKey = "sb_publishable_YyRwaDLOiB6XGew3JEDqrA_oFFSkeM8";
const gym = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', function () {

    // ── PASSWORD TOGGLE ──
    document.querySelectorAll('.toggle-icon').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            const id  = btn.dataset.target;
            const inp = document.getElementById(id);
            if (!inp) return;

            const willShow = inp.type === 'password';
            inp.type = willShow ? 'text' : 'password';

            btn.innerHTML = willShow
                ? '<img src="../img/eye-regular-full.svg" alt="show">'
                : '<img src="../img/eye-slash-solid-full.svg" alt="hide">';
        });
    });


    // ── STEP 1 VALIDATION ──
    const emailInput           = document.getElementById('email');
    const usernameInput        = document.getElementById('username');
    const passwordInput        = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('Confirmpassword');
    const nextBtn              = document.getElementById('nextbtn');
    const errorMsg             = document.getElementById('password-error');
    const emailError           = document.getElementById('email-error');

    function validateStep1() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const emailValid = emailRegex.test(emailInput.value.trim());

        // Show/hide email error
        if (!emailValid && emailInput.value.trim()) {
            emailError.classList.remove('hidden');
        } else {
            emailError.classList.add('hidden');
        }

        const allFilled =
            emailValid                         &&
            usernameInput.value.trim()         &&
            passwordInput.value.trim()         &&
            confirmPasswordInput.value.trim();

        const passwordsMatch = passwordInput.value === confirmPasswordInput.value;

        if (!passwordsMatch && confirmPasswordInput.value) {
            errorMsg.classList.remove('hidden');
        } else {
            errorMsg.classList.add('hidden');
        }

        nextBtn.disabled = !(allFilled && passwordsMatch);
    }

    emailInput.addEventListener('input', validateStep1);
    usernameInput.addEventListener('input', validateStep1);
    passwordInput.addEventListener('input', validateStep1);
    confirmPasswordInput.addEventListener('input', validateStep1);
    validateStep1(); // run on load so button starts disabled


    // ── STEP NAVIGATION ──
    nextBtn.addEventListener('click', function () {
        const email      = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        document.getElementById('form-step-1').classList.add('hidden');
        document.getElementById('form-step-2').classList.remove('hidden');
    });

    document.getElementById('backbtn').addEventListener('click', function () {
        document.getElementById('form-step-2').classList.add('hidden');
        document.getElementById('form-step-1').classList.remove('hidden');
    });


    // ── TERMS CHECKBOX ──
    const termsCheckbox = document.getElementById('termsCheckbox');
    termsCheckbox.addEventListener('change', function () {
        submitBtn.disabled = !this.checked;
    });

    // ── FORM SUBMIT ──
    const form      = document.getElementById('signup-form');
    const submitBtn = document.getElementById('submitbtn');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email    = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const username = usernameInput.value.trim();
        const age      = document.getElementById('age').value.trim();
        const gender   = document.getElementById('gender').value;
        const height   = document.getElementById('height').value.trim();
        const weight   = document.getElementById('weight').value.trim();

        if (!email || !password || !username || !age || !gender || !height || !weight) {
            alert("Please complete all fields.");
            return;
        }

        if (parseInt(age) < 18) {
            alert("You must be at least 18 years old to sign up.");
            return;
        }

        submitBtn.disabled = true;

        try {
            const { data, error } = await gym.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        age:    parseInt(age),
                        gender,
                        height: parseFloat(height),
                        weight: parseFloat(weight)
                    }
                }
            });

            if (error) {
                alert(error.message);
                submitBtn.disabled = false;
                return;
            }

            // Hide the form, show success screen
            document.getElementById('signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'flex';

            // Redirect to login after 3 seconds
            setTimeout(function () {
                window.location.href = "../gym.html";
            }, 3000);

        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
            submitBtn.disabled = false;  // re-enable so user can retry
        }
    });

}); // end DOMContentLoaded