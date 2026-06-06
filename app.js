/* ==========================================================================
   AoBe Solutions Group Interactivity & Dynamic Network Canvas
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollHeader();
  initFormSubmit();
  initNetworkCanvas();
});

// 1. Mobile Menu Toggle
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const dropdown = document.getElementById('mobile-dropdown');
  const links = document.querySelectorAll('.mobile-link');

  function toggleMenu() {
    menuBtn.classList.toggle('active');
    dropdown.classList.toggle('active');
  }

  menuBtn.addEventListener('click', toggleMenu);

  links.forEach(link => {
    link.addEventListener('click', () => {
      // Close menu when a link is clicked
      if (dropdown.classList.contains('active')) {
        toggleMenu();
      }
    });
  });
}

// 2. Navigation Header Scroll Effect & Active Highlight
function initScrollHeader() {
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.desktop-menu .menu-link');

  window.addEventListener('scroll', () => {
    // Scroll header styling
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Highlight active section link
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').replace('#', '');
      if (href === currentId) {
        link.classList.add('active');
      }
    });
  });
}

// 3. Form Submission Handling
function initFormSubmit() {
  const form = document.getElementById('consultation-form');
  const successBox = document.getElementById('form-success-state');
  const submitBtn = document.getElementById('form-submit-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Disable button & show loading state
    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending details... ⏱️';

    // Simulate server communication delay
    setTimeout(() => {
      form.classList.add('hide');
      successBox.classList.remove('hide');
      
      // Scroll to Success Box smoothly
      successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1200);
  });
}

// 4. Interactive Particle Network Canvas
function initNetworkCanvas() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  // Set size matching container
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // Run on start and resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Particles array
  const particles = [];
  const particleCount = 40;
  const connectionDistance = 85;
  const mouse = { x: null, y: null, radius: 100 };

  // Track cursor position
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Particle Class
  class Particle {
    constructor(w, h) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1.5;
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off boundaries
      if (this.x < 0 || this.x > w) this.vx = -this.vx;
      if (this.y < 0 || this.y > h) this.vy = -this.vy;
    }

    draw(width, height) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(13, 148, 136, 0.7)'; // Teal nodes
      ctx.fill();
    }
  }

  // Populate particles
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(width, height));
  }

  // Draw loop
  function animate() {
    const r = canvas.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Update and draw particles
    particles.forEach(p => {
      p.update(w, h);
      p.draw();
    });

    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i];

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`; // Blue connections
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Connect to cursor position
      if (mouse.x !== null && mouse.y !== null) {
        const dx = p1.x - mouse.x;
        const dy = p1.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(13, 148, 136, ${alpha})`; // Teal connection to mouse
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup on window change
  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeCanvas);
  };
}
