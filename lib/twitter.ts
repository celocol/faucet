// Twitter verification helper
export async function verifyTwitterPost(postUrl: string): Promise<boolean> {
  if (!postUrl) return false;

  // Basic URL validation
  const twitterRegex = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
  if (!twitterRegex.test(postUrl)) {
    return false;
  }

  try {
    const url = new URL(postUrl);
    if (url.hostname !== 'twitter.com' && url.hostname !== 'x.com') {
      return false;
    }

    // MOCKUP: Check if tweet mentions @celo_col by fetching the page content
    // In production, you would use Twitter API with proper authentication
    const tweetId = extractTweetId(postUrl);
    if (!tweetId) return false;

    // Fetch the tweet page to check for @celo_col mention
    const response = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FaucetBot/1.0)',
      },
    });

    if (!response.ok) return false;

    const html = await response.text();

    // Check if the page content includes @celo_col mention
    // This is a simple check - in production use Twitter API
    const hasCeloColMention = html.includes('@celo_col') ||
                              html.includes('celo_col') ||
                              html.includes('%40celo_col'); // URL encoded @

    return hasCeloColMention;
  } catch (error) {
    console.error('Twitter verification error:', error);
    return false;
  }
}

// Helper to extract tweet ID from URL
export function extractTweetId(postUrl: string): string | null {
  const match = postUrl.match(/status\/(\d+)/);
  return match ? match[1] : null;
}
