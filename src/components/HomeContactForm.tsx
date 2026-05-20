import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  motion,
  AnimatePresence,
  useInView,
  useSpring,
} from "framer-motion";
import {
  Check,
  Send,
  Loader2,
  X,
  Image as ImageIcon,
  MapPin,
  Mail,
  Instagram,
} from "lucide-react";
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


import "./HomeContactForm.css";
import "../pages/PhoneSelector.css";

const FORM_FIELDS = ["name", "email", "phone", "message"] as const;

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;
const LUXURY_Y = 52;
const LUXURY_BLUR = "6px";

const SPRING_UI = { type: "spring", stiffness: 260, damping: 30 } as const;
const SPRING_POP = { type: "spring", stiffness: 350, damping: 24 } as const;

/* ── Optimized Magnetic Effect ── */
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

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
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

const MAX_FILES = 5;
const ACCEPT = "image/*";



const HomeContactForm = () => {
  const { t } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, { message: t("contact.nameError") }),
        email: z.string().email({ message: t("contact.emailError") }),
        phone: z.string().min(8, { message: t("contact.phoneError") }),
        message: z
          .string()
          .min(10, { message: t("contact.messageError") })
          .max(8000),
      }),
    [t]
  );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", message: "" },
    mode: "onSubmit",
  });

  const { errors } = form.formState;
  const watchedValues = form.watch();

  useEffect(() => {
    const filled = FORM_FIELDS.filter((f) => {
      const v = watchedValues[f];
      return v && v.length > 0 && !errors[f];
    }).length;
    setProgress((filled / FORM_FIELDS.length) * 100);
  }, [watchedValues, errors]);

  // Only clear the timer on unmount — NOT on every previews change
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
        toast.error(t("contact.maxFilesError"));
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
      console.log('Home form data:', data);
      setIsPending(true);
      // Cancel any existing success timer
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
          form.clearErrors(); // Ensure errors don't reappear after reset
        }, 6000);
      } catch {
        setIsPending(false);
        toast.error(t("contact.errorTitle"));
      }
    },
    [form, t]
  );

  const onInvalid = useCallback(() => {
    // Shake the whole form card if submission fails validation
    const card = formRef.current?.closest(".contact-content__inner-home");
    if (card) {
      card.classList.remove("shake-error");
      void (card as HTMLElement).offsetWidth;
      card.classList.add("shake-error");
      setTimeout(() => card.classList.remove("shake-error"), 600);
    }
  }, []);

  return (
    <section ref={sectionRef} className="home-contact-modern" id="home-contact">
      <div className="luxury-bg-highlight" aria-hidden="true" />
      
      <div className="home-contact-container">
        <div className="home-contact-modern-grid">
          {/* LEFT: Editorial Content */}
          <div className="home-contact-editorial">
            <SectionHeader
              title="Începe călătoria ta spre perfecțiune"
              centered={false}
              className="home-contact-header"
            />
            
            <motion.div 
              className="luxury-editorial-content"
              variants={staggerContainer}
              initial="hidden"
              animate={isInView ? "show" : "hidden"}
            >
              <motion.p className="luxury-editorial-text" variants={fadeUp}>
                Fiecare detaliu contează. Suntem aici să transformăm vizualul în experiență, 
                aducând la viață spații care rezonează cu stilul tău de viață.
              </motion.p>
              
              <div className="contact-info-grid-home">
                <motion.div 
                  className="contact-info-grid__inner-home"
                  variants={staggerContainer}
                  initial="hidden"
                  animate={isInView ? "show" : "hidden"}
                >
                  {[
                    { 
                      icon: MapPin, 
                      text: t("contact.visitLabel"), 
                      href: "https://maps.google.com/?q=Chisinau,Moldova" 
                    },
                    { 
                      icon: Mail, 
                      text: "hello@noma.studio", 
                      href: "mailto:hello@noma.studio" 
                    },
                    { 
                      icon: Instagram, 
                      text: "@noma.studio.design", 
                      href: "https://www.instagram.com/noma.studio.design/" 
                    }
                  ].map((item, idx) => (
                    <motion.a
                      key={idx}
                      href={item.href}
                      target={item.icon === MapPin || item.icon === Instagram ? "_blank" : undefined}
                      rel={item.icon === MapPin || item.icon === Instagram ? "noopener noreferrer" : undefined}
                      className="contact-card-home"
                      variants={fadeUp}
                    >
                      <Magnetic strength={0.15}>
                        <div className="contact-card__icon-home">
                          <item.icon size={16} strokeWidth={1.5} />
                        </div>
                      </Magnetic>
                      <span className="contact-card__value-home">{item.text}</span>
                    </motion.a>
                  ))}
                </motion.div>
              </div>
              
            </motion.div>
          </div>

          {/* RIGHT: EXACT Form from Contact.tsx */}
          <motion.div
             className="contact-content__inner-home"
             variants={fadeUp}
             initial="hidden"
             animate={isInView ? "show" : "hidden"}
             transition={{ duration: 0.72, delay: 0.18, ease: LUXURY_EASE }}
          >
            <div
              className="form-progress"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
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
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.48, delay: 0.22, ease: LUXURY_EASE }}
                      >
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <Input
                              id="h-name"
                              placeholder={t("contact.namePlaceholder")}
                              className={cn("form-input-modern", errors.name && "error")}
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
                      </motion.div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.48, delay: 0.28, ease: LUXURY_EASE }}
                      >
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <Input
                              id="h-email"
                              type="email"
                              placeholder={t("contact.emailPlaceholder")}
                              className={cn("form-input-modern", errors.email && "error")}
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
                      </motion.div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.48, delay: 0.34, ease: LUXURY_EASE }}
                      >
                        <FormItem className="form-field-modern">
                          <FormControl>
                            <PhoneField
                              id="h-phone"
                              value={field.value}
                              onChange={field.onChange}
                              hasError={!!errors.phone}
                              placeholder={t("contact.phonePlaceholder")}
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
                      </motion.div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <motion.div
                        variants={fadeUp}
                        transition={{ duration: 0.48, delay: 0.4, ease: LUXURY_EASE }}
                      >
                        <FormItem className="form-field-modern form-field-modern--textarea">
                          <FormControl>
                            <Textarea
                              id="h-message"
                              placeholder={t("contact.messagePlaceholder")}
                              className={cn("form-textarea-modern", errors.message && "error")}
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
                      </motion.div>
                    )}
                  />

                  <motion.div
                    variants={fadeUp}
                    transition={{ duration: 0.5, delay: 0.46, ease: LUXURY_EASE }}
                  >
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
                            {t("contact.uploadTitle")}
                          </span>
                          <span className="inspiration-upload-sub">
                            {t("contact.uploadSub")}
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
                                  <X size={10} strokeWidth={2.5} />
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
                  </motion.div>

                    <div className="form-actions-row">
                      <Magnetic strength={0.2}>
                        <Button
                          type="submit"
                          disabled={isPending}
                          className={cn("btn-submit-modern", isSuccess && "success")}
                        >
                          <AnimatePresence mode="wait">
                            {isPending ? (
                              <motion.span
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
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
                                <span>{t("contact.sent")}</span>
                                <Check size={14} strokeWidth={2.8} />
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
                                  {t("contact.submitDesktop")}
                                </span>
                                <Send size={14} strokeWidth={2.4} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Button>
                      </Magnetic>

                      <AnimatePresence>
                        {isSuccess && (
                          <motion.div
                            key="success-toast-home"
                            className="form-toast"
                            initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                            transition={{ ...SPRING_UI, damping: 25 }}
                            style={{ zIndex: 100 }}
                          >
                            <div className="form-toast__icon">
                              <Check size={10} strokeWidth={3} />
                            </div>
                            <div className="form-toast__body">
                              <p className="form-toast__title">{t("contact.successTitle")}</p>
                              <p className="form-toast__text">{t("contact.successDesc")}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                </form>
            </Form>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomeContactForm;
