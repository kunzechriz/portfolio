// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Section Animations
    const tl = gsap.timeline();

    tl.from(".nav-content", {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    })
    .from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.5")
    .from(".hero-title", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.6")
    .from(".hero-desc", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.6")
    .from(".hero-btn", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.6")
    .from(".bg-orb", {
        scale: 0.5,
        opacity: 0,
        duration: 2,
        ease: "power2.out"
    }, "-=1.5");

    // 2. Section Titles Animation
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: {
                trigger: title,
                start: "top 80%",
                toggleActions: "play none none reverse"
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // 3. Timeline Items Animation (Journey)
    gsap.utils.toArray('.timeline-node').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: i * 0.1 // Stagger effect
        });
    });

    // Timeline Click Interaction
    document.querySelectorAll('.timeline-header').forEach(header => {
        header.addEventListener('click', () => {
            const node = header.closest('.timeline-node');
            node.classList.toggle('active');
        });
    });

    // 4. Project Cards Animation
    gsap.utils.toArray('.project-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: i * 0.15
        });
    });

    // 5. Game Section Animation
    gsap.from(".game-container", {
        scrollTrigger: {
            trigger: ".game-container",
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        scale: 0.95,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (hamburger) {
                    const icon = hamburger.querySelector('i');
                    icon.classList.remove('fa-xmark');
                    icon.classList.add('fa-bars');
                }
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for fixed navbar
                    behavior: 'smooth'
                });
            }
        });
    });
});

// =========================================
// MODAL LOGIC (README & DEMO)
// =========================================
const modal = document.getElementById("projectModal");
const modalBody = document.getElementById("modal-body");

function closeModal() {
    modal.style.display = "none";
    modalBody.innerHTML = "";
}

window.onclick = function(event) {
    if (event.target === modal) {
        closeModal();
    }
}

async function openReadmeModal(readmeUrl) {
    modal.style.display = "block";
    modalBody.innerHTML = "<p>Loading README...</p>";
    
    try {
        const response = await fetch(readmeUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        const markdown = await response.text();
        modalBody.innerHTML = marked.parse(markdown);
    } catch (error) {
        modalBody.innerHTML = "<p>Failed to load README. Please visit the GitHub repository directly.</p>";
        console.error("Error fetching README:", error);
    }
}

function openDemoModal() {
    modal.style.display = "block";
    modalBody.innerHTML = `
        <h2 style="color: var(--accent-color); margin-bottom: 1rem;">SmartHome UI (Demo Mode)</h2>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">This is a static browser-only version of the dashboard. Backend logic is mocked.</p>
        <div style="width: 100%; height: 70vh; border: 1px solid var(--accent-color); border-radius: 8px; overflow: hidden; background: #fff;">
            <iframe src="smarthome_demo/index.html" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
    `;
}

function openPrinnthubModal() {
    modal.style.display = "block";
    modalBody.innerHTML = `
        <h2 style="color: var(--accent-color); margin-bottom: 1rem;">prINNthub – 3D Printing Service</h2>
        <div style="color: var(--text-secondary); line-height: 1.6;">
            <img src="assets/images/projects/prinnthub.png" alt="prINNthub Screenshot" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid var(--card-border);">
            <p style="margin-bottom: 1rem;">Co-founded an on-demand 3D printing platform and service based in Innsbruck (Austria) and Nuremberg (Germany).</p>
            <p style="margin-bottom: 1rem;">I developed the customer-facing web platform, enabling users to submit 3D printing requests, upload 3D models (.stl, .step, .obj), select materials and finishes, and manage their production orders online.</p>
            <p style="margin-bottom: 1.5rem;">The project combines modern web engineering with physical additive manufacturing and rapid prototyping workflows.</p>
            <div style="margin-top: 1.5rem;">
                <a href="https://www.prinnthub.com/" target="_blank" rel="noopener noreferrer" class="btn" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Visit Website (prinnthub.com)
                </a>
            </div>
        </div>
    `;
}
