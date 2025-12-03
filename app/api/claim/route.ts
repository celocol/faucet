import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { canClaim, recordClaim, getTimeUntilNextClaim } from '@/lib/store';
import { verifyTwitterPost } from '@/lib/twitter';
import { BASE_CLAIM_AMOUNT, VERIFICATION_MULTIPLIERS, VerificationLevel } from '@/lib/constants';

// Note: Blockchain interaction code removed for UI testing
// Will be re-enabled when ready for production deployment

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, twitterPostUrl, captchaToken } = body;

    // Validate address
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, message: 'Invalid address' },
        { status: 400 }
      );
    }

    // Verify captcha token (required for all claims)
    if (!captchaToken) {
      return NextResponse.json(
        { success: false, message: 'Captcha verification required' },
        { status: 400 }
      );
    }

    // TODO: Verify captcha token with Google reCAPTCHA API
    // For now, we'll just check it exists (implement proper verification in production)

    // Check for optional GitHub verification
    const cookieStore = await cookies();
    const githubCookie = cookieStore.get('github_user');
    const githubData = githubCookie ? JSON.parse(githubCookie.value) : null;
    const isGithubVerified = !!githubData;

    // Check rate limiting
    if (!canClaim(address)) {
      const timeRemaining = getTimeUntilNextClaim(address);
      const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
      return NextResponse.json(
        {
          success: false,
          message: `You can claim again in ${hoursRemaining} hours`,
        },
        { status: 429 }
      );
    }

    // Verify Twitter post if provided
    let isTwitterVerified = false;
    if (twitterPostUrl) {
      isTwitterVerified = await verifyTwitterPost(twitterPostUrl);
      if (!isTwitterVerified) {
        return NextResponse.json(
          { success: false, message: 'Twitter post must mention @celo_col' },
          { status: 400 }
        );
      }
    }

    // Calculate multiplier based on verifications
    // Base claim: 1x (1 CELO + 1 cCOP) with captcha only
    // GitHub: 5x multiplier
    // Twitter: 5x multiplier
    // Both GitHub + Twitter: 25x multiplier (5 * 5)
    // Self verification: 10x (not stackable, mockup for now)
    let multiplier = 1;
    const verifications = [];

    // GitHub verification (optional)
    if (isGithubVerified) {
      multiplier *= VERIFICATION_MULTIPLIERS[VerificationLevel.GITHUB];
      verifications.push('GitHub');
    }

    // Twitter verification (optional, multiplicative)
    if (isTwitterVerified) {
      multiplier *= VERIFICATION_MULTIPLIERS[VerificationLevel.TWITTER];
      verifications.push('Twitter');
    }

    // If no verifications, just captcha
    if (verifications.length === 0) {
      verifications.push('Captcha');
    }

    // Calculate final amounts
    const amounts = {
      celo: BASE_CLAIM_AMOUNT.celo * multiplier,
      ccop: BASE_CLAIM_AMOUNT.ccop * multiplier,
    };

    // MOCK: Simulate blockchain interaction (remove this section when ready for real transactions)
    console.log('MOCK: Would send', amounts.celo, 'CELO and', amounts.ccop, 'cCOP to', address);
    console.log('MOCK: GitHub user:', githubData?.username || 'none');
    console.log('MOCK: Verifications:', verifications.join(' + '));
    console.log('MOCK: Multiplier:', multiplier + 'x');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock transaction hashes
    const mockCeloTxHash = '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0');
    const mockCcopTxHash = '0x' + Math.random().toString(16).substring(2, 66).padEnd(64, '0');

    // Record the claim (for rate limiting)
    recordClaim(address, githubData?.username || 'anonymous');

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${amounts.celo} CELO and ${amounts.ccop} cCOP! (${verifications.join(' + ')} = ${multiplier}x multiplier)`,
      txHash: mockCeloTxHash,
      ccopTxHash: mockCcopTxHash,
      multiplier,
      verifications,
      mock: true,
    });
  } catch (error: any) {
    console.error('Claim error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to process claim',
      },
      { status: 500 }
    );
  }
}
