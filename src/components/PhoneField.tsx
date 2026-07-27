import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { IconClose, IconChevronDown } from "./PremiumIcons";
import { cn } from "@/lib/utils";
import { Country, COUNTRIES, DEFAULT_COUNTRY } from "@/lib/phone-data";

const SPRING_POP = { type: "spring", stiffness: 350, damping: 24 } as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const dropItemVariant = {
  hidden: { opacity: 0, x: -4, filter: "blur(2px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 30, mass: 0.8 } as const,
  },
};

/**
 * ═══════════════════════════════════════════════════════════════
 * PHONE FIELD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 */

export interface PhoneFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  placeholder: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function PhoneField({
  id,
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

  // Use a ref to track if the change originated from this component
  const internalChangeRef = useRef(false);

  // Parse incoming value to set country and local number
  useEffect(() => {
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }

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

  // Update parent when country or local number changes
  useEffect(() => {
    const digitsOnly = localNumber.replace(/\D/g, "");
    
    // If it's just the dial code and the value is empty, don't send anything
    if (!digitsOnly && !value) return;

    const fullValue = digitsOnly ? `${country.dial}${digitsOnly}` : "";
    
    if (fullValue !== value) {
      internalChangeRef.current = true;
      onChange(fullValue);
    }
  }, [country, localNumber, onChange, value]);

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
                  <IconClose size={10} strokeWidth={2.5} />
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
          <IconChevronDown
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
          id={id}
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
