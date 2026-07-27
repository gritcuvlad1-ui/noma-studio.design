import * as React from "react";
import { cn } from "@/lib/utils";
import "./gooey-text-morphing.css";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

/* „Gooey" morphing text — două straturi de text suprapuse care se topesc unul
   în altul (blur + threshold SVG). Adaptat pentru acest proiect: CSS propriu
   (nu Tailwind — proiectul nu injectează utilitarele), font NOMA din CSS. */
export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
}: GooeyTextProps) {
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const t1 = text1Ref.current;
    const t2 = text2Ref.current;
    const stage = stageRef.current;
    if (!t1 || !t2 || !stage) return;

    // Motion redus (setare de sistem): fără buclă, fraza completă, statică.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      t2.textContent = texts.join(" ");
      t2.style.opacity = "100%";
      t2.style.whiteSpace = "normal";
      t1.style.opacity = "0%";
      return;
    }

    // Pe telefon filtrul SVG threshold e SĂRIT complet: pe iOS e buggy și
    // scump de rasterizat → morph-ul devine crossfade pur blur+opacity
    // (compozitat pe GPU, fluid). Desktop-ul păstrează efectul gooey întreg.
    const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
    // Blur-ul original urca până la 100px (invizibil peste ~20px la aceste
    // dimensiuni de font, dar FOARTE scump pe GPU-ul de telefon) → plafonat.
    const BLUR_CAP = isMobile ? 22 : 40;

    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let rafId = 0;
    let paused = false;
    let atRest = false;

    // Conținut setat IMEDIAT — altfel titlul e invizibil până la primul
    // morph (~cooldownTime secunde de gol la încărcarea paginii).
    t1.textContent = texts[textIndex % texts.length];
    t2.textContent = texts[(textIndex + 1) % texts.length];

    const setMorph = (fraction: number) => {
      t2.style.filter = `blur(${Math.min(8 / fraction - 8, BLUR_CAP)}px)`;
      t2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      fraction = 1 - fraction;
      t1.style.filter = `blur(${Math.min(8 / fraction - 8, BLUR_CAP)}px)`;
      t1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
    };

    const doCooldown = () => {
      morph = 0;
      // Stilurile de repaus se scriu O DATĂ, nu la fiecare frame — originalul
      // invalida stilurile ambelor spans în fiecare cadru de cooldown (churn
      // constant de paint, resimțit ca lag pe telefon).
      if (atRest) return;
      atRest = true;
      t2.style.filter = "";
      t2.style.opacity = "100%";
      t1.style.filter = "";
      t1.style.opacity = "0%";
      // ÎN REPAUS threshold-ul e scos → text nativ, anti-aliasing perfect.
      stage.style.filter = "none";
    };

    const doMorph = () => {
      atRest = false;
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      // threshold DOAR în timpul topirii, și DOAR pe desktop
      if (!isMobile) stage.style.filter = "url(#threshold)";
      setMorph(fraction);
    };

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          t1.textContent = texts[textIndex % texts.length];
          t2.textContent = texts[(textIndex + 1) % texts.length];
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    // Bucla rulează DOAR când titlul e pe ecran și tab-ul e activ — zero
    // consum când derulezi mai jos în pagină sau când tab-ul e în fundal.
    const pause = () => {
      if (paused) return;
      paused = true;
      cancelAnimationFrame(rafId);
    };
    const resume = () => {
      if (!paused) return;
      paused = false;
      time = new Date(); // resincronizare: fără salt de dt după pauză
      rafId = requestAnimationFrame(animate);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) resume();
      else pause();
    });
    io.observe(stage);

    const onVisibility = () => {
      if (document.hidden) pause();
      else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("gooey", className)}>
      <svg className="gooey-svg" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            {/* pantă mai blândă decât originalul (255/-140 tăia dur → margini
                zimțate); 28/-13 păstrează topirea gooey dar lasă o bandă fină
                de anti-aliasing pe conturul literelor */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 28 -13"
            />
          </filter>
        </defs>
      </svg>

      {/* filtrul se aplică/scoate dinamic din animate(): url(#threshold) DOAR
          în timpul morph-ului, none în repaus → text nativ, crisp */}
      <div ref={stageRef} className="gooey-stage" style={{ filter: "none" }}>
        <span ref={text1Ref} className={cn("gooey-text", textClassName)} />
        <span ref={text2Ref} className={cn("gooey-text", textClassName)} />
      </div>
    </div>
  );
}
