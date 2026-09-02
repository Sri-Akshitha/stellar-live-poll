export const POLL_OPTIONS = ["C", "Java", "AI", "Blockchain"];

export function calculatePercentages(votes) {
  const total = Object.values(votes).reduce((sum, count) => sum + count, 0);
  if (total === 0) return Object.fromEntries(POLL_OPTIONS.map((option) => [option, 0]));
  return Object.fromEntries(POLL_OPTIONS.map((option) => [option, Math.round((votes[option] / total) * 100)]));
}

export function applyVote(votes, option) {
  if (!POLL_OPTIONS.includes(option)) throw new Error("Invalid poll option");
  return { ...votes, [option]: votes[option] + 1 };
}
