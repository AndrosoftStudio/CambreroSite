document.addEventListener('DOMContentLoaded', () => {
    // Inicializações
    AOS.init({
        duration: 1000,
        once: false,
        mirror: true
    });

    particlesJS('particles-js', {
        particles: {
            number: { value: 80 },
            color: { value: '#6366f1' },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 3 },
            move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        }
    });

    initMobileMenu();
    initFormValidation();
    initSmoothScroll();
    initObservers();
    initAPICalls();
    initParticles();
});

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

function initFormValidation() {
    const form = document.getElementById('contact-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch('assets/php/contact-form.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.text();
            showNotification(result.includes('sucesso') ? 'Mensagem enviada!' : 'Erro ao enviar', 
                           result.includes('sucesso') ? 'success' : 'error');
            form.reset();
        } catch (error) {
            showNotification('Erro de conexão', 'error');
        } finally {
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initObservers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-aos]').forEach(element => {
        observer.observe(element);
    });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const x = (card.offsetWidth - (e.pageX - card.offsetLeft)) / 30;
            const y = (card.offsetHeight - (e.pageY - card.offsetTop)) / 30;
            card.style.transform = `perspective(1000px) rotateX(${y}deg) rotateY(${-x}deg) scale(1.05)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

function initAPICalls() {
    fetch('https://api.quotable.io/random')
        .then(response => response.json())
        .then(data => {
            const quote = document.createElement('div');
            quote.className = 'quote';
            quote.innerHTML = `
                <p>"${data.content}"</p>
                <small>- ${data.author}</small>
            `;
            quote.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: var(--card-bg);
                padding: 1rem;
                border-radius: 8px;
                box-shadow: var(--shadow);
                max-width: 300px;
            `;
            document.body.appendChild(quote);
        });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        padding: 1rem 2rem;
        border-radius: 8px;
        background: var(--card-bg);
        color: var(--text-color);
        box-shadow: var(--shadow);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.bottom = '20px';
    }, 10);

    setTimeout(() => {
        notification.style.bottom = '-50px';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.querySelector('.nav-links').classList.remove('active');
    }
});