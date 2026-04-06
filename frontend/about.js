/* ======================================================
   JOBLY — About Page JavaScript
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

    // ========== SCROLL REVEAL FOR ABOUT CARDS ==========
    const revealElements = document.querySelectorAll('.about-card, .highlight-card, .testimonial');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        revealObserver.observe(el);
    });

    // ========== HEADER SCROLL EFFECT ==========
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.add('header--scrolled'); // keep scrolled on about page
        }
    }, { passive: true });

});
