// Twitter verification helper
export async function verifyTwitterPost(postUrl: string): Promise<boolean> {
  if (!postUrl) return false;

  // Basic URL validation
  const twitterRegex = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
  if (!twitterRegex.test(postUrl)) {
    return false;
  }

  // In a production environment, you would:
  // 1. Use Twitter API to fetch the tweet
  // 2. Verify it mentions @celo_col
  // 3. Check if it's recent (within last 24h)
  // 4. Verify it's not a reused tweet

  // For now, we'll do basic validation
  // You can implement full Twitter API integration later
  try {
    // Basic check - just verify URL format for now
    const url = new URL(postUrl);
    return (url.hostname === 'twitter.com' || url.hostname === 'x.com');
  } catch {
    return false;
  }
}

// Helper to extract tweet ID from URL
export function extractTweetId(postUrl: string): string | null {
  const match = postUrl.match(/status\/(\d+)/);
  return match ? match[1] : null;
}
