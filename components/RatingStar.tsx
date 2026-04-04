"use client";

interface RatingStarProps {
  value: number; // 0~5
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (v: number) => void;
  color?: string;
}

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
};

function ratingColor(value: number) {
  if (value >= 4.0) return "#22C55E";
  if (value >= 3.0) return "#EAB308";
  return "#EF4444";
}

export default function RatingStar({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  color,
}: RatingStarProps) {
  const px = sizeMap[size];
  const starColor = color ?? ratingColor(value);

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`평점 ${value}점`}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={`star-btn p-0.5 ${interactive ? "cursor-pointer" : "cursor-default"}`}
            aria-label={interactive ? `${i + 1}점` : undefined}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill={filled ? starColor : "none"}
              stroke={filled ? starColor : "#4B5563"}
              strokeWidth="2"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
