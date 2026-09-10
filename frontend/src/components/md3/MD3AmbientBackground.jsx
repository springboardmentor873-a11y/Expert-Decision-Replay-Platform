import React from "react";

/**
 * Material You (MD3) Signature Layered Organic Blur Ambient Background
 * Generates soft, multi-colored organic blur spheres simulating wallpaper-derived tonal surfaces.
 */
export default function MD3AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      {/* Primary Violet Ambient Sphere - Top Right */}
      <div
        style={{
          position: "absolute",
          top: "-12%",
          right: "-8%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(103, 80, 164, 0.18) 0%, rgba(103, 80, 164, 0.04) 60%, transparent 80%)",
          filter: "blur(80px)",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Secondary Lavender Ambient Sphere - Bottom Left */}
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          left: "-10%",
          width: "650px",
          height: "650px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232, 222, 248, 0.85) 0%, rgba(208, 188, 255, 0.2) 60%, transparent 80%)",
          filter: "blur(90px)",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Tertiary Rose/Mauve Ambient Sphere - Center Right */}
      <div
        style={{
          position: "absolute",
          top: "35%",
          right: "5%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(125, 82, 96, 0.12) 0%, rgba(255, 216, 228, 0.3) 60%, transparent 80%)",
          filter: "blur(75px)",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Soft Luminous Violet Glow - Top Left */}
      <div
        style={{
          position: "absolute",
          top: "-6%",
          left: "15%",
          width: "480px",
          height: "480px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(103, 80, 164, 0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
          transform: "translate3d(0, 0, 0)",
        }}
      />
    </div>
  );
}
