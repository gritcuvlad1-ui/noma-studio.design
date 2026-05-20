import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
} from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  Check,
  Send,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Image as ImageIcon,
  X,
  Tag,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import SectionHeader from "../components/SectionHeader";
import LuxuryDivider from "../components/LuxuryDivider";
import { PhoneField } from "../components/PhoneField";


import "./Contact.css";
import "./PhoneSelector.css";

const SITE_URL = "https://nomastudio.md";
const OG_IMAGE = `${SITE_URL}/og-contact.jpg`;
const MAX_FILES = 5;
const ACCEPT = "image/*";
const FORM_FIELDS = ["name", "email", "phone", "message"] as const;

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

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;
const LUXURY_Y = 52;
const LUXURY_BLUR = "6px";

const SPRING_UI = { type: "spring", stiffness: 260, damping: 30 } as const;
const SPRING_POP = { type: "spring", stiffness: 350, damping: 24 } as const;

/* ── Optimized Magnetic Effect (GPU-Accelerated) ── */
const Magnetic = ({
  children,
  strength = 0.25,
}: {
  children: React.ReactNode;
  strength?: number;
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
    >
      {children}
    </motion.div>
  );
};

const fadeUp = {
  hidden: { opacity: 0, y: LUXURY_Y, filter: `blur(${LUXURY_BLUR})` },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: LUXURY_EASE },
  },
};

const noMotion = {
  hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: LUXURY_Y, filter: `blur(${LUXURY_BLUR})` },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: LUXURY_EASE },
  },
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




const isNameValid = (value: string) => value.trim().length >= 2;
const isEmailValid = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhoneValid = (value: string) => value.replace(/\D/g, "").length >= 10;
const isMessageValid = (value: string) => value.trim().length >= 10;

const Contact = () => {
  const { t, language } = useLanguage();
  const shouldReduceMotion = useReducedMotion();

  const progressId = useId();
  const formRef = useRef<HTMLFormElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchParams] = useSearchParams();
  const packageParam = searchParams.get("package");
  const courseParam = searchParams.get("course");

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sectionInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-20px" });

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

  // Pre-populate package from query params
  useEffect(() => {
    const p = packageParam || courseParam;
    if (p) {
      const match = PACKAGES.find((item) => item.id === p);
      if (match) {
        form.setValue("selectedPackage", match.id);
      }
    }
  }, [packageParam, courseParam, form]);

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

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
    };
  }, [previews]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
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
    (
      currentField: keyof FormValues,
      nextFieldId?: string,
      allowSubmit = false
    ) => {
      return async (
        event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        if (event.key !== "Enter" || event.shiftKey) return;

        event.preventDefault();

        const isValid = await form.trigger(currentField);
        if (!isValid) return;

        if (nextFieldId) {
          focusField(nextFieldId);
          return;
        }

        if (allowSubmit) {
          formRef.current?.requestSubmit();
        }
      };
    },
    [form, focusField]
  );

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

      console.log("Form submission payload sent to Gmail simulation:", submissionPayload);
      setIsPending(true);
      // Cancel any existing success timer
      if (successTimer.current) {
        clearTimeout(successTimer.current);
        successTimer.current = null;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1800));

        setIsPending(false);
        setIsSuccess(true);
        form.reset();

        setPreviews((prev) => {
          prev.forEach((item) => URL.revokeObjectURL(item.preview));
          return [];
        });

        setProgress(0);

        successTimer.current = setTimeout(() => {
          setIsSuccess(false);
          form.clearErrors(); // Ensure errors don't reappear after reset
        }, 6000);
      } catch {
        setIsPending(false);
        toast.error(t.contact.errorTitle ?? "Error", {
          description: t.contact.errorDesc ?? "Something went wrong.",
        });
      }
    },
    [form, t, language]
  );

  const infoItems = useMemo(
    () => [
      {
        Icon: MapPin,
        label: t.contact.visitAddress,
        href: `https://maps.google.com?q=${encodeURIComponent(t.contact.visitAddress)}`,
        ariaLabel: `${t.contact.visitLabel} ${t.contact.visitAddress}`,
      },
      {
        Icon: Phone,
        label: t.contact.callInfo.split(" ")[0],
        href: `tel:${t.contact.callInfo.split(" ")[0].replace(/\s/g, "")}`,
        ariaLabel: `${t.contact.callLabel} ${t.contact.callInfo.split(" ")[0]}`,
      },
      {
        Icon: Mail,
        label: t.contact.writeInfo.split(" ")[0],
        href: `mailto:${t.contact.writeInfo.split(" ")[0]}`,
        ariaLabel: `${t.contact.writeLabel} ${t.contact.writeInfo.split(" ")[0]}`,
      },
    ],
    [t]
  );

  const schemaData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "ContactPage",
          "@id": `${SITE_URL}/contact#webpage`,
          url: `${SITE_URL}/contact`,
          name: "Contact | NOMA Studio",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: t.nav.home,
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: t.nav.contact,
                item: `${SITE_URL}/contact`,
              },
            ],
          },
        },
        {
          "@type": "LocalBusiness",
          "@id": `${SITE_URL}/#business`,
          name: "NOMA Studio",
          url: SITE_URL,
          image: OG_IMAGE,
          description: t.footer.contactDesc,
          address: {
            "@type": "PostalAddress",
            streetAddress: "Strada Designului 24",
            addressLocality: "Chișinău",
            addressCountry: "MD",
          },
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: "09:00",
            closes: "18:00",
          },
          priceRange: "$$",
        },
      ],
    }),
    [t]
  );

  const mv = shouldReduceMotion ? noMotion : fadeUp;

  const selectedPkgValue = form.watch("selectedPackage");
  const activeLang = language === "en" || language === "ru" ? language : "ro";
  const selectedPkgMatch = selectedPkgValue
    ? PACKAGES.find((p) => p.id === selectedPkgValue)
    : null;
  const selectedLabel = selectedPkgMatch ? selectedPkgMatch.label[activeLang] : "";
  const selectedPkgCategory = selectedPkgMatch ? selectedPkgMatch.category : "";

  return (
    <>
      <Helmet>
        <title>{t.nav.contact} | NOMA Studio | Design Interior Chișinău</title>
        <meta name="description" content={t.footer.contactDesc} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/contact`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${t.nav.contact} | NOMA Studio`} />
        <meta property="og:description" content={t.footer.contactDesc} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content={`${SITE_URL}/contact`} />
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
      </Helmet>

      <Toaster position="top-center" richColors />

      <main
        ref={sectionRef}
        className="contact-section-modern"
        role="main"
        aria-label={t.nav.contact}
        id="main-content"
      >
        <div className="contact-content">
          <SectionHeader
            title={t.contact.pageTitle}
            className="contact-header-compact"
          />

          <motion.div
            className="contact-content__inner"
            variants={mv}
            initial="hidden"
            animate={sectionInView ? "show" : "hidden"}
            transition={{ duration: 0.72, delay: 0.18, ease: LUXURY_EASE }}
          >
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
                id="contactFormModern"
                ref={formRef}
                onSubmit={form.handleSubmit(onSubmit)}
                className="contact-form-modern"
                noValidate
                aria-describedby={progressId}
              >
                <FormField
                  control={form.control}
                  name="selectedPackage"
                  render={({ field }) => (
                    <motion.div
                      variants={mv}
                      initial="hidden"
                      animate={sectionInView ? "show" : "hidden"}
                      transition={{ duration: 0.48, delay: 0.15, ease: LUXURY_EASE }}
                    >
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
                              <X size={12} strokeWidth={2.5} />
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
                                <ChevronDown size={14} strokeWidth={2} />
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
                                            <Check size={13} strokeWidth={3} />
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
                                            <Check size={13} strokeWidth={3} />
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
                    </motion.div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <motion.div
                      variants={mv}
                      initial="hidden"
                      animate={sectionInView ? "show" : "hidden"}
                      transition={{ duration: 0.48, delay: 0.22, ease: LUXURY_EASE }}
                    >
                      <FormItem className="form-field-modern" aria-label="client name">
                        <span className="visually-hidden">{t.contact.nameLabel}</span>
                        <FormControl>
                          <Input
                            id="contactname"
                            placeholder={t.contact.namePlaceholder}
                            className={cn("form-input-modern", !isSuccess && errors.name && "error")}
                            autoComplete="name"
                            aria-required="true"
                            aria-invalid={!!errors.name}
                            {...field}
                            onKeyDown={createEnterHandler("name", "contactemail")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {!isSuccess && errors.name && (
                            <motion.div
                              key="err-name"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FormMessage className="form-error-message" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    </motion.div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <motion.div
                      variants={mv}
                      initial="hidden"
                      animate={sectionInView ? "show" : "hidden"}
                      transition={{ duration: 0.48, delay: 0.28, ease: LUXURY_EASE }}
                    >
                      <FormItem className="form-field-modern" aria-label="client email">
                        <span className="visually-hidden">{t.contact.emailLabel}</span>
                        <FormControl>
                          <Input
                            id="contactemail"
                            type="email"
                            placeholder={t.contact.emailPlaceholder}
                            className={cn("form-input-modern", !isSuccess && errors.email && "error")}
                            autoComplete="email"
                            aria-required="true"
                            aria-invalid={!!errors.email}
                            {...field}
                            onKeyDown={createEnterHandler("email", "clientphone")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {!isSuccess && errors.email && (
                            <motion.div
                              key="err-email"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FormMessage className="form-error-message" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    </motion.div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <motion.div
                      variants={mv}
                      initial="hidden"
                      animate={sectionInView ? "show" : "hidden"}
                      transition={{ duration: 0.48, delay: 0.34, ease: LUXURY_EASE }}
                    >
                      <FormItem className="form-field-modern" aria-label="client phone">
                        <label htmlFor="clientphone" className="visually-hidden">
                          {t.contact.phoneLabel}
                        </label>

                        <FormControl>
                          <PhoneField
                            id="clientphone"
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!isSuccess && !!errors.phone}
                            placeholder={t.contact.phonePlaceholder}
                            onKeyDown={createEnterHandler("phone", "projectvision")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {!isSuccess && errors.phone && (
                            <motion.div
                              key="err-phone"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FormMessage className="form-error-message" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    </motion.div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <motion.div
                      variants={mv}
                      initial="hidden"
                      animate={sectionInView ? "show" : "hidden"}
                      transition={{ duration: 0.48, delay: 0.4, ease: LUXURY_EASE }}
                    >
                      <FormItem
                        className="form-field-modern form-field-modern--textarea"
                        aria-label="project vision"
                      >
                        <label htmlFor="projectvision" className="visually-hidden">
                          {t.contact.messageLabel}
                        </label>

                        <FormControl>
                          <Textarea
                            id="projectvision"
                            placeholder={t.contact.messagePlaceholder}
                            className={cn(
                              "form-textarea-modern",
                              !isSuccess && errors.message && "error"
                            )}
                            rows={4}
                            spellCheck
                            maxLength={8000}
                            aria-required="true"
                            aria-invalid={!!errors.message}
                            {...field}
                            onKeyDown={createEnterHandler("message", "contact-terms-check")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {!isSuccess && errors.message && (
                            <motion.div
                              key="err-message"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.2 }}
                            >
                              <FormMessage className="form-error-message" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </FormItem>
                    </motion.div>
                  )}
                />

                <motion.div
                  variants={mv}
                  initial="hidden"
                  animate={sectionInView ? "show" : "hidden"}
                  transition={{ duration: 0.5, delay: 0.46, ease: LUXURY_EASE }}
                >
                  <label
                    htmlFor="contact-file-upload"
                    className={cn(
                      "inspiration-upload-area",
                      isDragging && "inspiration-upload-area--drag"
                    )}
                    aria-label={t.contact.uploadTitle}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    <div className="inspiration-upload-inner" aria-hidden="true">
                      <div className="inspiration-upload-icon">
                        <ImageIcon size={28} strokeWidth={1.2} />
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
                              <img
                                src={preview.preview}
                                alt=""
                                width={20}
                                height={20}
                                loading="lazy"
                              />
                              <span>
                                {preview.name.length > 18
                                  ? `${preview.name.slice(0, 15)}...`
                                  : preview.name}
                              </span>
                              <button
                                type="button"
                                className="inspiration-chip-remove"
                                aria-label={`${t.contact.removeFile} ${preview.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removePreview(preview.id);
                                }}
                              >
                                <X size={10} strokeWidth={2.5} />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
                      id="contact-file-upload"
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT}
                      multiple
                      className="visually-hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={(event) => {
                        handleFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </motion.div>

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
              </form>
            </Form>
          </motion.div>

            <div className="form-actions-row">
              <Magnetic strength={0.2}>
                <Button
                  type="submit"
                  form="contactFormModern"
                  disabled={isPending}
                  className={cn("btn-submit-modern", isSuccess && "success")}
                  aria-live="polite"
                >
                  <AnimatePresence mode="wait">
                    {isPending ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        aria-label={t.contact.sending}
                      >
                        <Loader2 className="btn-loader-svg btn-icon-svg" size={16} aria-hidden="true" />
                      </motion.span>
                    ) : isSuccess ? (
                      <motion.span
                        key="sent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        <span>{t.contact.sent}</span>
                        <Check size={14} strokeWidth={2.8} className="btn-icon-svg" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-2 whitespace-nowrap"
                      >
                        <span className="btn-text--desktop">
                          {t.contact.submitDesktop}
                        </span>
                        <span className="btn-text--mobile">
                          {t.contact.submitMobile}
                        </span>
                        <Send size={14} strokeWidth={2.4} className="btn-icon-svg" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </Magnetic>

              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    className="form-toast"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                    transition={SPRING_UI}
                  >
                    <div className="form-toast__icon" aria-hidden="true">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    <div className="form-toast__body">
                      <p className="form-toast__title">{t.contact.successTitle}</p>
                      <p className="form-toast__text">{t.contact.successDesc}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          <LuxuryDivider delay={0.1} />

          <motion.div
            ref={cardsRef}
            className="contact-info-grid"
            variants={staggerContainer}
            initial="hidden"
            animate={cardsInView ? "show" : "hidden"}
          >
            <div className="contact-info-grid__inner">
              {infoItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  className="contact-card"
                  variants={cardVariant}
                  whileHover={shouldReduceMotion ? {} : { y: -2 }}
                  whileTap={{ scale: 0.975 }}
                  aria-label={item.ariaLabel}
                >
                  <Magnetic strength={0.15}>
                    <span className="contact-card__icon" aria-hidden="true">
                      <item.Icon size={16} strokeWidth={1.5} />
                    </span>
                  </Magnetic>
                  <span className="contact-card__value">{item.label}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default Contact;