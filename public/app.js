// Sticky header — shows after scrolling past hero section
const header = document.getElementById('sticky-header');
const hero = document.getElementById('hero-section');
let heroHeight = hero.offsetHeight;
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      if (window.scrollY >= heroHeight) {
        header.classList.remove('-translate-y-full');
        header.classList.add('translate-y-0');
      } else {
        header.classList.add('-translate-y-full');
        header.classList.remove('translate-y-0');
      }
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

window.addEventListener('resize', () => {
  heroHeight = hero.offsetHeight;
}, { passive: true });

// Services accordion — expand/collapse on hover (desktop only)
const accordion = document.getElementById('services-accordion');
const cardData = Array.from(accordion.querySelectorAll('.service-card')).map(card => ({
  card,
  overlay: card.querySelector('.card-overlay'),
  img: card.querySelector('img'),
}));

function setActiveCard(activeIndex) {
  cardData.forEach(({ card, overlay, img }, i) => {
    if (i === activeIndex) {
      card.style.flex = '0 0 850px';
      card.classList.add('active');
      overlay.style.opacity = '1';
      img.style.transform = 'scale(1.05)';
    } else {
      card.style.flex = '0 0 150px';
      card.classList.remove('active');
      overlay.style.opacity = '0';
      img.style.transform = 'scale(1)';
    }
  });
}

if (window.innerWidth >= 768) {
  cardData.forEach(({ card }, i) => {
    card.addEventListener('mouseenter', () => setActiveCard(i));
  });
  accordion.addEventListener('mouseleave', () => setActiveCard(1));
}
