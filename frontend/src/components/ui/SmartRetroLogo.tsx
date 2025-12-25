export function SmartRetroLogo({ className }: { className?: string }) {
  // Generate unique gradient ID to avoid conflicts if multiple instances
  const gradientId = `smartRetroGradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg
      viewBox="0 0 240 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Smart Retro Logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#4ADE80" />
        </linearGradient>
      </defs>
      {/* Smart Retro Text - SVG text element with gradient fill */}
      <text
        x="0"
        y="42"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill={`url(#${gradientId})`}
        letterSpacing="-0.5px"
      >
        Smart Retro
      </text>
    </svg>
  );
}
