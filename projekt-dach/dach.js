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
            // Bei Orientierungswechsel Observer neu initialisieren
            this.setupIntersectionObserver();
        });
        
        // Orientierungswechsel abfangen
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.isMobile = window.innerWidth <= 768;
                this.setupIntersectionObserver();
                this.updateScrollIndicator();
            }, 100);
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
            rootMargin: this.isMobile && window.innerHeight < window.innerWidth ? 
                '-20px 0px -50px 0px' : // Mobile Landscape: weniger Margin
                '0px 0px -100px 0px'   // Desktop/Mobile Portrait
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
        iframe.style.top = '-99999px';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        iframe.style.opacity = '0';
        iframe.src = filename;
        
        document.body.appendChild(iframe);
        
        // Warte bis das iframe geladen ist
        iframe.onload = function() {
            try {
                // Füge 3cm Margin CSS hinzu
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const style = iframeDoc.createElement('style');
                style.textContent = `
                    @media print {
                        @page {
                            margin: 3cm !important;
                            size: A4 !important;
                        }
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        * {
                            margin: 0 !important;
                            padding: 0 !important;
                            box-sizing: border-box !important;
                        }
                        html {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                    }
                    @page {
                        margin: 3cm !important;
                        size: A4 !important;
                    }
                `;
                iframeDoc.head.appendChild(style);
                
                // Kurz warten, dann drucken
                setTimeout(() => {
                    try {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                        
                        // iframe nach 3 Sekunden entfernen
                        setTimeout(() => {
                            if (iframe.parentNode) {
                                document.body.removeChild(iframe);
                            }
                        }, 3000);
                        
                    } catch (printError) {
                        console.error('Print error:', printError);
                        // Fallback: Öffne in neuem Tab
                        window.open(filename, '_blank');
                        if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                        }
                    }
                }, 1000);
                
            } catch (error) {
                console.error('iframe access error:', error);
                // Fallback: Öffne in neuem Tab
                window.open(filename, '_blank');
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
            }
        };
        
        iframe.onerror = function() {
            console.error('Error loading sketch file:', filename);
            // Fallback: Öffne in neuem Tab
            window.open(filename, '_blank');
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        };
        
        // Fallback-Timer: Nach 10 Sekunden iframe entfernen
        setTimeout(() => {
            if (iframe.parentNode) {
                console.log('Timeout reached, removing iframe');
                document.body.removeChild(iframe);
            }
        }, 10000);
    }

    setupEventListeners() {
        // Close modal when clicking outside
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        }
    }
}

// Video Scrubbing Funktionalität
class VideoScrubber {
    constructor(videoId, sectionIndex) {
        this.video = document.getElementById(videoId);
        this.sectionIndex = sectionIndex;
        this.videoDuration = 5; // Default 5 Sekunden
        this.isMobile = window.innerWidth <= 768;
        
        if (this.video) {
            this.setupVideo();
        }
    }

    setupVideo() {
        // Mobile Video Setup
        if (this.isMobile) {
            this.video.autoplay = true;
            this.video.loop = true;
            this.video.muted = true;
            this.video.playsInline = true;
            
            // Versuche Video zu starten
            this.video.play().catch(e => {
                console.log('Video autoplay failed on mobile:', e);
                // Fallback: Zeige erstes Frame
                this.video.currentTime = 0;
            });
        }
        
        this.video.addEventListener('loadedmetadata', () => {
            this.videoDuration = this.video.duration;
            console.log('Video geladen, Dauer:', this.videoDuration);
        });
        
        // Fallback falls Video nicht lädt
        this.video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            // Verstecke Video-Container bei Fehler
            const videoContainer = this.video.closest('.background-image');
            if (videoContainer) {
                videoContainer.style.background = 'linear-gradient(45deg, #1a1a2e, #16213e)';
                videoContainer.innerHTML = '';
            }
        });
    }

    updateProgress() {
        if (!this.video || !this.video.duration || this.isMobile) return;
        
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const sections = document.querySelectorAll('.section');
        
        if (this.sectionIndex >= sections.length) return;
        
        const section = sections[this.sectionIndex];
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop - windowHeight && scrollPosition <= sectionBottom) {
            const sectionProgress = Math.max(0, Math.min(1, 
                (scrollPosition - (sectionTop - windowHeight)) / (section.offsetHeight + windowHeight)
            ));
            
            this.video.currentTime = sectionProgress * this.video.duration;
        }
    }
}

// Spezielle Background-Effekte
class BackgroundEffects {
    constructor(page) {
        this.page = page;
        this.effects = {};
    }

    // Registriere Custom-Effekt für eine Sektion
    registerEffect(sectionIndex, effectFunction) {
        this.effects[sectionIndex] = effectFunction;
    }

    // Führe alle registrierten Effekte aus
    updateEffects() {
        if (this.page.isMobile) return; // Auf Mobile deaktiviert
        
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        this.page.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop - windowHeight && scrollPosition <= sectionBottom) {
                const sectionProgress = Math.max(0, Math.min(1, 
                    (scrollPosition - (sectionTop - windowHeight * 0.5)) / (section.offsetHeight + windowHeight * 0.5)
                ));
                
                // Führe spezifischen Effekt aus, falls registriert
                if (this.effects[index]) {
                    this.effects[index](sectionProgress, index);
                } else {
                    // Standard vertikale Bewegung
                    const bgPositionY = (sectionProgress * 100);
                    document.documentElement.style.setProperty(`--bg-pos-${index + 1}`, `center ${bgPositionY}%`);
                }
            }
        });
    }
}

// Globale Funktionen für backwards compatibility
function openSketchModal() {
    if (window.sketchModal) {
        window.sketchModal.open();
    }
}

function closeSketchModal() {
    if (window.sketchModal) {
        window.sketchModal.close();
    }
}

function downloadSketch(sketchType) {
    if (window.sketchModal) {
        window.sketchModal.download(sketchType);
    }
}

// Initialisierung wenn DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
    // Haupt-Page-Klasse initialisieren
    window.dachPage = new DachPage();
    
    // Sketch Modal initialisieren falls vorhanden
    if (document.getElementById('sketchModal')) {
        window.sketchModal = new SketchModal();
    }
    
    // Video Scrubber für messen.html
    if (document.getElementById('stormVideo')) {
        window.videoScrubber = new VideoScrubber('stormVideo', 1);
        
        // Video Scrubbing zum Update-Cycle hinzufügen
        window.dachPage.updateCustomScrollEffects = function() {
            if (window.videoScrubber) {
                window.videoScrubber.updateProgress();
            }
        };
    }
    
    // Background Effects System initialisieren
    window.backgroundEffects = new BackgroundEffects(window.dachPage);
    
    // Custom Background Effects registrieren basierend auf der Seite
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'uk.html':
            // Aerogel-Effekt für UK-Seite
            window.backgroundEffects.registerEffect(0, function(progress, index) {
                const aerogelTop1 = 80 - (progress * 120);
                const aerogelLeft1 = -30 + (progress * 80);
                const aerogelTop2 = 60 - (progress * 100);
                const aerogelLeft2 = -40 + (progress * 90);
                
                document.documentElement.style.setProperty('--aerogel-top', aerogelTop1 + '%');
                document.documentElement.style.setProperty('--aerogel-left', aerogelLeft1 + '%');
                document.documentElement.style.setProperty('--aerogel-top-2', aerogelTop2 + '%');
                document.documentElement.style.setProperty('--aerogel-left-2', aerogelLeft2 + '%');
            });
            
            window.backgroundEffects.registerEffect(2, function(progress, index) {
                const bgPositionY = 0 + (progress * 100);
                document.documentElement.style.setProperty('--temple-bg-position', `center ${bgPositionY}%`);
            });
            
            window.backgroundEffects.registerEffect(3, function(progress, index) {
                const bgPositionX = 50 + (Math.sin(progress * Math.PI * 2) * 10);
                const bgPositionY = 50 + (progress * 20);
                document.documentElement.style.setProperty('--tool-bg-position', `${bgPositionX}% ${bgPositionY}%`);
            });
            break;
            
        case 'messen.html':
            // Lineal-Licht Effekt
            window.backgroundEffects.registerEffect(3, function(progress, index) {
                const lightPosition = 100 - (progress * 200);
                const bgPosition = 50 - (progress * 50);
                
                document.documentElement.style.setProperty('--ruler-light-position', lightPosition + '%');
                document.documentElement.style.setProperty('--ruler-bg-position', `center ${bgPosition}%`);
            });
            break;
            
        case 'plan.html':
            // Holz-Scroll Effekt
            window.backgroundEffects.registerEffect(2, function(progress, index) {
                const bgPositionY = 0 + (progress * 20);
                document.documentElement.style.setProperty('--wood-bg-position', `center ${bgPositionY}%`);
            });
            
            // Community-Scroll Effekt
            window.backgroundEffects.registerEffect(3, function(progress, index) {
                const bgPositionY = 0 + (progress * 120);
                document.documentElement.style.setProperty('--community-bg-position', `center ${bgPositionY}%`);
            });
            break;
            
        case 'blech.html':
            // Handwerker bleibt zentral
            window.backgroundEffects.registerEffect(2, function(progress, index) {
                document.documentElement.style.setProperty('--bg-pos-3', `center center`);
            });
            
            // Schraubbild Detail
            window.backgroundEffects.registerEffect(3, function(progress, index) {
                const bgPositionY = 25 + (progress * 25);
                document.documentElement.style.setProperty('--bg-pos-4', `center ${bgPositionY}%`);
            });
            break;
            
        case 'winkel.html':
            // Winkel-spezifische Effekte
            window.backgroundEffects.registerEffect(1, function(progress, index) {
                const bgPositionX = (progress * 100);
                document.documentElement.style.setProperty('--bg-pos-2', `${bgPositionX}% center`);
            });
            
            window.backgroundEffects.registerEffect(2, function(progress, index) {
                const bgPositionY = -10 + (progress * 80);
                document.documentElement.style.setProperty('--bg-pos-3', `center ${bgPositionY}%`);
            });
            
            window.backgroundEffects.registerEffect(3, function(progress, index) {
                const bgPositionX = -30 + (progress * 160);
                const bgPositionY = 40 + (progress * 20);
                document.documentElement.style.setProperty('--bg-pos-4', `${bgPositionX}% ${bgPositionY}%`);
            });
            break;
    }
    
    // Background Effects zum Update-Cycle hinzufügen
    const originalUpdateCustomScrollEffects = window.dachPage.updateCustomScrollEffects;
    window.dachPage.updateCustomScrollEffects = function() {
        if (originalUpdateCustomScrollEffects) {
            originalUpdateCustomScrollEffects.call(this);
        }
        if (window.backgroundEffects) {
            window.backgroundEffects.updateEffects();
        }
    };
});

// Export für ES6 Module (falls benötigt)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DachPage, SketchModal, VideoScrubber, BackgroundEffects };
}
