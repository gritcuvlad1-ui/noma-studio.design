/* Motorul de animații framer-motion, încărcat SEPARAT de pachetul principal
   (vezi <LazyMotion> în App.tsx). Componentele folosesc `m` (importat ca
   `motion`), care nu aduce motorul cu el. `domMax` (nu `domAnimation`) pentru
   că /curs și pagina de proiect folosesc `drag="x"` (swipe). */
import { domMax } from 'framer-motion';

export default domMax;
