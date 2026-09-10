import React, { useState } from "react";

/**
 * Material You (MD3) Signature Card Container Primitive
 * Features:
 * - Surface Container tonal background (#F3EDF7) - Never pure white
 * - Organic 24px radius (Large)
 * - Progressive shadow elevation (shadow-sm -> shadow-md)
 * - Hover scale (1.02) and active tactile feedback (scale-98)
 * - MD3 canonical cubic-bezier(0.2, 0, 0, 1) timing
 * Variants: 'filled' | 'elevated' | 'outlined'
 */
export default function MD3Card({
  children,
  variant = "filled", // 'filled' | 'elevated' | 'outlined'
  radius = "24px",
  interactive = false,
  onClick,
  style = {},
  className = "",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  let baseStyle = {
    borderRadius: radius,
    padding: "24px",
    boxSizing: "border-box",
    position: "relative",
    fontFamily: "var(--font-sans)",
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
    cursor: interactive ? "pointer" : "default",
    color: "var(--text-primary)",
    transform:
      interactive && isPressed
        ? "scale(0.98)"
        : interactive && isHovered
        ? "translateY(-2px) scale(1.01)"
        : "none",
  };

  if (variant === "filled") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: isHovered && interactive ? "#ECE5F2" : "var(--bg-surface-container)",
      border: "none",
      boxShadow: isHovered && interactive ? "var(--shadow-md)" : "var(--shadow-sm)",
    };
  } else if (variant === "elevated") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: "var(--bg-surface-container-low)",
      border: "none",
      boxShadow: isHovered && interactive ? "var(--shadow-lg)" : "var(--shadow-md)",
    };
  } else if (variant === "outlined") {
    baseStyle = {
      ...baseStyle,
      backgroundColor: "var(--bg-surface)",
      border: `1px solid ${isHovered && interactive ? "var(--primary)" : "var(--border-subtle)"}`,
      boxShadow: isHovered && interactive ? "var(--shadow-sm)" : "none",
    };
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => interactive && setIsPressed(true)}
      onMouseUp={() => interactive && setIsPressed(false)}
      style={{ ...baseStyle, ...style }}
      className={`md3-card ${className}`}
    >
      {children}
    </div>
  );
}
