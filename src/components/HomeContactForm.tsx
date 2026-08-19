import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
} from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Clock,
  Mail,
  Instagram,
  Tag,
  BookOpen,
} from "lucide-react";
import { IconCheck, IconClose, IconChevronDown } from "./PremiumIcons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PhoneField } from "./PhoneField";
import { RevealCard } from "./HomeReveal";

import "../pages/Contact.css";
import "./HomeContactForm.css";
import "../pages/PhoneSelector.css";

export interface PackageItem {
  id: string;
  category: "services" | "courses";
  label: {
    ro: string;
    en: string;
    ru: string;
  };
}

const PACKAGES: PackageItem[] = [
  {
    id: "basic",
    category: "services",
    label: {
      ro: "Pachet Basic — Design Interior (17€/m²)",
      en: "Basic Package — Interior Design (17€/m²)",
      ru: "Пакет Basic — Дизайн Интерьера (17€/м²)"
    }
  },
  {
    id: "tehnic",
    category: "services",
    label: {
      ro: "Pachet Tehnic — Design Interior Complet (28€/m²)",
      en: "Technical Package — Complete Interior Design (28€/m²)",
      ru: "Пакет Tehnic — Полный Дизайн Интерьера (28€/м²)"
    }
  },
  {
    id: "signature",
    category: "services",
    label: {
      ro: "Pachet Signature — Design Rezidențial Premium (37€/m²)",
      en: "Signature Package — Premium Residential Design (37€/m²)",
      ru: "Пакет Signature — Премиум Жилой Дизайн (37€/м²)"
    }
  },
  {
    id: "grup-incepatori",
    category: "courses",
    label: {
      ro: "NOMA School — Curs Începători (Grup)",
      en: "NOMA School — Beginners Course (Group)",
      ru: "NOMA School — Курс для начинающих (Группа)"
    }
  },
  {
    id: "individual-avansat",
    category: "courses",
    label: {
      ro: "NOMA School — Curs Avansați (Individual 1:1)",
      en: "NOMA School — Advanced Course (1:1 Individual)",
      ru: "NOMA School — Продвинутый курс (Индивидуально 1:1)"
    }
  },
  {
    id: "3dsmax-grup",
    category: "courses",
    label: {
      ro: "NOMA School — 3Ds Max (Grup)",
      en: "NOMA School — 3Ds Max (Group)",
      ru: "NOMA School — 3Ds Max (Группа)"
    }
  }
];

const FORM_FIELDS = ["name", "email", "phone", "message"] as const;

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

const SPRING_UI = { type: "spring", stiffness: 260, damping: 30 } as const;
const SPRING_POP = { type: "spring", stiffness: 350, damping: 24 } as const;

/* ── Optimized Magnetic Effect ──
   Componentă LOCALĂ, separată de components/Magnetic.tsx (nu-l importă pe
   acela) — capcană găsită: adăugasem `className` la un <Magnetic> de aici
   crezând că ajunge la componenta din fișierul comun; de fapt tipul ăsta
   local n-avea deloc prop-ul, deci era ignorat silențios (esbuild nu
   type-checkează în dev, nu a dat nicio eroare). */
const Magnetic = ({
  children,
  strength = 0.25,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    x.set(distanceX * strength);
    y.set(distanceY * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
    >
      {children}
    </motion.div>
  );
};

const chipVariant = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: SPRING_POP,
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    filter: "blur(4px)",
    transition: { duration: 0.2 },
  },
};

interface PreviewFile {
  id: string;
  name: string;
  preview: string;
  size: number;
}

const MAX_FILES = 5;
const ACCEPT = "image/*";

const isNameValid = (value: string) => value.trim().length >= 2;
const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhoneValid = (value: string) => value.replace(/\D/g, "").length >= 10;
const isMessageValid = (value: string) => value.trim().length >= 10;

const HomeContactForm = () => {
  const { t, language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const progressId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t.contact.nameError }),
        email: z.string().email({ message: t.contact.emailError }),
        phone: z.string().min(6, { message: t.contact.phoneError }),
        message: z
          .string()
          .min(10, { message: t.contact.messageError })
          .max(8000),
        terms: z.boolean().refine((val) => val === true, {
          message: t.contact.termsError,
        }),
        selectedPackage: z.string().optional(),
      }),
    [t]
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      terms: false,
      selectedPackage: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const errors = form.formState.errors;
  const watchedValues = form.watch();

  useEffect(() => {
    const validators: Record<(typeof FORM_FIELDS)[number], (value: string) => boolean> = {
      name: isNameValid,
      email: isEmailValid,
      phone: isPhoneValid,
      message: isMessageValid,
    };

    const filled = FORM_FIELDS.filter((fieldName) => {
      const value = watchedValues[fieldName as keyof FormValues];
      return typeof value === "string" && validators[fieldName](value);
    }).length + (watchedValues.terms ? 1 : 0);

    setProgress((filled / (FORM_FIELDS.length + 1)) * 100);
  }, [watchedValues]);

  // Only clear the timer on unmount
  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // Revoke object URLs only when previews array changes
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [previews]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      if (previews.length >= MAX_FILES) {
        toast.error(t.contact.maxFilesError);
        return;
      }

      const accepted = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, MAX_FILES - previews.length);

      if (!accepted.length) return;

      setPreviews((prev) => [
        ...prev,
        ...accepted.map((file) => ({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          preview: URL.createObjectURL(file),
          size: file.size,
        })),
      ]);
    },
    [previews.length, t]
  );

  const removePreview = useCallback((id: string) => {
    setPreviews((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const triggerShake = useCallback((fieldId: string) => {
    const el = document.getElementById(fieldId)?.closest(".form-field-modern");
    if (el) {
      el.classList.remove("shake-error");
      void (el as HTMLElement).offsetWidth; // force reflow
      el.classList.add("shake-error");
      setTimeout(() => el.classList.remove("shake-error"), 600);
    }
  }, []);

  const focusField = useCallback((fieldId: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(fieldId) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      element?.focus();
    });
  }, []);

  const createEnterHandler = useCallback(
    (currentField: keyof FormValues, nextFieldId?: string, allowSubmit = false) => {
      return async (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        if (currentField === "message") return;

        event.preventDefault();

        const isValid = await form.trigger(currentField);
        if (!isValid) {
          triggerShake(`h-${currentField}`);
          return;
        }

        if (nextFieldId) {
          focusField(nextFieldId);
          return;
        }

        if (allowSubmit) {
          formRef.current?.requestSubmit();
        }
      };
    },
    [form, focusField, triggerShake]
  );

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const activeLang = language === "en" || language === "ru" ? language : "ro";
      const match = data.selectedPackage
        ? PACKAGES.find((item) => item.id === data.selectedPackage)
        : null;
      const packageLabel = match ? match.label[activeLang] : "";

      const finalMessage = packageLabel
        ? `[Pachet/Curs selectat: ${packageLabel}]\n\n${data.message}`
        : data.message;

      const submissionPayload = {
        ...data,
        message: finalMessage,
        pachet_selectat: packageLabel,
      };

      console.log("Home form submission payload sent:", submissionPayload);
      setIsPending(true);
      if (successTimer.current) {
        clearTimeout(successTimer.current);
        successTimer.current = undefined;
      }
      try {
        await new Promise((r) => setTimeout(r, 1800));

        form.clearErrors();
        setIsPending(false);
        setIsSuccess(true);
        form.reset();
        setPreviews([]);
        setProgress(0);

        successTimer.current = setTimeout(() => {
          setIsSuccess(false);
          form.clearErrors();
        }, 6000);
      } catch {
        setIsPending(false);
        toast.error(t.contact.errorTitle ?? "Error");
      }
    },
    [form, t, language]
  );

  const onInvalid = useCallback(() => {
    const card = formRef.current?.closest(".contact-content__inner-home");
    if (card) {
      card.classList.remove("shake-error");
      void (card as HTMLElement).offsetWidth;
      card.classList.add("shake-error");
      setTimeout(() => card.classList.remove("shake-error"), 600);
    }
  }, []);

  const activeLang = language === "en" || language === "ru" ? language : "ro";
  const selectedPkgValue = form.watch("selectedPackage");
  const selectedPkgMatch = selectedPkgValue
    ? PACKAGES.find((p) => p.id === selectedPkgValue)
    : null;
  const selectedLabel = selectedPkgMatch ? selectedPkgMatch.label[activeLang] : "";
  const selectedPkgCategory = selectedPkgMatch ? selectedPkgMatch.category : "";

  /* Exact aceleași 4 carduri ca pe /contact (Locație, Program, Email,
     Instagram) — fără harta embed de dinainte, cerut explicit de Vlad
     ("faceti fix ca la pagina de contact"). */
  const infoItems = useMemo(
    () => [
      {
        Icon: MapPin,
        title: t.contact.cardLocationLabel,
        value: t.contact.visitAddress,
        href: `https://maps.google.com?q=${encodeURIComponent(t.contact.visitAddress)}`,
        external: true,
        // FĂRĂ truncate: adresa are 2 rânduri INTENȚIONATE (stradă + oraș,
        // `\n` în text), nu un wrap accidental — nu se taie, e deja corectă.
        truncate: false,
      },
      {
        Icon: Clock,
        title: t.contact.cardHoursLabel,
        value: t.contact.cardHoursValue,
        href: undefined as string | undefined,
        external: false,
        // la fel — „Luni–Vineri" + „9:00–18:00" sunt 2 rânduri intenționate
        truncate: false,
      },
      {
        Icon: Mail,
        title: t.contact.cardEmailLabel,
        value: t.contact.cardEmailValue,
        href: `mailto:${t.contact.cardEmailValue}`,
        external: false,
        truncate: true,
      },
      {
        Icon: Instagram,
        title: t.contact.cardInstagramLabel,
        value: t.contact.cardInstagramValue,
        href: "https://www.instagram.com/noma.studio.design/",
        external: true,
        truncate: true,
      },
    ],
    [t]
  );

  const renderInfoCard = (item: (typeof infoItems)[number], idx: number) => (
    <motion.a
      key={idx}
      href={item.href}
      target={item.href && item.external ? "_blank" : undefined}
      rel={item.href && item.external ? "noopener noreferrer" : undefined}
      className={cn("contact-card-home", !item.href && "contact-card-home--static")}
      whileHover={shouldReduceMotion ? {} : { y: -3 }}
    >
      <span className="contact-card__text-home">
        <span className="contact-card__title-home">{item.title}</span>
        <span className={cn("contact-card__value-home", item.truncate && "contact-card__value-home--truncate")}>
          {item.value}
        </span>
      </span>
      <span className="contact-card__icon-home">
        <item.Icon size={22} strokeWidth={1.5} />
      </span>
    </motion.a>
  );

  return (
    <section ref={sectionRef} className="home-contact-modern" id="home-contact">
      <div className="luxury-bg-highlight" aria-hidden="true" />
      
      <div className="home-contact-container">
        <div className="home-contact-modern-grid">
          {/* LEFT: Editorial Content — titlu scurt, la subiect (cerut explicit:
              „scoateți acel text", titlul vechi era lung/descriptiv, nu un
              titlu — acum urmează tiparul celorlalte secțiuni: scurt + em
              pe cuvântul-cheie, fără paragraf explicativ dedesubt) */}
          <div className="home-contact-editorial">
            <SectionHeader
              title={t.contact.homeSectionHeading.split('*').map((part, i) =>
                i % 2 === 1 ? <em key={i}>{part}</em> : part
              )}
              centered={true}
              className="home-contact-header"
              hideLine={true}
            />
          </div>

          {/* Iconițe contact — pe desktop, afișate în prima coloană sub text */}
          <div className="contact-info-grid-home desktop-only">
            {/* "N"-ul din logo, desenat peste carduri — aceeași tehnică ca pe
                /contact (silueta glifului dilatată/scăzută din ea însăși,
                ca să nu apară contururi interioare suprapuse la intersecții).
                Doar în instanța desktop — varianta mobilă (mai jos în fișier)
                nu-l primește. */}
            <svg
              className="home-contact-mark"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <filter
                  id="noma-home-mark-outline"
                  x="-5%"
                  y="-5%"
                  width="110%"
                  height="110%"
                  colorInterpolationFilters="sRGB"
                >
                  <feMorphology
                    in="SourceAlpha"
                    operator="dilate"
                    radius="1"
                    result="grown"
                  />
                  <feComposite
                    in="grown"
                    in2="SourceAlpha"
                    operator="out"
                    result="ring"
                  />
                  <feFlood floodColor="currentColor" result="ink" />
                  <feComposite in="ink" in2="ring" operator="in" />
                </filter>
              </defs>

              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                filter="url(#noma-home-mark-outline)"
              >
                N
              </text>
            </svg>

            <RevealCard className="contact-info-grid__inner-home">
              {infoItems.map((item, idx) =>
                renderInfoCard(item, idx)
              )}
            </RevealCard>
          </div>

          {/* Iconițe contact — pe mobil, deasupra formularului (cerut explicit,
              erau sub formular). MUTAT să fie COPIL DIRECT al grid-ului
              (.home-contact-modern-grid), nu imbricat în .home-contact-form-wrapper
              — altfel `grid-area:icons` (CSS, sub 1100px) n-are niciun efect,
              elementul rămâne blocat în ordinea din DOM (în interiorul
              formularului). Clase `-home` (NU `.contact-card`/`.contact-info-grid`
              bare) — alea sunt refolosite nescopat în Contact.css (pagina
              /contact), exact tiparul de coliziune deja găsit și reparat la
              butonul de submit. */}
          <div className="mobile-only-contact-info">
            <div className="contact-info-grid-home">
              <RevealCard className="contact-info-grid__inner-home">
                {infoItems.map((item, idx) =>
                  renderInfoCard(item, idx)
                )}
              </RevealCard>
            </div>
          </div>

          {/* RIGHT: EXACT Form from Contact.tsx — un SINGUR RevealCard pe tot
              panoul (progress + form ÎNTREG), nu câte unul pe fiecare câmp:
              cerut explicit, „formularul să apară tot deodată", nu în
              cascadă câmp-cu-câmp. */}
          <div className="home-contact-form-wrapper">
            <RevealCard className="contact-content__inner-home">
              <div
              id={progressId}
              className="form-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t.contact.progressLabel}
            >
              <motion.div
                className="form-progress__bar"
                animate={{ width: `${progress}%` }}
                transition={SPRING_UI}
              />
            </div>

            <Form {...form}>
                <form
                  id="homeContactFormModern"
                  ref={formRef}
                  onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                  className="contact-form-modern"
                  noValidate
                  aria-describedby={progressId}
                >
                  <FormField
                    control={form.control}
                    name="selectedPackage"
                    render={({ field }) => (
                        <div ref={containerRef} className="luxury-select-container">
                          <input type="hidden" name="selected_package" value={selectedLabel} />
                          {field.value ? (
                            <div className="selected-package-badge">
                              <div className="selected-package-badge__content">
                                <div className="selected-package-badge__icon">
                                  {selectedPkgCategory === "courses" ? (
                                    <BookOpen size={13} strokeWidth={2} />
                                  ) : (
                                    <Tag size={13} strokeWidth={2} />
                                  )}
                                </div>
                                <span className="selected-package-badge__text">
                                  {activeLang === "ro" && <>Pachet selectat: <strong>{selectedLabel}</strong></>}
                                  {activeLang === "en" && <>Selected package: <strong>{selectedLabel}</strong></>}
                                  {activeLang === "ru" && <>Выбранный пакет: <strong>{selectedLabel}</strong></>}
                                </span>
                              </div>
                              <button
                                type="button"
                                className="selected-package-badge__remove"
                                onClick={() => {
                                  field.onChange("");
                                }}
                                aria-label="Remove selection"
                              >
                                <IconClose size={12} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div
                                className={cn(
                                  "luxury-select-trigger",
                                  isSelectOpen && "luxury-select-trigger--open"
                                )}
                                onClick={() => setIsSelectOpen(!isSelectOpen)}
                              >
                                <div className="luxury-select-trigger__content">
                                  <div className="luxury-select-trigger__icon">
                                    <Tag size={14} strokeWidth={1.5} />
                                  </div>
                                  <span>
                                    {activeLang === "ro" && "Alege un pachet sau curs (opțional)"}
                                    {activeLang === "en" && "Choose a package or course (optional)"}
                                    {activeLang === "ru" && "Выберите пакет или курс (опционально)"}
                                  </span>
                                </div>
                                <div className="luxury-select-trigger__chevron">
                                  <IconChevronDown size={14} strokeWidth={2} />
                                </div>
                              </div>

                              <AnimatePresence>
                                {isSelectOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scaleY: 0.95 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    exit={{ opacity: 0, scaleY: 0.95 }}
                                    transition={{ duration: 0.25, ease: LUXURY_EASE }}
                                    className="luxury-select-dropdown"
                                  >
                                    {/* Services Group */}
                                    <div className="luxury-select-group">
                                      <div className="luxury-select-group-title">
                                        {activeLang === "ro" && "Servicii Design Interior"}
                                        {activeLang === "en" && "Interior Design Services"}
                                        {activeLang === "ru" && "Дизайн Интерьера"}
                                      </div>
                                      {PACKAGES.filter((p) => p.category === "services").map((pkg) => (
                                        <div
                                          key={pkg.id}
                                          className={cn(
                                            "luxury-select-option",
                                            field.value === pkg.id && "luxury-select-option--selected"
                                          )}
                                          onClick={() => {
                                            field.onChange(pkg.id);
                                            setIsSelectOpen(false);
                                          }}
                                        >
                                          <span>{pkg.label[activeLang]}</span>
                                          {field.value === pkg.id && (
                                            <div className="luxury-select-option__check">
                                              <IconCheck size={13} strokeWidth={3} />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Courses Group */}
                                    <div className="luxury-select-group">
                                      <div className="luxury-select-group-title">
                                        {activeLang === "ro" && "NOMA School"}
                                        {activeLang === "en" && "NOMA School Courses"}
                                        {activeLang === "ru" && "Курсы NOMA School"}
                                      </div>
                                      {PACKAGES.filter((p) => p.category === "courses").map((pkg) => (
                                        <div
                                          key={pkg.id}
                                          className={cn(
                                            "luxury-select-option",
                                            field.value === pkg.id && "luxury-select-option--selected"
                                          )}
                                          onClick={() => {
                                            field.onChange(pkg.id);
                                            setIsSelectOpen(false);
                                          }}
                                        >
                                          <span>{pkg.label[activeLang]}</span>
                                          {field.value === pkg.id && (
                                            <div className="luxury-select-option__check">
                                              <IconCheck size={13} strokeWidth={3} />
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <Input
                              id="h-name"
                              placeholder={t.contact.namePlaceholder}
                              className={cn("form-input-modern", !isSuccess && errors.name && "error")}
                              {...field}
                              onKeyDown={createEnterHandler("name", "h-email")}
                            />
                          </FormControl>
                          <AnimatePresence mode="wait">
                            {!isSuccess && errors.name && (
                              <motion.div
                                key="err-name"
                                initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <FormMessage className="form-error-message" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <Input
                              id="h-email"
                              type="email"
                              placeholder={t.contact.emailPlaceholder}
                              className={cn("form-input-modern", !isSuccess && errors.email && "error")}
                              {...field}
                              onKeyDown={createEnterHandler("email", "h-phone")}
                            />
                          </FormControl>
                          <AnimatePresence mode="wait">
                            {!isSuccess && errors.email && (
                              <motion.div
                                key="err-email"
                                initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <FormMessage className="form-error-message" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <PhoneField
                              id="h-phone"
                              value={field.value}
                              onChange={field.onChange}
                              hasError={!isSuccess && !!errors.phone}
                              placeholder={t.contact.phonePlaceholder}
                              onKeyDown={createEnterHandler("phone", "h-message")}
                            />
                          </FormControl>
                          <AnimatePresence mode="wait">
                            {!isSuccess && errors.phone && (
                              <motion.div
                                key="err-phone"
                                initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <FormMessage className="form-error-message" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem className="form-field-modern form-field-modern--textarea">
                          <FormControl>
                            <Textarea
                              id="h-message"
                              placeholder={t.contact.messagePlaceholder}
                              className={cn("form-textarea-modern", !isSuccess && errors.message && "error")}
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <AnimatePresence mode="wait">
                            {!isSuccess && errors.message && (
                              <motion.div
                                key="err-message"
                                initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              >
                                <FormMessage className="form-error-message" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </FormItem>
                    )}
                  />

                    <label
                      htmlFor="home-file-upload"
                      className={cn(
                        "inspiration-upload-area",
                        isDragging && "inspiration-upload-area--drag"
                      )}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                    >
                      <div className="inspiration-upload-inner" aria-hidden="true">
                        <div className="inspiration-upload-icon">
                          <ImageIcon size={16} strokeWidth={1.5} />
                        </div>
                        <div className="inspiration-upload-text">
                          <span className="inspiration-upload-title">
                            {t.contact.uploadTitle}
                          </span>
                          <span className="inspiration-upload-sub">
                            {t.contact.uploadSub}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {previews.length > 0 && (
                          <motion.div
                            className="inspiration-preview"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: LUXURY_EASE }}
                          >
                            {previews.map((preview) => (
                              <motion.div
                                key={preview.id}
                                className="inspiration-chip"
                                variants={chipVariant}
                                initial="hidden"
                                animate="show"
                                exit="exit"
                              >
                                <img src={preview.preview} alt="" />
                                <span>
                                  {preview.name.length > 18
                                    ? `${preview.name.slice(0, 15)}...`
                                    : preview.name}
                                </span>
                                <button
                                  type="button"
                                  className="inspiration-chip-remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePreview(preview.id);
                                  }}
                                >
                                  <IconClose size={10} strokeWidth={2.5} />
                                </button>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <input
                        id="home-file-upload"
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPT}
                        onChange={(e) => handleFiles(e.target.files)}
                        className="visually-hidden"
                      />
                    </label>

                  <motion.div
                    className="form-terms-container"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem className="form-field-modern form-field-modern--terms">
                          <div className="form-terms-wrapper">
                            <label className="form-terms-label">
                              <input
                                id="contact-terms-check"
                                type="checkbox"
                                className="form-terms-checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  field.onChange(e);
                                  form.trigger("terms");
                                }}
                              />
                              <span className="form-terms-text">
                                {t.contact.privacyConsent}
                              </span>
                            </label>
                          </div>
                          <FormMessage className="form-error-message form-error-message--terms" />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  {/* `-home`: `.form-actions-row`/`.form-toast` sunt refolosite
                      NESCOPAT în Contact.css (pagina /contact, preîncărcată
                      automat aici) — exact coliziunea deja găsită și reparată
                      la `.btn-submit-modern`/`.contact-card`. Contact.css avea
                      `flex-wrap:wrap` fără media query, deci-mi bătea regula
                      `nowrap` de desktop, indiferent de breakpoint. */}
                  <div className="form-actions-row-home">
                    <Magnetic strength={0.2} className="btn-submit-magnetic">
                      <Button
                        type="submit"
                        disabled={isPending}
                        /* `btn-submit-home`, NU `btn-submit-modern`: clasa aia e
                           refolosită NESCOPATĂ (bare selector) în Contact.css,
                           pagina care se preîncarcă automat pe homepage la 2s
                           după montare (App.tsx) — stilul de-acolo (rotație,
                           verde de succes, spinner) suprascria orice se scria
                           aici, imprevizibil, în funcție de ordinea de load. */
                        className={cn("btn-submit-home", isSuccess && "success")}
                      >
                        <AnimatePresence mode="wait">
                          {isPending ? (
                            <motion.span
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="btn-submit-content"
                            >
                              <Loader2 className="btn-loader-svg btn-icon-svg" size={16} aria-hidden="true" />
                              <span>
                                {activeLang === "ro" && "Se trimite..."}
                                {activeLang === "en" && "Sending..."}
                                {activeLang === "ru" && "Отправка..."}
                              </span>
                            </motion.span>
                          ) : isSuccess ? (
                            <motion.span
                              key="sent"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="btn-submit-content"
                            >
                              <span>{t.contact.sent}</span>
                              <IconCheck size={14} strokeWidth={2.8} />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="idle"
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0 }}
                              className="btn-submit-content"
                            >
                              <span className="btn-text-home--desktop">
                                {t.contact.submitDesktop}
                              </span>
                              <span className="btn-text-home--mobile">
                                {t.contact.submitMobile}
                              </span>
                              <Send size={14} strokeWidth={2.4} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>
                    </Magnetic>
                  </div>
                </form>
            </Form>
          </RevealCard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeContactForm;
