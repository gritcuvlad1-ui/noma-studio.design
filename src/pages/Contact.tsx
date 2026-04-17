import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useId,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
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
  useMotionValue,
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
  Search,
  ChevronDown,
} from "lucide-react";

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

import "./Contact.css";
import "./PhoneSelector.css";

const SITE_URL = "https://nomastudio.md";
const OG_IMAGE = `${SITE_URL}/og-contact.jpg`;
const MAX_FILES = 5;
const ACCEPT = "image/*";
const FORM_FIELDS = ["name", "email", "phone", "message"] as const;

const SPRING_UI = { type: "spring", stiffness: 260, damping: 20 } as const;
const SPRING_SOFT = { type: "spring", stiffness: 100, damping: 15 } as const;
const SPRING_POP = { type: "spring", stiffness: 350, damping: 24 } as const;
const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { ...SPRING_UI, duration: 0.6 },
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
    transition: { staggerChildren: 0.008, delayChildren: 0.01 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_UI,
  },
};

const dropItemVariant = {
  hidden: { opacity: 0, x: -4, filter: "blur(2px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { ...SPRING_UI, mass: 0.8 },
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

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "MD", name: "Moldova", dial: "373", flag: "https://flagcdn.com/md.svg" },
  { code: "RO", name: "Romania", dial: "40", flag: "https://flagcdn.com/ro.svg" },
  { code: "GB", name: "United Kingdom", dial: "44", flag: "https://flagcdn.com/gb.svg" },
  { code: "US", name: "United States", dial: "1", flag: "https://flagcdn.com/us.svg" },
  { code: "DE", name: "Germany", dial: "49", flag: "https://flagcdn.com/de.svg" },
  { code: "FR", name: "France", dial: "33", flag: "https://flagcdn.com/fr.svg" },
  { code: "IT", name: "Italy", dial: "39", flag: "https://flagcdn.com/it.svg" },
  { code: "ES", name: "Spain", dial: "34", flag: "https://flagcdn.com/es.svg" },
];

const DEFAULT_COUNTRY =
  COUNTRIES.find((country) => country.code === "MD") ?? COUNTRIES[0];

interface PhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  placeholder: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function PhoneField({
  value,
  onChange,
  hasError,
  placeholder,
  onKeyDown,
}: PhoneFieldProps) {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [localNumber, setLocalNumber] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!value) {
      setCountry(DEFAULT_COUNTRY);
      setLocalNumber("");
      return;
    }

    const matchedCountry =
      [...COUNTRIES]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((item) => value.startsWith(item.dial)) ?? DEFAULT_COUNTRY;

    setCountry(matchedCountry);
    setLocalNumber(value.slice(matchedCountry.dial.length));
  }, [value]);

  useEffect(() => {
    const fullValue = localNumber.trim()
      ? `${country.dial}${localNumber.replace(/\D/g, "")}`
      : "";
    onChange(fullValue);
  }, [country, localNumber, onChange]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        wrapRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !wrapRef.current) return;

    const updatePosition = () => {
      const rect = wrapRef.current!.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [open]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;

    const query = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.dial.includes(query)
    );
  }, [search]);

  const selectCountry = useCallback((selected: Country) => {
    setCountry(selected);
    setOpen(false);
    setSearch("");
  }, []);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const toggleOpen = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setOpen((prev) => !prev);
  }, []);

  const dropdown = open && typeof document !== "undefined"
    ? createPortal(
        <AnimatePresence mode="wait">
          <motion.div
            key="phone-country-dropdown"
            ref={dropdownRef}
            className="noma-phone-selector-solid"
            role="listbox"
            aria-label="Select country"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={SPRING_POP}
            style={{
              position: "absolute",
              top: coords.top + 6,
              left: coords.left,
              width: coords.width,
              backgroundColor: "#ffffff",
              zIndex: 2147483647,
            }}
          >
            <div className="noma-phone-search-bar">
              <span className="noma-phone-search-icon" aria-hidden="true">
                <Search size={13} strokeWidth={2.1} />
              </span>

              <input
                ref={searchRef}
                type="text"
                className="noma-phone-search-input"
                placeholder="Caută țara..."
                value={search}
                autoComplete="off"
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeDropdown();
                  if (event.key === "Enter" && filteredCountries.length > 0) {
                    event.preventDefault();
                    selectCountry(filteredCountries[0]);
                  }
                }}
              />

              {search && (
                <button
                  type="button"
                  className="noma-phone-search-clear"
                  aria-label="Clear search"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setSearch("")}
                >
                  <X size={10} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <motion.ul
              ref={listRef}
              className="noma-phone-list-container"
              aria-label="Countries"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {filteredCountries.length === 0 ? (
                <li className="noma-phone-empty-state">Nicio țară găsită</li>
              ) : (
                filteredCountries.map((item) => (
                  <motion.li
                    key={item.code}
                    role="option"
                    variants={dropItemVariant}
                    aria-selected={item.code === country.code}
                    className={cn(
                      "noma-phone-item-row",
                      item.code === country.code && "noma-phone-item-row--selected"
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCountry(item)}
                    whileHover={{ x: 4 }}
                  >
                    <span className="noma-phone-flag-cell" aria-hidden="true">
                      <img src={item.flag} alt="" loading="lazy" />
                    </span>
                    <span className="noma-phone-name-cell">{item.name}</span>
                    <span className="noma-phone-code-cell">+{item.dial}</span>
                  </motion.li>
                ))
              )}
            </motion.ul>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <div className="noma-phone-container">
      <div
        ref={wrapRef}
        className={cn(
          "noma-phone-wrap",
          open && "noma-phone-wrap--open",
          hasError && "noma-phone-wrap--error"
        )}
      >
        <button
          type="button"
          className="noma-phone-trigger-btn"
          aria-label={`Selected country ${country.name} +${country.dial}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggleOpen}
        >
          <span className="noma-phone-flag-preview" aria-hidden="true">
            <img src={country.flag} alt="" />
          </span>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={cn(
              "noma-phone-arrow-icon",
              open && "noma-phone-arrow-icon--open"
            )}
            aria-hidden="true"
          />
        </button>

        <input
          id="clientphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          className="noma-phone-main-input"
          placeholder={placeholder}
          value={localNumber}
          onChange={(event) => {
            const cleaned = event.target.value.replace(/[^\d\s\-()+]/g, "");
            setLocalNumber(cleaned);
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {dropdown}
    </div>
  );
}

function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150, mass: 0.6 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (event: React.MouseEvent) => {
    const { clientX, clientY } = event;
    const rect = ref.current?.getBoundingClientRect();

    if (!rect) return;

    const middleX = clientX - rect.left - rect.width / 2;
    const middleY = clientY - rect.top - rect.height / 2;

    x.set(middleX * 0.25);
    y.set(middleY * 0.25);
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
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
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

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const sectionInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const cardsInView = useInView(cardsRef, { once: true, margin: "-60px" });

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
    },
    mode: "onBlur",
    reValidateMode: "onBlur",
    shouldFocusError: false,
  });

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
      const value = watchedValues[fieldName];
      return value && validators[fieldName](value);
    }).length;

    setProgress((filled / FORM_FIELDS.length) * 100);
  }, [watchedValues]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, [previews]);

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

        if (currentField === "message") return;

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
          id: crypto.randomUUID(),
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
      setIsPending(true);

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
        }, 6000);
      } catch {
        setIsPending(false);
        toast.error(t.contact.errorTitle ?? "Error", {
          description: t.contact.errorDesc ?? "Something went wrong.",
        });
      }
    },
    [form, t]
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
    [t, language]
  );

  const mv = shouldReduceMotion ? noMotion : fadeUp;

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
                className="form-progressbar"
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
                            className={cn("form-input-modern", errors.name && "error")}
                            autoComplete="name"
                            aria-required="true"
                            aria-invalid={!!errors.name}
                            {...field}
                            onKeyDown={createEnterHandler("name", "contactemail")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {errors.name && (
                            <motion.div
                              key="err-name"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                type: SPRING_SOFT.type,
                                stiffness: SPRING_SOFT.stiffness,
                                damping: SPRING_SOFT.damping,
                              }}
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
                            className={cn("form-input-modern", errors.email && "error")}
                            autoComplete="email"
                            aria-required="true"
                            aria-invalid={!!errors.email}
                            {...field}
                            onKeyDown={createEnterHandler("email", "clientphone")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {errors.email && (
                            <motion.div
                              key="err-email"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                type: SPRING_SOFT.type,
                                stiffness: SPRING_SOFT.stiffness,
                                damping: SPRING_SOFT.damping,
                              }}
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
                            value={field.value}
                            onChange={field.onChange}
                            hasError={!!errors.phone}
                            placeholder={t.contact.phonePlaceholder}
                            onKeyDown={createEnterHandler("phone", "projectvision")}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {errors.phone && (
                            <motion.div
                              key="err-phone"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                type: SPRING_SOFT.type,
                                stiffness: SPRING_SOFT.stiffness,
                                damping: SPRING_SOFT.damping,
                              }}
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
                              errors.message && "error"
                            )}
                            rows={4}
                            spellCheck
                            maxLength={8000}
                            aria-required="true"
                            aria-invalid={!!errors.message}
                            {...field}
                          />
                        </FormControl>

                        <AnimatePresence mode="wait">
                          {errors.message && (
                            <motion.div
                              key="err-message"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{
                                duration: 0.2,
                                type: SPRING_SOFT.type,
                                stiffness: SPRING_SOFT.stiffness,
                                damping: SPRING_SOFT.damping,
                              }}
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
                  <div
                    className={cn(
                      "inspiration-upload-area",
                      isDragging && "inspiration-upload-area--drag"
                    )}
                    aria-label={t.contact.uploadTitle}
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.45, ease: LUXURY_EASE }}
                          onClick={(event) => event.stopPropagation()}
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
                                onClick={() => removePreview(preview.id)}
                              >
                                <X size={10} strokeWidth={2.5} />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
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
                  </div>
                </motion.div>
              </form>
            </Form>
          </motion.div>

          <div className="form-actions-row">
            <Magnetic>
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
                      <Loader2 className="btn-loader-svg" size={16} aria-hidden="true" />
                    </motion.span>
                  ) : isSuccess ? (
                    <motion.span
                      key="sent"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{t.contact.sent}</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <span className="btn-text--desktop">
                        {t.contact.submitDesktop}
                      </span>
                      <span className="btn-text--mobile">
                        {t.contact.submitMobile}
                      </span>
                      <Send size={13} strokeWidth={2} aria-hidden="true" />
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
                  initial={{ opacity: 0, x: -6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: -6, filter: "blur(4px)" }}
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

          <motion.div>
            <LuxuryDivider delay={0.2} />
          </motion.div>

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
                  <span className="contact-card__icon" aria-hidden="true">
                    <item.Icon size={16} strokeWidth={1.5} />
                  </span>
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