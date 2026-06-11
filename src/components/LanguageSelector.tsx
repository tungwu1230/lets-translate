import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { languageOptions } from "../lib/models";
import type { LanguageCode } from "../lib/types";

interface Props {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  excludeAuto?: boolean;
}

export function LanguageSelector({ value, onChange, excludeAuto = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const options = languageOptions.filter((lang) => {
    if (excludeAuto && lang.code === "auto") return false;
    return true;
  });

  const filteredOptions = options.filter((lang) =>
    lang.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLabel = options.find((lang) => lang.code === value)?.label ?? value;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearchQuery("");
    }
  }, [isOpen]);

  function handleSelect(code: LanguageCode) {
    onChange(code);
    setIsOpen(false);
  }

  return (
    <div className="custom-select-container" ref={containerRef}>
      {isOpen ? (
        <div className="custom-select-search-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="custom-select-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋語言..."
          />
          <div className="custom-select-dropdown">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  className={`custom-select-option ${lang.code === value ? "active" : ""}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  {lang.label}
                </button>
              ))
            ) : (
              <div className="custom-select-no-results">無相符語言</div>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="custom-select-trigger"
          onClick={() => setIsOpen(true)}
        >
          {selectedLabel}
        </button>
      )}
    </div>
  );
}
