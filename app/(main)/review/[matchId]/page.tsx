import ReviewFlow from "./ReviewFlow";

interface Params {
  params: Promise<{ matchId: string }>;
}

export default async function ReviewPage({ params }: Params) {
  const { matchId } = await params;
  return <ReviewFlow matchId={matchId} />;
}
