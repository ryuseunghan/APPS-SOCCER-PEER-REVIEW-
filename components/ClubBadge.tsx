import Image from "next/image";

interface ClubBadgeProps {
  size?: number;
  className?: string;
}

/**
 * Happy Life Football Club 로고 배지
 * 기본 크기: 48px
 */
export default function ClubBadge({ size = 48, className = "" }: ClubBadgeProps) {
  return (
    <Image
      src="/images/hpy_life_logo.png"
      alt="Happy Life Football Club"
      width={size}
      height={size}
      className={`rounded-full object-contain ${className}`}
      priority={size >= 80}
    />
  );
}
