"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Option = {
  value: string;
  label: string;
};

type MultiSelectDropdownProps = {
  name?: string;
  label?: string;
  placeholder: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

export function MultiSelectDropdown({
  name,
  label,
  placeholder,
  options,
  value,
  onChange,
  className = "",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? options.find((option) => option.value === value[0])?.label ?? value[0]
        : `${value.length} selected`;

  function toggleOption(optionValue: string) {
    const nextSet = new Set(value);
    if (nextSet.has(optionValue)) {
      nextSet.delete(optionValue);
    } else {
      nextSet.add(optionValue);
    }
    onChange(Array.from(nextSet));
  }

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      {label ? <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span> : null}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:bg-white focus:border-accent focus:bg-white focus:shadow-input-focus focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-gray-700">{summary}</span>
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {name
        ? value.map((season) => <input key={`${name}-${season}`} type="hidden" name={name} value={season} />)
        : null}

      {open ? (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-dropdown">
          <ul role="listbox" aria-multiselectable="true" className="space-y-1">
            {options.map((option) => {
              const checked = selectedSet.has(option.value);
              return (
                <li key={option.value}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(option.value)}
                      className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/30"
                    />
                    <span>{option.label}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
