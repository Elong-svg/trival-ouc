document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
        });
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-links') && 
            !event.target.closest('.hamburger') && 
            navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            body.style.overflow = '';
        }
    });

    const videoPlaceholder = document.getElementById('videoPlaceholder');
    const videoFrame = document.getElementById('videoFrame');
    const previewVideo = document.getElementById('previewVideo');

    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            videoPlaceholder.style.display = 'none';
            videoFrame.style.display = 'block';
            previewVideo.play();
        });
    }

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.video-wrapper')) {
            if (previewVideo && !previewVideo.paused) {
                previewVideo.pause();
            }
        }
    });

    const videoPlaceholders = document.querySelectorAll('[id^="videoPlaceholder"]');
    
    videoPlaceholders.forEach((placeholder, index) => {
        const frameId = `videoFrame${index + 1}`;
        const videoId = `previewVideo${index + 1}`;
        
        const videoFrame = document.getElementById(frameId);
        const video = document.getElementById(videoId);
        
        if (placeholder && videoFrame && video) {
            placeholder.addEventListener('click', function() {
                placeholder.style.display = 'none';
                videoFrame.style.display = 'block';
                video.play();
            });
        }
    });

    document.addEventListener('click', function(event) {
        if (!event.target.closest('.video-thumbnail')) {
            document.querySelectorAll('[id^="previewVideo"]').forEach(video => {
                if (video && !video.paused) {
                    video.pause();
                }
            });
        }
    });

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '发送中...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('感谢您的留言！我们会尽快回复您。');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    }

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.feature-item, .news-card, .info-card, .award-card, .gallery-item, .download-card, .scenic-card');
    animatedElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });

    const nav = document.querySelector('.main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            nav.style.padding = '12px 48px';
        } else {
            nav.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            nav.style.padding = '';
        }
        
        lastScroll = currentScroll;
    });

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
});
