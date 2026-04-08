/* ======================================================
   JOBLY — Recruiter Dashboard JavaScript
   Handles: sidebar navigation, jobs, applicants (with
   full seeker profile), post job, company profile.
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:5000';

    // ========== STATE ==========
    let sampleJobs       = [];
    let sampleApplicants = [];
    let activityFeed     = [];
    let companyProfile   = null;

    async function apiFetch(url, opts = {}) {
        const token = localStorage.getItem('token');
        opts.headers = { ...opts.headers, 'Authorization': `Bearer ${token}` };
        
        // cache-busting
        const char = url.includes('?') ? '&' : '?';
        const finalUrl = url + char + 't=' + new Date().getTime();
        
        const res = await fetch(finalUrl, opts);
        const ct  = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            throw new Error(`Non-JSON response from ${url} (${res.status})`);
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
            throw new Error(data.message || `Error ${res.status}`);
        }
        return data;
    }

    async function loadState() {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = 'index.html'; return; }

        try {
            // Jobs (public endpoint — no auth needed)
            const allJobs = await (await fetch(`${API}/api/jobs?t=${new Date().getTime()}`)).json();
            const userStr = localStorage.getItem('user');
            let userId = null;
            try { userId = JSON.parse(userStr || '{}').id; } catch(e) {}
            // recruiterId may be a populated object {_id:...} or a raw ObjectId string
            sampleJobs = allJobs.filter(j => {
                if (!j.recruiterId || !userId) return false;
                const rid = typeof j.recruiterId === 'object' ? j.recruiterId._id : j.recruiterId;
                return String(rid) === String(userId);
            });

            // Applications (full seeker profiles via populate)
            sampleApplicants = await apiFetch(`${API}/api/applications`);

            // Company profile from localStorage
            const data = localStorage.getItem('jobly_recruiter_db');
            if (data) {
                const parsed = JSON.parse(data);
                activityFeed   = parsed.activity      || [];
                companyProfile = parsed.companyProfile || null;
            }

            renderJobsTable();
            renderApplicantsTable();
            updateStats();
            renderCompanyProfile();
        } catch (e) {
            console.error('Error loading data', e);
            showToast('Failed to load data — check connection');
        }
    }

    function saveState() {
        localStorage.setItem('jobly_recruiter_db', JSON.stringify({
            activity: activityFeed,
            companyProfile: companyProfile
        }));
    }

    loadState();

    // ========== SIDEBAR NAVIGATION ==========
    const sidebarLinks = document.querySelectorAll('.sidebar__link');
    const sections = document.querySelectorAll('.section');

    function switchSection(sectionId) {
        // Hide all sections
        sections.forEach(s => s.classList.remove('section--active'));

        // Remove active from all links
        sidebarLinks.forEach(link => link.classList.remove('sidebar__link--active'));

        // Show target section
        const target = document.getElementById('sec-' + sectionId);
        if (target) {
            target.classList.add('section--active');
            // Re-trigger animation
            target.style.animation = 'none';
            target.offsetHeight;
            target.style.animation = '';
        }

        // Set active link
        const activeLink = document.querySelector(`.sidebar__link[data-section="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('sidebar__link--active');

        // Close mobile sidebar
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            switchSection(link.dataset.section);
        });
    });

    // ========== MOBILE SIDEBAR TOGGLE ==========
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

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

    // ========== RENDER: Activity Feed ==========
    function renderActivityFeed() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        activityList.innerHTML = '';
        activityFeed.forEach(item => {
            const el = document.createElement('div');
            el.className = 'activity-item';
            el.innerHTML = `
                <div class="activity-item__icon"><i class="ph ${item.icon}"></i></div>
                <div class="activity-item__text">${item.text}</div>
                <span class="activity-item__time">${item.time}</span>
            `;
            activityList.appendChild(el);
        });
    }
    renderActivityFeed();

    // ========== RENDER: Jobs Table ==========
    function renderJobsTable() {
        const tbody = document.getElementById('jobs-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        sampleJobs.forEach(job => {
            const statusClass = 'badge--active';
            const applicantsCount = sampleApplicants.filter(a => String(a.jobId?._id) === String(job._id)).length;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${job.title}</strong></td>
                <td><span class="badge ${statusClass}">Active</span></td>
                <td>${applicantsCount}</td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" data-edit-job="${job._id}" title="Edit">
                            <i class="ph ph-pencil-simple"></i> Edit
                        </button>
                        <button class="table-btn table-btn--danger" data-delete-job="${job._id}" title="Delete">
                            <i class="ph ph-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Delete handlers
        tbody.querySelectorAll('[data-delete-job]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const jobId = btn.dataset.deleteJob;
                try {
                    await apiFetch(`${API}/api/jobs/${jobId}`, {
                        method: 'DELETE'
                    });
                    showToast('Job deleted successfully');
                    await loadState(); // reload
                } catch(e) { 
                    console.error(e);
                    showToast(e.message || 'Failed to delete job');
                }
            });
        });

        // Edit handlers
        tbody.querySelectorAll('[data-edit-job]').forEach(btn => {
            btn.addEventListener('click', () => {
                const jobId = btn.dataset.editJob;
                const job = sampleJobs.find(j => String(j._id) === String(jobId));
                if (job) {
                    document.getElementById('pj-title').value = job.title;
                    document.getElementById('pj-salary').value = job.salary || '';
                    document.getElementById('pj-location').value = job.location || '';
                    document.getElementById('pj-type').value = job.type || '';
                    document.getElementById('pj-desc').value = job.description || '';
                    
                    document.querySelector('#sec-post-job .section__title').textContent = 'Edit Job: ' + job.title;
                    document.querySelector('#sec-post-job .section__subtitle').textContent = 'Update the details for this listing.';
                    document.getElementById('btn-post-job').innerHTML = '<i class="ph ph-floppy-disk"></i><span>Save Changes</span>';
                    
                    document.getElementById('post-job-form').dataset.editId = job._id;
                    switchSection('post-job');
                }
            });
        });
    }

    renderJobsTable();

    // ========== RENDER: Applicants Table (with full profile) ==========
    function renderApplicantsTable() {
        const tbody = document.getElementById('applicants-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!Array.isArray(sampleApplicants) || sampleApplicants.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--clr-text-muted);padding:20px;">No applications received yet.</td></tr>`;
            return;
        }

        sampleApplicants.forEach(app => {
            let statusClass = 'badge--pending';
            if (app.status === 'accepted') statusClass = 'badge--accepted';
            if (app.status === 'rejected') statusClass = 'badge--rejected';
            if (app.status === 'reviewed') statusClass  = 'badge--reviewed';

            const seeker   = app.seekerId || {};
            const seekerId = seeker._id || '';
            const name     = seeker.name     || 'Unknown';
            const email    = seeker.email    || '—';
            const mobile   = seeker.mobile   || '—';
            const skills   = Array.isArray(seeker.skills) && seeker.skills.length
                             ? seeker.skills.map(s => `<span class="skill-mini">${s}</span>`).join('')
                             : '<span style="color:var(--clr-text-muted)">—</span>';
            const exp      = seeker.experience != null ? `${seeker.experience} yr${seeker.experience !== 1 ? 's' : ''}` : '—';
            const jobTitle = app.jobId ? app.jobId.title : 'Unknown Job';
            const isPending = app.status === 'applied';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div class="applicant-avatar">${name.charAt(0).toUpperCase()}</div>
                        <div>
                            <strong>${name}</strong>
                            <div style="font-size:0.8rem;color:var(--clr-text-muted)">${email}</div>
                            <div style="font-size:0.8rem;color:var(--clr-text-muted)"><i class="ph ph-phone"></i> ${mobile}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${jobTitle}</div>
                    <div style="font-size:0.8rem;color:var(--clr-text-muted);margin-top:4px">
                        Exp: ${exp} &nbsp;|&nbsp; Applied: ${new Date(app.createdAt).toLocaleDateString()}
                    </div>
                    <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${skills}</div>
                </td>
                <td>
                    ${app.certificates
                        ? `<a href="${API}/${app.certificates}" target="_blank" class="table-btn"><i class="ph ph-file-text"></i> View</a>`
                        : `<span style="color:var(--clr-text-muted);font-size:0.85rem;">No file</span>`}
                </td>
                <td><span class="badge ${statusClass}">${app.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn" data-view-profile="${seekerId}" title="View full profile">
                            <i class="ph ph-user-circle"></i> Profile
                        </button>
                        ${isPending ? `
                            <button class="table-btn table-btn--accept" data-id="${app._id}" data-action="accepted"><i class="ph ph-check"></i> Accept</button>
                            <button class="table-btn table-btn--reject" data-id="${app._id}" data-action="rejected"><i class="ph ph-x"></i> Reject</button>
                        ` : '<span style="color:var(--clr-text-muted)">—</span>'}
                    </div>
                </td>`;
            tbody.appendChild(tr);
        });

        // View Profile handlers
        tbody.querySelectorAll('[data-view-profile]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.viewProfile;
                if (id) showSeekerProfile(id);
            });
        });

        // Accept / Reject — call backend
        tbody.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id     = btn.dataset.id;
                const status = btn.dataset.action;
                btn.disabled = true;
                btn.innerHTML = '<i class="ph ph-spinner"></i>';
                try {
                    await apiFetch(`${API}/api/applications/${id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                    showToast(`Application ${status}!`);
                    await loadState();
                } catch(e) {
                    showToast(e.message || 'Failed to update status');
                    btn.disabled = false;
                }
            });
        });
    }

    // ========== VIEW SEEKER PROFILE MODAL ==========
    async function showSeekerProfile(userId) {
        try {
            const user = await apiFetch(`${API}/api/profile/${userId}`);

            // Build skills html
            const skillsHtml = Array.isArray(user.skills) && user.skills.length
                ? user.skills.map(s => `<span class="skill-mini" style="font-size:0.8rem;padding:4px 10px;">${s}</span>`).join('')
                : '<span style="color:var(--clr-text-muted)">No skills listed</span>';

            // Build certifications html
            let certsHtml = '<p style="color:var(--clr-text-muted);font-size:0.88rem;">No certifications added.</p>';
            if (Array.isArray(user.certifications) && user.certifications.length) {
                certsHtml = user.certifications.map(c => `
                    <div class="sp-cert-item">
                        <div class="sp-cert-icon"><i class="ph ph-certificate"></i></div>
                        <div>
                            <strong>${c.name || 'Untitled'}</strong>
                            ${c.issuer ? `<div style="font-size:0.82rem;color:var(--clr-text-muted);">Issued by ${c.issuer}</div>` : ''}
                            ${c.year ? `<div style="font-size:0.82rem;color:var(--clr-text-muted);">Year: ${c.year}</div>` : ''}
                            ${c.url ? `<a href="${c.url}" target="_blank" class="sp-cert-link"><i class="ph ph-arrow-square-out"></i> View Certificate</a>` : ''}
                        </div>
                    </div>
                `).join('');
            }

            // Build uploaded files (from applications)
            const userApps = sampleApplicants.filter(a => String(a.seekerId?._id) === String(userId));
            let filesHtml = '<p style="color:var(--clr-text-muted);font-size:0.88rem;">No files uploaded.</p>';
            if (userApps.some(a => a.certificates)) {
                filesHtml = userApps.filter(a => a.certificates).map(a => {
                    const jobName = a.jobId?.title || 'Unknown Job';
                    const fileName = a.certificates.split(/[\\/]/).pop();
                    return `
                        <div class="sp-file-item">
                            <div class="sp-file-icon"><i class="ph ph-file-text"></i></div>
                            <div style="flex:1">
                                <div style="font-size:0.88rem;color:var(--clr-text);">${fileName}</div>
                                <div style="font-size:0.78rem;color:var(--clr-text-muted);">For: ${jobName}</div>
                            </div>
                            <a href="${API}/${a.certificates}" target="_blank" class="table-btn" style="font-size:0.78rem;">
                                <i class="ph ph-download-simple"></i> Download
                            </a>
                        </div>`;
                }).join('');
            }

            // Photo
            const photoHtml = user.photo
                ? `<img src="${user.photo}" alt="${user.name}" class="sp-avatar-img">`
                : `<div class="sp-avatar-placeholder"><i class="ph ph-user"></i></div>`;

            // Build modal
            const overlay = document.createElement('div');
            overlay.className = 'job-modal-overlay';
            overlay.innerHTML = `
                <div class="job-modal" style="max-width:650px;">
                    <button class="job-modal__close" title="Close"><i class="ph ph-x"></i></button>

                    <!-- Header with photo -->
                    <div class="sp-header">
                        <div class="sp-avatar-wrap">${photoHtml}</div>
                        <div class="sp-header-info">
                            <h2 class="sp-name">${user.name || '—'}</h2>
                            <p class="sp-role">${user.workStatus || 'Job Seeker'}</p>
                            <div class="sp-meta">
                                ${user.location ? `<span><i class="ph ph-map-pin"></i> ${user.location}</span>` : ''}
                                ${user.experience ? `<span><i class="ph ph-clock"></i> ${user.experience} yr${user.experience > 1 ? 's' : ''} exp</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="sp-body">
                        <!-- Contact -->
                        <div class="sp-section">
                            <h4 class="sp-section-title"><i class="ph ph-identification-card"></i> Contact Information</h4>
                            <div class="sp-info-grid">
                                <div class="sp-info-item"><span class="sp-info-label">Email</span><span>${user.email || '—'}</span></div>
                                <div class="sp-info-item"><span class="sp-info-label">Mobile</span><span>${user.mobile || '—'}</span></div>
                                ${user.dob ? `<div class="sp-info-item"><span class="sp-info-label">DOB</span><span>${user.dob}</span></div>` : ''}
                                ${user.linkedin ? `<div class="sp-info-item"><span class="sp-info-label">LinkedIn</span><a href="${user.linkedin}" target="_blank" style="color:#60A5FA;">${user.linkedin.replace('https://','')}</a></div>` : ''}
                                ${user.portfolio ? `<div class="sp-info-item"><span class="sp-info-label">Portfolio</span><a href="${user.portfolio}" target="_blank" style="color:#60A5FA;">${user.portfolio.replace('https://','')}</a></div>` : ''}
                            </div>
                        </div>

                        <!-- Bio -->
                        ${user.bio ? `
                        <div class="sp-section">
                            <h4 class="sp-section-title"><i class="ph ph-text-align-left"></i> About</h4>
                            <p style="color:var(--clr-text-muted);line-height:1.7;font-size:0.9rem;white-space:pre-wrap;">${user.bio}</p>
                        </div>` : ''}

                        <!-- Skills -->
                        <div class="sp-section">
                            <h4 class="sp-section-title"><i class="ph ph-lightning"></i> Skills</h4>
                            <div style="display:flex;flex-wrap:wrap;gap:6px;">${skillsHtml}</div>
                        </div>

                        <!-- Certifications -->
                        <div class="sp-section">
                            <h4 class="sp-section-title"><i class="ph ph-certificate"></i> Certifications</h4>
                            ${certsHtml}
                        </div>

                        <!-- Uploaded Files -->
                        <div class="sp-section">
                            <h4 class="sp-section-title"><i class="ph ph-folder-open"></i> Uploaded Files</h4>
                            ${filesHtml}
                        </div>
                    </div>

                    <div class="job-modal__footer">
                        <button class="btn btn--outline sp-close-btn">Close</button>
                    </div>
                </div>`;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('show'));

            const close = () => { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); };
            overlay.querySelector('.job-modal__close').addEventListener('click', close);
            overlay.querySelector('.sp-close-btn').addEventListener('click', close);
            overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

        } catch(err) {
            showToast('Failed to load profile: ' + err.message);
            console.error(err);
        }
    }

    renderApplicantsTable();

    // ========== UPDATE OVERVIEW STATS ==========
    function updateStats() {
        const totalEl = document.querySelector('#stat-total .stat-card__number');
        const activeEl = document.querySelector('#stat-active .stat-card__number');
        const appEl = document.querySelector('#stat-applicants .stat-card__number');
        const shortEl = document.querySelector('#stat-shortlisted .stat-card__number');

        if (totalEl) totalEl.textContent = sampleJobs.length;
        if (activeEl) activeEl.textContent = sampleJobs.length;
        if (appEl) appEl.textContent = sampleApplicants.length;
        if (shortEl) shortEl.textContent = sampleApplicants.filter(a => a.status === 'accepted').length;
    }

    updateStats();

    const postJobForm = document.getElementById('post-job-form');
    if (postJobForm) {
        postJobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('pj-title').value.trim();
            const salary = document.getElementById('pj-salary').value.trim();
            const location = document.getElementById('pj-location').value.trim();
            const type = document.getElementById('pj-type').value;
            const desc = document.getElementById('pj-desc').value.trim();

            if (!title || !salary || !location || !type || !desc) {
                showToast('Please fill in all fields');
                return;
            }

            const editId = postJobForm.dataset.editId;
            const token = localStorage.getItem('token');
            const company = companyProfile ? companyProfile.name : 'Unknown Company';

            if (editId) {
                // Update existing job
                try {
                    await apiFetch(`${API}/api/jobs/${editId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ title, salary, location, type, description: desc, company })
                    });
                    showToast(`"${title}" has been updated!`);
                    delete postJobForm.dataset.editId;
                    document.querySelector('#sec-post-job .section__title').textContent = 'Post a New Job';
                    document.querySelector('#sec-post-job .section__subtitle').textContent = 'Fill in the details to create a new listing.';
                    document.getElementById('btn-post-job').innerHTML = '<i class="ph ph-paper-plane-tilt"></i><span>Post Job</span>';
                    await loadState(); // reload
                    postJobForm.reset();
                    switchSection('manage-jobs');
                } catch(err) { 
                    console.error(err);
                    showToast(err.message || 'Failed to update job');
                }
            } else {
                // Add new job
                try {
                    await apiFetch(`${API}/api/jobs`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ title, salary, location, type, description: desc, company })
                    });
                    showToast(`"${title}" has been posted!`);
                    await loadState(); // reload
                    postJobForm.reset();
                    switchSection('manage-jobs');
                } catch(err) { 
                    console.error(err);
                    showToast(err.message || 'Failed to post job');
                }
            }
        });
    }

    // ========== EDIT COMPANY PROFILE ==========
    const editCompanyBtn = document.getElementById('btn-edit-company');
    const cancelEditBtn = document.getElementById('btn-cancel-edit-company');
    const saveCompanyBtn = document.getElementById('btn-save-company');
    
    const companyEditForm = document.getElementById('company-edit-form');
    const companyViewFooter = document.getElementById('company-view-footer');
    
    // Display elements
    const companyNameEl = document.getElementById('company-name');
    const companyLocationEl = document.getElementById('company-location');
    const companyDescEl = document.getElementById('company-desc');
    const metaContainer = document.querySelector('.company-card__meta');

    // Input elements
    const inputName = document.getElementById('edit-company-name');
    const inputLocation = document.getElementById('edit-company-location');
    const inputWebsite = document.getElementById('edit-company-website');
    const inputEmployees = document.getElementById('edit-company-employees');
    const inputFounded = document.getElementById('edit-company-founded');
    const inputDesc = document.getElementById('edit-company-desc');

    if (editCompanyBtn) {
        editCompanyBtn.addEventListener('click', () => {
            // Show form, hide footer
            companyEditForm.style.display = 'block';
            companyViewFooter.style.display = 'none';
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Hide form, show footer without saving
            companyEditForm.style.display = 'none';
            companyViewFooter.style.display = 'block';
        });
    }

    function renderCompanyProfile() {
        if (!companyProfile) return;
        
        if (inputName) inputName.value = companyProfile.name || '';
        if (inputLocation) inputLocation.value = companyProfile.location || '';
        if (inputWebsite) inputWebsite.value = companyProfile.website || '';
        if (inputEmployees) inputEmployees.value = companyProfile.employees || '';
        if (inputFounded) inputFounded.value = companyProfile.founded || '';
        if (inputDesc) inputDesc.value = companyProfile.desc || '';

        if (companyNameEl) companyNameEl.textContent = companyProfile.name;
        if (companyLocationEl && companyProfile.location) {
            companyLocationEl.innerHTML = `<i class="ph ph-map-pin"></i> ${companyProfile.location}`;
            companyLocationEl.style.display = 'inline-flex';
        }
        if (companyDescEl) companyDescEl.textContent = companyProfile.desc;

        if (metaContainer) {
            let newMetaHTML = '';
            if (companyProfile.website) {
                newMetaHTML += `
                    <div class="company-meta-item">
                        <i class="ph ph-globe"></i>
                        <span>${companyProfile.website}</span>
                    </div>`;
            }
            if (companyProfile.employees) {
                newMetaHTML += `
                    <div class="company-meta-item">
                        <i class="ph ph-users"></i>
                        <span>${companyProfile.employees}</span>
                    </div>`;
            }
            if (companyProfile.founded) {
                newMetaHTML += `
                    <div class="company-meta-item">
                        <i class="ph ph-calendar"></i>
                        <span>${companyProfile.founded}</span>
                    </div>`;
            }
            metaContainer.innerHTML = newMetaHTML;
        }
    }

    renderCompanyProfile();

    if (saveCompanyBtn) {
        saveCompanyBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Validate
            if (!inputName.value.trim() || !inputLocation.value.trim() || !inputDesc.value.trim()) {
                showToast('Company name, location, and description are required.');
                return;
            }

            // Update state
            companyProfile = {
                name: inputName.value.trim(),
                location: inputLocation.value.trim(),
                website: inputWebsite.value.trim(),
                employees: inputEmployees.value.trim(),
                founded: inputFounded.value.trim(),
                desc: inputDesc.value.trim()
            };
            
            saveState();
            renderCompanyProfile();

            // Hide form, show footer
            companyEditForm.style.display = 'none';
            companyViewFooter.style.display = 'block';

            showToast('Company profile updated successfully!');
        });
    }

});
