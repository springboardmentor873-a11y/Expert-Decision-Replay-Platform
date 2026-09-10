import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Canonical Material 3 Filled Text Field
 * Features:
 * - Rounded top corners (12px), flat bottom corners (0px)
 * - Muted tonal background (Surface Container Low #E7E0EC)
 * - 2px animated active bottom border indicator (Transitions from Outline #79747E to Primary #6750A4)
 * - Height: 56px (Canonical MD3 tall input)
 * - Friendly floating / clean typography
 */
export default function MD3TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  helperText = "",
  errorText = "",
  required = false,
  leadingIcon = null,
  disabled = false,
  id,
  name,
  style = {},
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;
  const hasError = Boolean(errorText);

  return (
    <div style={{ marginBottom: "18px", width: "100%", ...style }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "500",
            color: hasError
              ? "var(--accent-rose)"
              : isFocused
              ? "var(--primary)"
              : "var(--text-secondary)",
            marginBottom: "6px",
            transition: "color var(--md3-duration-short) var(--md3-easing)",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.01em",
          }}
        >
          {label} {required && <span style={{ color: "var(--accent-rose)" }}>*</span>}
        </label>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          height: "56px",
          backgroundColor: isFocused
            ? "var(--bg-surface-container-highest)"
            : "var(--bg-surface-container-high)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          borderBottomLeftRadius: "0px",
          borderBottomRightRadius: "0px",
          border: "none",
          borderBottom: `2px solid ${
            hasError
              ? "var(--accent-rose)"
              : isFocused
              ? "var(--primary)"
              : "var(--border-muted)"
          }`,
          boxShadow: isFocused ? "0 2px 8px -1px rgba(103, 80, 164, 0.15)" : "none",
          transition: "all var(--md3-duration-short) var(--md3-easing)",
          overflow: "hidden",
        }}
      >
        {leadingIcon && (
          <div
            style={{
              paddingLeft: "16px",
              color: isFocused ? "var(--primary)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color var(--md3-duration-short) ease",
            }}
          >
            {leadingIcon}
          </div>
        )}

        <input
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            height: "100%",
            padding: leadingIcon ? "0 16px 0 12px" : "0 16px",
            fontSize: "15px",
            fontFamily: "var(--font-sans)",
            color: "var(--text-primary)",
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            letterSpacing: "0.01em",
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            style={{
              padding: "0 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isFocused ? "var(--primary)" : "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              outline: "none",
              transition: "color var(--md3-duration-short) ease",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {(hasError || helperText) && (
        <div
          style={{
            fontSize: "12px",
            marginTop: "5px",
            paddingLeft: "4px",
            color: hasError ? "var(--accent-rose)" : "var(--text-muted)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {errorText || helperText}
        </div>
      )}
    </div>
  );
}
