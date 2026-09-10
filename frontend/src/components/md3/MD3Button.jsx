import React, { useState } from "react";

/**
 * Material You (MD3) Signature Pill Button Primitive
 * Features:
 * - Full Pill Shape (rounded-full / 9999px)
 * - State Layer System (Opacity overlays)
 * - Tactile press feedback (active:scale-95)
 * - Canonical MD3 cubic-bezier(0.2, 0, 0, 1) transition
 * Variants: 'filled' (Primary) | 'tonal' (Secondary) | 'outlined' | 'text' | 'fab'
 */
export default function MD3Button({
  children,
  variant = "filled",
  size = "md", // 'sm' | 'md' | 'lg'
  icon = null,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  style = {},
  className = "",
  fullWidth = false,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const sizeStyles = {
    sm: {
      height: "36px",
      padding: "0 16px",
      fontSize: "13px",
      gap: "6px",
    },
    md: {
      height: "40px",
      padding: "0 22px",
      fontSize: "14px",
      gap: "8px",
    },
    lg: {
      height: "48px",
      padding: "0 28px",
      fontSize: "15px",
      gap: "10px",
    },
  }[size] || sizeStyles.md;

  let baseStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-sans)",
    fontWeight: "500",
    letterSpacing: "0.01em",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    border: "none",
    outline: "none",
    width: fullWidth ? "100%" : "auto",
    position: "relative",
    userSelect: "none",
    borderRadius: variant === "fab" ? "var(--radius-xl)" : "var(--radius-full)",
    opacity: disabled ? 0.45 : 1,
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
    transform: isPressed && !disabled && !loading ? "scale(0.95)" : "scale(1)",
    boxSizing: "border-box",
    ...sizeStyles,
  };

  if (variant === "filled" || variant === "primary") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isHovered && !disabled ? "var(--primary-hover)" : "var(--primary)",
      color: "var(--on-primary)",
      boxShadow: isHovered && !disabled ? "var(--shadow-md)" : "none",
    };
  } else if (variant === "tonal" || variant === "secondary") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isHovered && !disabled ? "rgba(232, 222, 248, 0.75)" : "var(--secondary-container)",
      color: "var(--on-secondary-container)",
      boxShadow: isHovered && !disabled ? "var(--shadow-sm)" : "none",
    };
  } else if (variant === "outlined") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isHovered && !disabled ? "rgba(103, 80, 164, 0.06)" : "transparent",
      color: "var(--primary)",
      border: "1px solid var(--outline)",
    };
  } else if (variant === "text" || variant === "ghost") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isHovered && !disabled ? "rgba(103, 80, 164, 0.08)" : "transparent",
      color: "var(--primary)",
      padding: size === "sm" ? "0 10px" : "0 14px",
    };
  } else if (variant === "fab") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: "var(--tertiary)",
      color: "var(--on-tertiary)",
      boxShadow: isHovered && !disabled ? "var(--shadow-lg)" : "var(--shadow-md)",
      borderRadius: "24px",
    };
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && !loading && setIsPressed(true)}
      onMouseUp={() => !disabled && !loading && setIsPressed(false)}
      style={{ ...baseStyle, ...style }}
      className={`md3-button ${className}`}
    >
      {loading ? (
        <span
          style={{
            width: "18px",
            height: "18px",
            border: "2px solid currentColor",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            display: "inline-block",
            marginRight: children ? "8px" : "0",
          }}
        />
      ) : (
        icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
