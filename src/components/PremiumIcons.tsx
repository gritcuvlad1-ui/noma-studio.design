/* Iconițe PREMIUM custom, în locul celor generice lucide (X, ChevronDown,
   ChevronLeft/Right, ArrowRight/Left, ZoomIn, Check) — același limbaj vizual
   ca gemul fațetat de la /curs: contur principal + un al doilea contur, mai
   subțire/mai transparent, care sugerează o fațetă/reflexie. currentColor,
   ca fiecare loc de folosire să-și păstreze propria culoare de accent. */

type IconProps = { size?: number; strokeWidth?: number; className?: string };

export const IconClose = ({ size = 18, strokeWidth = 1.6, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M12 3.5V6M12 18V20.5M3.5 12H6M18 12H20.5" stroke="currentColor" strokeWidth={strokeWidth * 0.6} strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const IconChevronDown = ({ size = 14, strokeWidth = 1.8, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M5 9L12 16L19 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6.5L12 10.5L16 6.5" stroke="currentColor" strokeWidth={strokeWidth * 0.6} strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
  </svg>
);

export const IconChevronLeft = ({ size = 24, strokeWidth = 1.6, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconChevronRight = ({ size = 24, strokeWidth = 1.6, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconArrowRight = ({ size = 18, strokeWidth = 2, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 12H19M19 12L13.5 6.5M19 12L13.5 17.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 8.5H14M4 15.5H14" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeLinecap="round" opacity="0.35" />
  </svg>
);

export const IconArrowLeft = ({ size = 20, strokeWidth = 1.6, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M20 12H5M5 12L10.5 6.5M5 12L10.5 17.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 8.5H10M20 15.5H10" stroke="currentColor" strokeWidth={strokeWidth * 0.5} strokeLinecap="round" opacity="0.35" />
  </svg>
);

export const IconZoom = ({ size = 20, strokeWidth = 1.5, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={strokeWidth} />
    <path d="M10.5 7.5V13.5M7.5 10.5H13.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <path d="M15.5 15.5L20.5 20.5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    <circle cx="10.5" cy="10.5" r="4" stroke="currentColor" strokeWidth={strokeWidth * 0.5} opacity="0.35" />
  </svg>
);

export const IconCheck = ({ size = 14, strokeWidth = 2.6, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path d="M4 12.5L9.5 18L20 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 8.5L9.5 14" stroke="currentColor" strokeWidth={strokeWidth * 0.45} strokeLinecap="round" opacity="0.4" />
  </svg>
);
