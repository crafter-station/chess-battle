interface VercelIconProps {
  size?: number;
  className?: string;
}

export function VercelIcon({ size = 16, className = "" }: VercelIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <title>Vercel</title>
      <path d="M12 2L2 19.778h20L12 2z" />
    </svg>
  );
}
