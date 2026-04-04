type ReviewStatus = "pending" | "in_progress" | "completed" | "closed";

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
}

const config: Record<ReviewStatus, { label: string; className: string }> = {
  pending: {
    label: "리뷰 대기",
    className: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40",
  },
  in_progress: {
    label: "리뷰 중",
    className: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
  },
  completed: {
    label: "✓ 리뷰 완료",
    className: "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40",
  },
  closed: {
    label: "마감됨",
    className: "bg-gray-500/20 text-gray-400 border border-gray-500/40 line-through",
  },
};

export default function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
