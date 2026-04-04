interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
}

export default function ProgressBar({ current, total, showLabel = true }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="w-full h-2 bg-[#243570] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#22C55E] rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-[#7B9DD4]">
          {current} / {total}명 완료
        </p>
      )}
    </div>
  );
}
