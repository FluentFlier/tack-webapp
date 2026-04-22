"use client";

/**
 * ToggleSwitch — Accessible toggle switch component.
 *
 * Uses role="switch" + aria-checked for full NVDA / VoiceOver support.
 * Each toggle row is at minimum 44px tall to meet WCAG 2.5.5 touch-target requirements.
 */

import React from "react";

export interface ToggleSwitchProps {
  /** Unique id — wires the label's htmlFor */
  id: string;
  /** Whether the toggle is currently on */
  checked: boolean;
  /** Called with the new value when the user toggles */
  onChange: (checked: boolean) => void;
  /** Short label shown in bold */
  label: string;
  /** Optional one-line description shown below the label */
  description?: string;
  /** When true the toggle renders as disabled and is not interactive */
  disabled?: boolean;
  /** Optional extra class on the outer wrapper */
  className?: string;
}

export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = "",
}: ToggleSwitchProps) {
  return (
    <div
      className={`toggle-switch-row ${className}`}
      // Ensure the row itself is at least 44px tall (touch target)
      style={{ minHeight: "44px" }}
    >
      {/* Text block */}
      <div className="toggle-switch-row__text">
        <label
          htmlFor={id}
          className="toggle-switch-row__label"
          id={`${id}-label`}
        >
          {label}
        </label>
        {description && (
          <p
            className="toggle-switch-row__desc"
            id={`${id}-desc`}
          >
            {description}
          </p>
        )}
      </div>

      {/* The actual switch button */}
      <button
        id={id}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`toggle-switch ${checked ? "toggle-switch--on" : "toggle-switch--off"} ${disabled ? "toggle-switch--disabled" : ""}`}
      >
        <span
          className={`toggle-switch__thumb ${checked ? "toggle-switch__thumb--on" : ""}`}
          aria-hidden="true"
        />
        {/* Screen-reader-only state text */}
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export default ToggleSwitch;
