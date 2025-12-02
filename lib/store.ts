// Simple in-memory store for claims (in production, use a proper database)
interface ClaimRecord {
  address: string;
  lastClaimTime: number;
  githubUsername: string;
}

const claimStore = new Map<string, ClaimRecord>();

export function canClaim(address: string): boolean {
  const record = claimStore.get(address.toLowerCase());
  if (!record) return true;

  const oneDayInMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now - record.lastClaimTime >= oneDayInMs;
}

export function getTimeUntilNextClaim(address: string): number {
  const record = claimStore.get(address.toLowerCase());
  if (!record) return 0;

  const oneDayInMs = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const timeElapsed = now - record.lastClaimTime;
  const timeRemaining = oneDayInMs - timeElapsed;

  return Math.max(0, timeRemaining);
}

export function recordClaim(address: string, githubUsername: string): void {
  claimStore.set(address.toLowerCase(), {
    address: address.toLowerCase(),
    lastClaimTime: Date.now(),
    githubUsername,
  });
}

export function getClaimRecord(address: string): ClaimRecord | undefined {
  return claimStore.get(address.toLowerCase());
}
