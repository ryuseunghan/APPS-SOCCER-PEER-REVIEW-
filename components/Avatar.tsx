interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  isMvp?: boolean;
  isDisabled?: boolean;
  isSelected?: boolean;
  imageUrl?: string;
}

const sizeMap = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-16 h-16 text-xl",
};

export default function Avatar({
  name,
  size = "md",
  isMvp = false,
  isDisabled = false,
  isSelected = false,
  imageUrl,
}: AvatarProps) {
  const initials = name.slice(0, 2);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div
        className={`
          ${sizeMap[size]} rounded-full flex items-center justify-center font-semibold
          ${isDisabled ? "opacity-50 bg-[#374151] text-[#9CA3AF]" : "bg-[#243570] text-white"}
          ${isSelected ? "ring-[3px] ring-[#22C55E]" : ""}
          ${imageUrl ? "overflow-hidden" : ""}
        `}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isMvp && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[#F59E0B]"
          style={{ fontSize: size === "xl" ? 16 : 12 }}
          aria-label="MVP"
        >
          👑
        </span>
      )}
    </div>
  );
}
