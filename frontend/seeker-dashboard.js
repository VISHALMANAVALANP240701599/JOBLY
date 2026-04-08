/* ======================================================
   JOBLY — Job Seeker Dashboard JavaScript
   Handles: sidebar navigation, jobs fetching, searching,
   filtering, applying, profile management, job details.
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:5000';

    // ========== STATE ==========
    let globalJobs  = [];
    let appliedJobs = [];
    let userProfile = null;   // full profile object from backend

    let currentUser = "Job Seeker";
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try { currentUser = JSON.parse(userStr).name; } catch(e) {}
    }

    // ========== SAFE FETCH HELPER ==========
    async function apiFetch(url, opts = {}) {
        const token = localStorage.getItem('token');
        opts.headers = { ...opts.headers, 'Authorization': `Bearer ${token}` };
        const res = await fetch(url, opts);
        // Guard against HTML responses (Unexpected token '<')
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error(`Expected JSON but got ${contentType} from ${url}`);
        }
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('jobly_role');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(data.message || `Request failed (${res.status})`);
        }
        return data;
    }

    // ========== LOAD ALL DATA ==========
    async function loadState() {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = 'index.html'; return; }
        try {
            const [jobs, apps] = await Promise.all([
                apiFetch(`${API}/api/jobs`),
                apiFetch(`${API}/api/applications`)
            ]);
            globalJobs  = Array.isArray(jobs) ? jobs : [];
            appliedJobs = Array.isArray(apps) ? apps : [];

            populateLocationFilter();
            renderJobs();
            renderAppliedJobs();
            updateDashboardStats();
        } catch (err) {
            console.error('Failed to load data:', err);
            showToast('Failed to load data — check connection');
        }
    }

    // ========== TOAST ==========
    function showToast(message) {
        const existing = document.querySelector('.rdash-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'rdash-toast';
        toast.innerHTML = `<i class="ph ph-check-circle"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }

    // ========== SIDEBAR NAVIGATION ==========
    const sidebarLinks   = document.querySelectorAll('.sidebar__link');
    const sections       = document.querySelectorAll('.section');
    const sidebar        = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function switchSection(sectionId) {
        sections.forEach(s => s.classList.remove('section--active'));
        sidebarLinks.forEach(l => l.classList.remove('sidebar__link--active'));

        const target = document.getElementById('sec-' + sectionId);
        if (target) {
            target.classList.add('section--active');
            target.style.animation = 'none';
            target.offsetHeight;
            target.style.animation = '';
        }
        const activeLink = document.querySelector(`.sidebar__link[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('sidebar__link--active');
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => switchSection(link.dataset.section));
    });

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('show');
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }

    // ========== LOGOUT ==========
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('jobly_role');
            window.location.href = 'index.html';
        });
    }

    // ========== JOBS RENDERING ==========
    const jobsContainer      = document.getElementById('jobs-container');
    const filterTitleInput   = document.getElementById('filter-title');
    const filterLocationSel  = document.getElementById('filter-location');
    const filterTypeSel      = document.getElementById('filter-type');

    function populateLocationFilter() {
        if (!filterLocationSel) return;
        const locs = [...new Set(globalJobs.map(j => j.location).filter(Boolean))];
        let html = '<option value="">All Locations</option>';
        locs.forEach(loc => { html += `<option value="${loc}">${loc}</option>`; });
        filterLocationSel.innerHTML = html;
    }

    function renderJobs() {
        if (!jobsContainer) return;
        const tf = (filterTitleInput?.value || '').toLowerCase();
        const lf = filterLocationSel?.value || '';
        const tyf = filterTypeSel?.value || '';

        const filtered = globalJobs.filter(job => {
            if (tf && !job.title.toLowerCase().includes(tf)) return false;
            if (lf && job.location !== lf) return false;
            if (tyf && job.type !== tyf) return false;
            return true;
        });

        if (filtered.length === 0) {
            jobsContainer.innerHTML = `<div class="no-results">No jobs found matching your criteria.</div>`;
            return;
        }

        let html = '';
        filtered.forEach(job => {
            const hasApplied = appliedJobs.find(a => String(a.jobId?._id || a.jobId) === String(job._id));
            html += `
                <div class="job-card" data-job-id="${job._id}" style="cursor:pointer;">
                    <h3 class="job-card__title">${job.title}</h3>
                    <div class="job-card__meta">
                        <span><i class="ph ph-map-pin"></i> ${job.location || 'Remote'}</span>
                        <span><i class="ph ph-building"></i> ${job.company || 'Unknown Company'}</span>
                        ${job.type ? `<span><i class="ph ph-clock"></i> ${job.type}</span>` : ''}
                    </div>
                    <div class="job-card__desc">${(job.description || 'No description.').substring(0, 120)}${(job.description||'').length > 120 ? '…' : ''}</div>
                    <div class="job-card__footer">
                        <span class="salary-badge">${job.salary || 'Salary not disclosed'}</span>
                        ${hasApplied
                            ? `<button class="btn btn--outline" disabled style="opacity:.6;cursor:not-allowed"><i class="ph ph-check"></i> Applied</button>`
                            : `<button class="btn btn--primary btn-apply" data-job-id="${job._id}" data-job-title="${job.title}"><i class="ph ph-paper-plane-tilt"></i> Apply Now</button>`
                        }
                    </div>
                </div>`;
        });
        jobsContainer.innerHTML = html;

        // Apply button listeners
        jobsContainer.querySelectorAll('.btn-apply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyToJob(btn.dataset.jobId, btn.dataset.jobTitle);
            });
        });

        // Job card click → show details
        jobsContainer.querySelectorAll('.job-card').forEach(card => {
            card.addEventListener('click', () => showJobDetails(card.dataset.jobId));
        });
    }

    // ========== APPLY TO JOB (with profile check) ==========
    async function applyToJob(jobId, jobTitle) {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Check profile is complete before applying
        try {
            const profile = await apiFetch(`${API}/api/profile`);
            if (!profile.name || !profile.mobile) {
                showToast('⚠ Please complete your profile before applying!');
                switchSection('profile');
                loadProfile();
                return;
            }
        } catch(e) {
            showToast('⚠ Please save your profile before applying!');
            switchSection('profile');
            loadProfile();
            return;
        }

        try {
            await apiFetch(`${API}/api/applications/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            });
            showToast(`Successfully applied for ${jobTitle}! ✓`);
            loadState();
        } catch (err) {
            showToast(err.message || 'Failed to apply');
        }
    }

    // ========== JOB DETAILS MODAL ==========
    async function showJobDetails(jobId) {
        try {
            const job = await apiFetch(`${API}/api/jobs/${jobId}`);
            const hasApplied = appliedJobs.find(a => String(a.jobId?._id || a.jobId) === String(job._id));

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'job-modal-overlay';
            overlay.innerHTML = `
                <div class="job-modal">
                    <button class="job-modal__close" title="Close"><i class="ph ph-x"></i></button>
                    <div class="job-modal__header">
                        <h2 class="job-modal__title">${job.title}</h2>
                        <div class="job-card__meta" style="margin-top:8px;">
                            <span><i class="ph ph-building"></i> ${job.company || 'Unknown Company'}</span>
                            <span><i class="ph ph-map-pin"></i> ${job.location || 'Remote'}</span>
                            ${job.type ? `<span><i class="ph ph-clock"></i> ${job.type}</span>` : ''}
                        </div>
                    </div>
                    <div class="job-modal__body">
                        <div class="job-modal__salary">
                            <i class="ph ph-currency-inr"></i>
                            <strong>${job.salary || 'Salary not disclosed'}</strong>
                        </div>
                        <h4 style="margin:16px 0 8px;color:var(--clr-text);">Job Description</h4>
                        <p style="color:var(--clr-text-muted);line-height:1.7;white-space:pre-wrap;">${job.description || 'No description available.'}</p>
                        ${job.recruiterId ? `
                        <h4 style="margin:16px 0 8px;color:var(--clr-text);">Posted By</h4>
                        <p style="color:var(--clr-text-muted);">${job.recruiterId.name || ''} ${job.recruiterId.companyName ? '— ' + job.recruiterId.companyName : ''}</p>
                        ` : ''}
                        <p style="color:var(--clr-text-muted);font-size:0.82rem;margin-top:12px;">
                            Posted on ${new Date(job.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="job-modal__footer">
                        ${hasApplied
                            ? `<button class="btn btn--outline" disabled style="opacity:.6"><i class="ph ph-check"></i> Already Applied</button>`
                            : `<button class="btn btn--primary" id="modal-apply-btn"><i class="ph ph-paper-plane-tilt"></i> Apply Now</button>`
                        }
                        <button class="btn btn--outline" id="modal-close-btn">Close</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);

            // Animate in
            requestAnimationFrame(() => overlay.classList.add('show'));

            // Close handlers
            const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); };
            overlay.querySelector('.job-modal__close').addEventListener('click', close);
            overlay.querySelector('#modal-close-btn')?.addEventListener('click', close);
            overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

            // Apply from modal
            overlay.querySelector('#modal-apply-btn')?.addEventListener('click', () => {
                close();
                applyToJob(job._id, job.title);
            });

        } catch(err) {
            showToast('Failed to load job details');
            console.error(err);
        }
    }

    // Filter listeners
    filterTitleInput?.addEventListener('input', renderJobs);
    filterLocationSel?.addEventListener('change', renderJobs);
    filterTypeSel?.addEventListener('change', renderJobs);

    // ========== APPLIED JOBS TABLE ==========
    function renderAppliedJobs() {
        const tbody = document.getElementById('applied-tbody');
        if (!tbody) return;
        if (appliedJobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--clr-text-muted)">You haven't applied to any jobs yet.</td></tr>`;
            return;
        }
        let html = '';
        appliedJobs.forEach(app => {
            let statusClass = 'badge--pending';
            if (app.status === 'accepted') statusClass = 'badge--accepted';
            if (app.status === 'rejected') statusClass = 'badge--rejected';
            if (app.status === 'reviewed') statusClass = 'badge--reviewed';
            const jobTitle = app.jobId ? app.jobId.title : 'Unknown Job';
            const dateStr  = new Date(app.createdAt).toLocaleDateString();
            html += `<tr>
                <td><strong>${jobTitle}</strong></td>
                <td>${dateStr}</td>
                <td><span class="badge ${statusClass}">${app.status}</span></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    }

    // ========== DASHBOARD STATS ==========
    function updateDashboardStats() {
        const availableEl = document.getElementById('dash-available-jobs');
        const appliedEl   = document.getElementById('dash-applied-jobs');
        if (availableEl) availableEl.textContent = globalJobs.length;
        if (appliedEl)   appliedEl.textContent   = appliedJobs.length;
    }

    // ========== INIT ==========
    loadState();

    // =====================================================
    //  PROFILE MODULE (connects existing UI to backend)
    // =====================================================

    let profilePhotoB64 = null;
    let profileSkills   = [];
    let profileCerts    = [];

    // DOM refs
    const pfName       = document.getElementById('pf-name');
    const pfEmail      = document.getElementById('pf-email');
    const pfMobile     = document.getElementById('pf-mobile');
    const pfDob        = document.getElementById('pf-dob');
    const pfLocation   = document.getElementById('pf-location');
    const pfBio        = document.getElementById('pf-bio');
    const pfStatus     = document.getElementById('pf-status');
    const pfExperience = document.getElementById('pf-experience');
    const pfLinkedin   = document.getElementById('pf-linkedin');
    const pfPortfolio  = document.getElementById('pf-portfolio');
    const pfPhotoInput = document.getElementById('profile-photo-input');
    const pfAvatarImg  = document.getElementById('profile-avatar-img');
    const pfAvatarIcon = document.getElementById('profile-avatar-icon');
    const heroName     = document.getElementById('profile-hero-name');
    const heroRole     = document.getElementById('profile-hero-role');
    const heroBadges   = document.getElementById('profile-hero-badges');
    const skillsChips  = document.getElementById('skills-chips');
    const skillInput   = document.getElementById('skill-input');
    const certsContainer = document.getElementById('certs-container');
    const saveBtn      = document.getElementById('btn-save-profile');

    // ---- Load profile from backend ----
    async function loadProfile() {
        try {
            const user = await apiFetch(`${API}/api/profile`);
            userProfile = user;
            populateProfile(user);
        } catch (e) {
            console.warn('Profile load failed:', e);
        }
    }

    function populateProfile(user) {
        if (pfName)       pfName.value       = user.name       || '';
        if (pfEmail)      pfEmail.value      = user.email      || '';
        if (pfMobile)     pfMobile.value     = user.mobile     || '';
        if (pfDob)        pfDob.value        = user.dob        || '';
        if (pfLocation)   pfLocation.value   = user.location   || '';
        if (pfBio)        pfBio.value        = user.bio        || '';
        if (pfStatus)     pfStatus.value     = user.workStatus || '';
        if (pfExperience) pfExperience.value = user.experience != null ? user.experience : '';
        if (pfLinkedin)   pfLinkedin.value   = user.linkedin   || '';
        if (pfPortfolio)  pfPortfolio.value  = user.portfolio  || '';

        if (user.photo) { profilePhotoB64 = user.photo; showAvatarPhoto(user.photo); }

        if (heroName) heroName.textContent = user.name || '—';
        if (heroRole) heroRole.textContent = user.workStatus || 'Job Seeker';
        updateHeroBadges(user);

        const topbarNameEl = document.querySelector('.topbar__name');
        if (topbarNameEl && user.name) topbarNameEl.textContent = user.name;

        profileSkills = Array.isArray(user.skills) ? [...user.skills] : [];
        renderSkillChips();

        profileCerts = Array.isArray(user.certifications) ? user.certifications.map(c => ({
            name: c.name || '', issuer: c.issuer || '', year: c.year || '', url: c.url || ''
        })) : [];
        renderCerts();
    }

    function updateHeroBadges(user) {
        if (!heroBadges) return;
        let html = '';
        if (user.location)   html += `<span class="profile-badge"><i class="ph ph-map-pin"></i> ${user.location}</span>`;
        if (user.workStatus) html += `<span class="profile-badge"><i class="ph ph-briefcase"></i> ${user.workStatus}</span>`;
        if (user.experience) html += `<span class="profile-badge"><i class="ph ph-clock"></i> ${user.experience} yr${user.experience > 1 ? 's' : ''} exp</span>`;
        heroBadges.innerHTML = html || '<span class="profile-badge" style="opacity:0.5">Complete your profile</span>';
    }

    // ---- Photo upload ----
    function showAvatarPhoto(src) {
        if (pfAvatarImg)  { pfAvatarImg.src = src; pfAvatarImg.style.display = 'block'; }
        if (pfAvatarIcon) pfAvatarIcon.style.display = 'none';
    }

    pfPhotoInput?.addEventListener('change', () => {
        const file = pfPhotoInput.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { showToast('Photo must be under 5 MB'); return; }
        const reader = new FileReader();
        reader.onload = e => { profilePhotoB64 = e.target.result; showAvatarPhoto(profilePhotoB64); };
        reader.readAsDataURL(file);
    });

    // ---- Skills chips ----
    function renderSkillChips() {
        if (!skillsChips) return;
        skillsChips.innerHTML = '';
        profileSkills.forEach((skill, idx) => {
            const chip = document.createElement('span');
            chip.className = 'skill-chip';
            chip.innerHTML = `${skill}<button class="skill-chip__remove" data-idx="${idx}" title="Remove"><i class="ph ph-x"></i></button>`;
            skillsChips.appendChild(chip);
        });
        skillsChips.querySelectorAll('.skill-chip__remove').forEach(btn => {
            btn.addEventListener('click', () => { profileSkills.splice(+btn.dataset.idx, 1); renderSkillChips(); });
        });
    }

    function addSkill() {
        const val = skillInput?.value.trim();
        if (!val) return;
        if (profileSkills.includes(val)) { showToast('Skill already added'); return; }
        profileSkills.push(val);
        skillInput.value = '';
        renderSkillChips();
    }

    document.getElementById('btn-add-skill')?.addEventListener('click', addSkill);
    skillInput?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });

    // ---- Certifications ----
    function renderCerts() {
        if (!certsContainer) return;
        certsContainer.innerHTML = '';
        if (profileCerts.length === 0) {
            certsContainer.innerHTML = `<p style="color:var(--clr-text-muted);font-size:0.88rem;text-align:center;padding:8px 0;">No certifications added yet.</p>`;
        }
        profileCerts.forEach((cert, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'cert-item';
            wrap.innerHTML = `
                <button class="cert-remove-btn" data-idx="${idx}"><i class="ph ph-trash"></i> Remove</button>
                <div class="cert-item__row">
                    <div class="pf-field"><label class="pf-label">Certificate Name</label>
                        <input class="pf-input cert-field" data-idx="${idx}" data-key="name" value="${cert.name}" placeholder="e.g. AWS Cloud Practitioner"></div>
                    <div class="pf-field"><label class="pf-label">Issuing Organisation</label>
                        <input class="pf-input cert-field" data-idx="${idx}" data-key="issuer" value="${cert.issuer}" placeholder="e.g. Amazon"></div>
                </div>
                <div class="cert-item__row">
                    <div class="pf-field"><label class="pf-label">Year</label>
                        <input class="pf-input cert-field" data-idx="${idx}" data-key="year" value="${cert.year}" placeholder="e.g. 2024"></div>
                    <div class="pf-field"><label class="pf-label">Certificate URL (optional)</label>
                        <input class="pf-input cert-field" data-idx="${idx}" data-key="url" type="url" value="${cert.url}" placeholder="https://..."></div>
                </div>`;
            certsContainer.appendChild(wrap);
        });
        certsContainer.querySelectorAll('.cert-remove-btn').forEach(btn => {
            btn.addEventListener('click', () => { profileCerts.splice(+btn.dataset.idx, 1); renderCerts(); });
        });
        certsContainer.querySelectorAll('.cert-field').forEach(input => {
            input.addEventListener('input', () => { profileCerts[+input.dataset.idx][input.dataset.key] = input.value; });
        });
    }

    document.getElementById('btn-add-cert')?.addEventListener('click', () => {
        profileCerts.push({ name: '', issuer: '', year: '', url: '' });
        renderCerts();
        certsContainer.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // ---- Save profile ----
    saveBtn?.addEventListener('click', async () => {
        saveBtn.innerHTML = '<i class="ph ph-spinner"></i> Saving…';
        saveBtn.disabled = true;
        try {
            const payload = {
                name:           pfName?.value.trim(),
                mobile:         pfMobile?.value.trim(),
                dob:            pfDob?.value,
                location:       pfLocation?.value.trim(),
                bio:            pfBio?.value.trim(),
                workStatus:     pfStatus?.value,
                experience:     pfExperience?.value !== '' ? Number(pfExperience.value) : undefined,
                linkedin:       pfLinkedin?.value.trim(),
                portfolio:      pfPortfolio?.value.trim(),
                skills:         profileSkills,
                certifications: profileCerts,
                photo:          profilePhotoB64 || undefined
            };
            const data = await apiFetch(`${API}/api/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            userProfile = data.user;
            updateHeroBadges(data.user);
            if (heroName) heroName.textContent = data.user.name || '—';
            const topbarNameEl = document.querySelector('.topbar__name');
            if (topbarNameEl && data.user.name) topbarNameEl.textContent = data.user.name;

            // Keep localStorage in sync
            try {
                const obj = JSON.parse(localStorage.getItem('user') || '{}');
                obj.name = data.user.name;
                localStorage.setItem('user', JSON.stringify(obj));
            } catch(_) {}

            showToast('Profile saved successfully! ✓');
        } catch (err) {
            showToast('Error: ' + err.message);
        } finally {
            saveBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Profile';
            saveBtn.disabled = false;
        }
    });

    // Load profile when switching to profile section
    sidebarLinks.forEach(link => {
        if (link.dataset.section === 'profile') {
            link.addEventListener('click', () => loadProfile());
        }
    });

});
