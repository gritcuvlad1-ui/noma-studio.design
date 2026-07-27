/**
 * NOMA scroll reveal — stagger premium per grupuri de elemente.
 * Fiecare element `.noma-reveal` apare unul câte unul, cu o
 * întârziere progresivă în funcție de poziția sa în grupul vizibil.
 */
export const initScrollAnimations = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.noma-reveal').forEach((el) => {
      (el as HTMLElement).classList.add('in-view');
    });
    return () => {};
  }

  const isMobile = window.innerWidth < 768;

  const observer = new IntersectionObserver(
    (entries) => {
      // Grupează elementele care intră în view simultan
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) return;

      visible.forEach((entry, i) => {
        const el = entry.target as HTMLElement;
        // Stagger: fiecare element apare cu 80ms offset față de precedentul
        const baseDelay = parseFloat(el.style.getPropertyValue('--delay') || '0') * 1000;
        const staggerDelay = baseDelay + i * 80;
        setTimeout(() => {
          el.classList.add('in-view');
        }, staggerDelay);
        observer.unobserve(el);
      });
    },
    {
      threshold: isMobile ? 0.08 : 0.12,
      rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px',
    }
  );

  const observeAll = () => {
    document.querySelectorAll('.noma-reveal:not(.in-view)').forEach((el) => {
      observer.observe(el);
    });
    // fade-in legacy (carduri)
    document.querySelectorAll('.fade-in:not(.visible)').forEach((el) => {
      observer.observe(el);
    });
  };

  observeAll();

  const mutationObserver = new MutationObserver(observeAll);
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
};
