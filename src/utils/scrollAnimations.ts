export const initScrollAnimations = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Animation Guard ──────────────────────────
  if (prefersReducedMotion) {
    return () => {};
  }

  // ── Desktop: animații normale ──────────────────────────
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Unobserve după apariție — nu mai consumă resurse
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  const observeElements = () => {
    document.querySelectorAll('.fade-in:not(.visible)').forEach((el) => {
      observer.observe(el);
    });
  };

  observeElements();

  const mutationObserver = new MutationObserver(() => {
    observeElements();
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
};
