import { PullRequest, Review } from "./github";

export interface ReviewerStats {
  login: string;
  totalReviews: number;
  approved: number;
  changesRequested: number;
  commented: number;
  avgTimeToReviewHours: number | null;
}

export interface TeamStats {
  totalPRs: number;
  totalReviews: number;
  reviewers: ReviewerStats[];
  mostActiveReviewer: string | null;
  avgReviewsPerPR: number;
}

export function computeReviewerStats(
  reviews: Review[],
  prCreatedAt: string
): Map<string, ReviewerStats> {
  const map = new Map<string, ReviewerStats>();

  for (const review of reviews) {
    const login = review.user.login;
    if (!map.has(login)) {
      map.set(login, {
        login,
        totalReviews: 0,
        approved: 0,
        changesRequested: 0,
        commented: 0,
        avgTimeToReviewHours: null,
      });
    }
    const stat = map.get(login)!;
    stat.totalReviews += 1;

    if (review.state === "APPROVED") stat.approved += 1;
    else if (review.state === "CHANGES_REQUESTED") stat.changesRequested += 1;
    else if (review.state === "COMMENTED") stat.commented += 1;

    const prTime = new Date(prCreatedAt).getTime();
    const reviewTime = new Date(review.submitted_at).getTime();
    const diffHours = (reviewTime - prTime) / (1000 * 60 * 60);
    stat.avgTimeToReviewHours =
      stat.avgTimeToReviewHours === null
        ? diffHours
        : (stat.avgTimeToReviewHours + diffHours) / 2;
  }

  return map;
}

export function aggregateTeamStats(
  prs: PullRequest[],
  allReviews: Map<number, Review[]>
): TeamStats {
  const reviewerMap = new Map<string, ReviewerStats>();
  let totalReviews = 0;

  for (const pr of prs) {
    const reviews = allReviews.get(pr.number) ?? [];
    totalReviews += reviews.length;
    const perPR = computeReviewerStats(reviews, pr.created_at);
    for (const [login, stats] of perPR) {
      if (!reviewerMap.has(login)) {
        reviewerMap.set(login, { ...stats });
      } else {
        const existing = reviewerMap.get(login)!;
        existing.totalReviews += stats.totalReviews;
        existing.approved += stats.approved;
        existing.changesRequested += stats.changesRequested;
        existing.commented += stats.commented;
        if (stats.avgTimeToReviewHours !== null) {
          existing.avgTimeToReviewHours =
            existing.avgTimeToReviewHours === null
              ? stats.avgTimeToReviewHours
              : (existing.avgTimeToReviewHours + stats.avgTimeToReviewHours) / 2;
        }
      }
    }
  }

  const reviewers = Array.from(reviewerMap.values()).sort(
    (a, b) => b.totalReviews - a.totalReviews
  );

  return {
    totalPRs: prs.length,
    totalReviews,
    reviewers,
    mostActiveReviewer: reviewers[0]?.login ?? null,
    avgReviewsPerPR: prs.length > 0 ? totalReviews / prs.length : 0,
  };
}
