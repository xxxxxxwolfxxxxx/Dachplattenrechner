// Dach.js - Einheitliche JavaScript-Funktionen für alle Dachseiten

class DachPage {
    constructor() {
        this.currentBackground = 0;
        this.backgrounds = document.querySelectorAll('.background-image');
        this.sections = document.querySelectorAll('.section');
        this.scrollDots = document.querySelectorAll('.scroll-dot');
        this.isMobile = window.innerWidth <= 768;
        
        this.init();
    }

    init() {
        this.createFloatingElements();
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.updateScrollIndicator();
        
        // Mobile Detection Update
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
        });
    }

    // Floating particles erstellen
    createFloatingElements() {
        const container = document.querySelector('.floating-elements');
        if (!container) return;
        
        const elementCount = this.isMobile ? 25 : 50; // Weniger auf Mobile
        
        for (let i = 0; i < elementCount; i++) {
            const element = document.createElement('div');
            element.className = 'floating-element';
            element.style.left = Math.random() * 100 + '%';
            element.style.animationDelay = Math.random() * 6 + 's';
            element.style.animationDuration = (6 + Math.random() * 4) + 's';
            container.appendChild(element);
        }
    }

    // Mouse move effect
    handleMouseMove(e) {
        if (this.isMobile) return; // Auf Mobile deaktiviert
        
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        
        document.documentElement.style.setProperty('--mouse-x', x + '%');
        document.documentElement.style.setProperty('--mouse-y', y + '%');
    }

    // Intersection Observer für Glass Panels
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.glass-panel').forEach(panel => {
            observer.observe(panel);
        });
    }

    // Background switching
    switchBackground(index) {
        this.backgrounds.forEach((bg, i) => {
            if (i === index) {
                bg.style.opacity = '1';
                bg.style.zIndex = '2';
            } else {
                bg.style.opacity = '0';
                bg.style.zIndex = '1';
            }
        });
    }

    // Scroll indicator updaten
    updateScrollIndicator() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        let activeSection = 0;
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop - windowHeight * 0.8) {
                activeSection = index;
            }
        });
        
        activeSection = Math.max(0, Math.min(activeSection, this.sections.length - 1));
        
        // Update scroll indicator dots
        this.scrollDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeSection);
        });
        
        // Switch background when section changes
        if (activeSection !== this.currentBackground) {
            this.currentBackground = activeSection;
            this.switchBackground(this.currentBackground);
        }
    }

    // Parallax effect
    updateParallax() {
        if (this.isMobile) return; // Auf Mobile deaktiviert für Performance
        
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.parallax-container');
        
        const speed = scrolled * -0.008;
        parallax.style.transform = `translateY(${speed}px)`;
    }

    // Scroll zu Section
    scrollToSection(index) {
        window.scrollTo({
            top: index * window.innerHeight,
            behavior: 'smooth'
        });
    }

    // Event Listeners setup
    setupEventListeners() {
        // Mouse move
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Scroll events
        window.addEventListener('scroll', () => {
            this.updateScrollIndicator();
            this.updateParallax();
            
            // Custom scroll effects if defined
            if (typeof this.updateCustomScrollEffects === 'function') {
                this.updateCustomScrollEffects();
            }
        });

        // Resize
        window.addEventListener('resize', () => this.updateScrollIndicator());

        // Scroll dots
        this.scrollDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.scrollToSection(index));
        });
    }
}

// Sketch Modal Funktionalität
class SketchModal {
    constructor() {
        this.modal = document.getElementById('sketchModal');
        this.setupEventListeners();
    }

    open() {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    download(sketchType) {
        const sketchFiles = {
            'pultdach': '/skizzen/pultdach.html',
            'satteldach': '/skizzen/Satteldach.html',
            'walmdach': '/skizzen/walmdach.html',
            'krueppelwalm': '/skizzen/krüppelwalm.html',
            'pyramidendach': '/skizzen/pyramidendach.html'
        };
        
        const filename = sketchFiles[sketchType];
        if (!filename) {
            console.error('Unknown sketch type:', sketchType);
            return;
        }
        
        console.log('Loading sketch file:', filename);
        
        // Erstelle ein unsichtbares iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-99999px';
        iframe.style.top
