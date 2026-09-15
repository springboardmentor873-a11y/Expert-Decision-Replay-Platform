/**
 * AvatarInitials — colored circle with the user's initials.
 * The color is deterministically derived from the name so it stays
 * consistent across sessions.
 */

const COLORS = [
  "#3b6bdd", "#059669", "#d97706", "#dc2626",
  "#7c3aed", "#0891b2", "#be185d", "#15803d",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarInitialsProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarInitials({ name, size = "md", className = "" }: AvatarInitialsProps) {
  const bg = colorForName(name);
  const cls = ["avatar-circle", size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={{ background: bg }} title={name}>
      {initials(name)}
    </div>
  );
}
