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

    // 3. Timeline Items Animation (Experience & Education)
    gsap.utils.toArray('.timeline-item').forEach((item, i) => {
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

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
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

function openMLModal() {
    modal.style.display = "block";
    modalBody.innerHTML = `
        <h2 style="color: var(--accent-color); margin-bottom: 1rem;">California Housing ML Analysis</h2>
        <div style="color: var(--text-secondary); line-height: 1.6;">
            <p style="margin-bottom: 1rem;">This project involves predicting house prices in California using a Support Vector Regression (SVR) machine learning model.</p>
            <p style="margin-bottom: 1rem;">The dataset features attributes like location, median income, and housing age. I implemented a complete data preprocessing pipeline, including feature scaling with StandardScaler.</p>
            <p style="margin-bottom: 1rem;">To optimize model performance, I utilized GridSearch for hyperparameter tuning, finding the best combination of parameters (C, epsilon, kernel) for the SVR model. The project demonstrates a fundamental understanding of supervised learning, data preparation, and model evaluation using Scikit-Learn.</p>
            <div style="margin-top: 1.5rem;">
                <a href="https://github.com/kunzechriz/L-MCI-BSc-Data-Science-I" target="_blank" class="btn" style="text-decoration: none; display: inline-block;">View Repository on GitHub</a>
            </div>
        </div>
    `;
}
