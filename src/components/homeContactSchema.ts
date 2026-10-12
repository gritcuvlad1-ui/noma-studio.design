import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* Schema de validare a formularului de pe homepage, într-un modul SEPARAT
   (2026-10-12): zod (~250KB sursă) intra în pachetul încărcat la deschiderea
   homepage-ului, deși formularul validează doar la trimitere
   (`mode: "onSubmit"`). HomeContactForm îl importă dinamic, la prima
   validare (și îl preîncarcă în timp liber, după `load`). Regulile și
   mesajele sunt exact cele de dinainte. */
type ContactMessages = {
  nameError: string;
  emailError: string;
  phoneError: string;
  messageError: string;
  termsError: string;
};

export const makeHomeContactResolver = (m: ContactMessages) =>
  zodResolver(
    z.object({
      name: z.string().min(2, { message: m.nameError }),
      email: z.string().email({ message: m.emailError }),
      phone: z.string().min(6, { message: m.phoneError }),
      message: z.string().min(10, { message: m.messageError }).max(8000),
      terms: z.boolean().refine((val) => val === true, {
        message: m.termsError,
      }),
      selectedPackage: z.string().optional(),
    })
  );
