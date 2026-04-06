/* ======================================================
   JOBLY — Authentication JavaScript
   Handles: role selection, conditional fields, form
   validation, password toggle, file upload, and
   simulated login/signup success.
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ========== MOBILE MENU ==========
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('open');
            document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
        });

        nav.querySelectorAll('.header__nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // ========== TOAST NOTIFICATION ==========
    function showToast(message, role) {
        // Store role in localStorage for role-based routing
        if (role) {
            localStorage.setItem('jobly_role', role);
        }

        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="ph ph-check-circle"></i><span>${message}</span>`;
        document.body.appendChild(toast);

        // Trigger show
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-hide after 2s, then redirect based on role
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                if (role === 'recruiter') {
                    window.location.href = 'recruiter-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 400);
        }, 2000);
    }

    // ========== PASSWORD VISIBILITY TOGGLE ==========
    document.querySelectorAll('.form-toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const wrapper = btn.closest('.form-input-wrapper');
            const input = wrapper.querySelector('.form-input');
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'ph ph-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'ph ph-eye';
            }
        });
    });

    // ========== VALIDATION HELPERS ==========
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const error = document.getElementById('err-' + inputId);
        if (input) input.classList.add('form-input--error');
        if (error) error.textContent = message;
    }

    function clearError(inputId) {
        const input = document.getElementById(inputId);
        const error = document.getElementById('err-' + inputId);
        if (input) input.classList.remove('form-input--error');
        if (error) error.textContent = '';
    }

    function clearAllErrors(formEl) {
        formEl.querySelectorAll('.form-input--error').forEach(el => el.classList.remove('form-input--error'));
        formEl.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ========== SIGNUP PAGE LOGIC ==========
    const stepRole = document.getElementById('step-role');
    const stepSeeker = document.getElementById('step-seeker');
    const stepRecruiter = document.getElementById('step-recruiter');

    if (stepRole) {
        // --- Role Selection ---
        const roleSeeker = document.getElementById('role-seeker');
        const roleRecruiter = document.getElementById('role-recruiter');

        function showStep(stepToShow) {
            [stepRole, stepSeeker, stepRecruiter].forEach(s => {
                if (s) s.classList.add('auth-hidden');
            });
            stepToShow.classList.remove('auth-hidden');
            // Re-trigger animation
            stepToShow.style.animation = 'none';
            stepToShow.offsetHeight; // reflow
            stepToShow.style.animation = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        roleSeeker.addEventListener('click', () => showStep(stepSeeker));
        roleRecruiter.addEventListener('click', () => showStep(stepRecruiter));

        // Back buttons
        document.getElementById('back-seeker').addEventListener('click', () => showStep(stepRole));
        document.getElementById('back-recruiter').addEventListener('click', () => showStep(stepRole));

        // --- Conditional Experience Field ---
        const statusSelect = document.getElementById('seeker-status');
        const expGroup = document.getElementById('fg-seeker-exp');

        if (statusSelect && expGroup) {
            statusSelect.addEventListener('change', () => {
                if (statusSelect.value === 'experienced') {
                    expGroup.classList.remove('form-group--hidden');
                    expGroup.classList.add('form-group--reveal');
                } else {
                    expGroup.classList.add('form-group--hidden');
                    expGroup.classList.remove('form-group--reveal');
                }
            });
        }

        // --- File Upload Visual Feedback ---
        const fileInput = document.getElementById('rec-cert');
        const fileDrop = document.getElementById('file-drop-zone');
        const fileLabel = document.getElementById('file-label');

        if (fileInput && fileDrop) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    fileDrop.classList.add('form-file--has-file');
                    fileLabel.innerHTML = `
                        <i class="ph ph-file-check"></i>
                        <span>${file.name}</span>
                        <small>${(file.size / 1024).toFixed(1)} KB</small>
                    `;
                } else {
                    fileDrop.classList.remove('form-file--has-file');
                    fileLabel.innerHTML = `
                        <i class="ph ph-cloud-arrow-up"></i>
                        <span>Click or drag to upload</span>
                        <small>PDF, JPG, PNG — Max 5MB</small>
                    `;
                }
            });

            // Drag visual
            fileDrop.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileDrop.classList.add('form-file--drag');
            });
            fileDrop.addEventListener('dragleave', () => {
                fileDrop.classList.remove('form-file--drag');
            });
            fileDrop.addEventListener('drop', () => {
                fileDrop.classList.remove('form-file--drag');
            });
        }

        // --- Job Seeker Form Validation & Submit ---
        const seekerForm = document.getElementById('seeker-form');
        if (seekerForm) {
            seekerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAllErrors(seekerForm);
                let valid = true;

                const name = document.getElementById('seeker-name').value.trim();
                const dob = document.getElementById('seeker-dob').value;
                const email = document.getElementById('seeker-email').value.trim();
                const password = document.getElementById('seeker-password').value;
                const mobile = document.getElementById('seeker-mobile').value.trim();
                const status = document.getElementById('seeker-status').value;

                if (!name) { showError('seeker-name', 'Full name is required'); valid = false; }
                if (!dob) { showError('seeker-dob', 'Date of birth is required'); valid = false; }
                if (!email) { showError('seeker-email', 'Email is required'); valid = false; }
                else if (!isValidEmail(email)) { showError('seeker-email', 'Enter a valid email'); valid = false; }
                if (!password) { showError('seeker-password', 'Password is required'); valid = false; }
                else if (password.length < 6) { showError('seeker-password', 'Minimum 6 characters'); valid = false; }
                if (!mobile) { showError('seeker-mobile', 'Mobile number is required'); valid = false; }
                else if (!/^\d{10}$/.test(mobile)) { showError('seeker-mobile', 'Enter a valid 10-digit number'); valid = false; }
                if (!status) { showError('seeker-status', 'Please select your work status'); valid = false; }

                if (status === 'experienced') {
                    const exp = document.getElementById('seeker-exp').value;
                    if (!exp || exp < 1) { showError('seeker-exp', 'Enter valid years of experience'); valid = false; }
                }

                if (valid) {
                    const btn = document.getElementById('btn-seeker-submit');
                    btn.innerHTML = '<i class="ph ph-spinner"></i> <span>Creating account...</span>';
                    btn.style.pointerEvents = 'none';

                    const exp = document.getElementById('seeker-exp').value;
                    const payload = { 
                        name, email, password, role: 'seeker',
                        dob, mobile, workStatus: status, experience: exp ? Number(exp) : 0
                    };
                    fetch('http://localhost:5000/api/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    })
                    .then(res => res.json().then(data => ({ status: res.status, data })))
                    .then(resObj => {
                        if (resObj.status !== 201) {
                            showError('seeker-email', resObj.data.message || 'Signup failed');
                            btn.innerHTML = 'Sign Up';
                            btn.style.pointerEvents = 'auto';
                        } else {
                            showToast('Account created successfully!', 'seeker');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        btn.innerHTML = 'Sign Up';
                        btn.style.pointerEvents = 'auto';
                        alert('Network error. Please try again.');
                    });
                }
            });
        }

        // --- Recruiter Form Validation & Submit ---
        const recruiterForm = document.getElementById('recruiter-form');
        if (recruiterForm) {
            recruiterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                clearAllErrors(recruiterForm);
                let valid = true;

                const name = document.getElementById('rec-name').value.trim();
                const company = document.getElementById('rec-company').value.trim();
                const roles = document.getElementById('rec-roles').value.trim();
                const location = document.getElementById('rec-location').value.trim();
                const email = document.getElementById('rec-email').value.trim();
                const password = document.getElementById('rec-password').value;
                const cert = document.getElementById('rec-cert').files;

                if (!name) { showError('rec-name', 'Full name is required'); valid = false; }
                if (!company) { showError('rec-company', 'Company name is required'); valid = false; }
                if (!roles) { showError('rec-roles', 'Roles offered is required'); valid = false; }
                if (!location) { showError('rec-location', 'Location is required'); valid = false; }
                if (!email) { showError('rec-email', 'Email is required'); valid = false; }
                else if (!isValidEmail(email)) { showError('rec-email', 'Enter a valid email'); valid = false; }
                if (!password) { showError('rec-password', 'Password is required'); valid = false; }
                else if (password.length < 6) { showError('rec-password', 'Minimum 6 characters'); valid = false; }
                if (cert.length === 0) { showError('rec-cert', 'Please upload a certificate or proof'); valid = false; }

                if (valid) {
                    const btn = document.getElementById('btn-rec-submit');
                    btn.innerHTML = '<i class="ph ph-spinner"></i> <span>Creating account...</span>';
                    btn.style.pointerEvents = 'none';

                    fetch('http://localhost:5000/api/signup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, password, role: 'recruiter', companyName: company })
                    })
                    .then(res => res.json().then(data => ({ status: res.status, data })))
                    .then(resObj => {
                        if (resObj.status !== 201) {
                            showError('rec-email', resObj.data.message || 'Signup failed');
                            btn.innerHTML = 'Sign Up';
                            btn.style.pointerEvents = 'auto';
                        } else {
                            showToast('Recruiter account created!', 'recruiter');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        btn.innerHTML = 'Sign Up';
                        btn.style.pointerEvents = 'auto';
                        alert('Network error. Please try again.');
                    });
                }
            });
        }
    }

    // ========== LOGIN PAGE LOGIC ==========
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllErrors(loginForm);
            let valid = true;

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!email) { showError('login-email', 'Email is required'); valid = false; }
            else if (!isValidEmail(email)) { showError('login-email', 'Enter a valid email'); valid = false; }
            if (!password) { showError('login-password', 'Password is required'); valid = false; }

            if (valid) {
                const btn = document.getElementById('btn-login-submit');
                btn.innerHTML = '<i class="ph ph-spinner"></i> <span>Signing in...</span>';
                btn.style.pointerEvents = 'none';

                fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                })
                .then(res => res.json().then(data => ({ status: res.status, data })))
                .then(resObj => {
                    if (resObj.status !== 200) {
                        showError('login-email', resObj.data.message || 'Login failed');
                        btn.innerHTML = 'Sign In';
                        btn.style.pointerEvents = 'auto';
                    } else {
                        localStorage.setItem('token', resObj.data.token);
                        localStorage.setItem('user', JSON.stringify(resObj.data.user));
                        showToast('Signed in successfully!', resObj.data.user.role);
                    }
                })
                .catch(err => {
                    console.error(err);
                    btn.innerHTML = 'Sign In';
                    btn.style.pointerEvents = 'auto';
                    alert('Network error.');
                });
            }
        });
    }

    // ========== CLEAR ERRORS ON INPUT ==========
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('form-input--error');
            const errEl = document.getElementById('err-' + input.id);
            if (errEl) errEl.textContent = '';
        });
    });

});
