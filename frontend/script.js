/* ======================================================
   JOBLY — Main JavaScript
   ====================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ========== TYPING ANIMATION ==========
    const typingText = document.getElementById('typing-text');
    const roles = [
        'Sales Manager',
        'Accountant',
        'Software Developer',
        'Designer',
        'Driver',
        'Clerk',
        'Data Analyst',
        'Marketing Head',
        'HR Manager',
        'Teacher',
        'Nurse',
        'Engineer'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseTime = 1800;

    function typeRole() {
        const currentRole = roles[roleIndex];

        if (!isDeleting) {
            // Typing
            charIndex++;
            typingText.textContent = currentRole.substring(0, charIndex);

            if (charIndex === currentRole.length) {
                // Pause before deleting
                setTimeout(() => {
                    isDeleting = true;
                    typeRole();
                }, pauseTime);
                return;
            }
            setTimeout(typeRole, typeSpeed);
        } else {
            // Deleting
            charIndex--;
            typingText.textContent = currentRole.substring(0, charIndex);

            if (charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(typeRole, 300);
                return;
            }
            setTimeout(typeRole, deleteSpeed);
        }
    }

    // Start typing after a short delay
    if (typingText) {
        setTimeout(typeRole, 1500);
    }

    // ========== HEADER SCROLL EFFECT ==========
    const header = document.getElementById('header');

    function handleHeaderScroll() {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });

    // ========== MOBILE MENU ==========
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            nav.classList.toggle('open');
            document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu when a link is clicked
        nav.querySelectorAll('.header__nav-link').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                nav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // ========== COUNTER ANIMATION ==========
    const statNumbers = document.querySelectorAll('.hero__stat-number[data-target]');

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-target'));
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            // Format with commas
            el.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    // Use Intersection Observer for counter animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => statsObserver.observe(num));

    // ========== SCROLL REVEAL FOR FEATURE CARDS ==========
    const featureCards = document.querySelectorAll('.feature-card');

    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the reveal
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 120);
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    featureCards.forEach(card => cardObserver.observe(card));

    // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ========== PARALLAX ORBS (subtle) ==========
    let ticking = false;

    window.addEventListener('mousemove', (e) => {
        if (ticking) return;
        ticking = true;

        requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;

            const orbs = document.querySelectorAll('.hero__orb');
            orbs.forEach((orb, i) => {
                const speed = (i + 1) * 0.5;
                orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });

            ticking = false;
        });
    });

});
