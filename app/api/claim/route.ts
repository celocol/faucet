import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { canClaim, recordClaim, getTimeUntilNextClaim } from '@/lib/store';
import { verifyTwitterPost } from '@/lib/twitter';
import { CLAIM_AMOUNTS, TOKEN_ADDRESSES } from '@/lib/constants';
import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, twitterPostUrl } = body;

    // Validate address
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { success: false, message: 'Invalid address' },
        { status: 400 }
      );
    }

    // Check GitHub verification
    const cookieStore = await cookies();
    const githubCookie = cookieStore.get('github_user');

    if (!githubCookie) {
      return NextResponse.json(
        { success: false, message: 'GitHub verification required' },
        { status: 401 }
      );
    }

    const githubData = JSON.parse(githubCookie.value);

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
          { success: false, message: 'Invalid Twitter post URL' },
          { status: 400 }
        );
      }
    }

    // Determine claim amounts
    const amounts = isTwitterVerified ? CLAIM_AMOUNTS.twitter : CLAIM_AMOUNTS.basic;

    // Check for faucet private key
    const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!faucetPrivateKey) {
      return NextResponse.json(
        { success: false, message: 'Faucet not configured' },
        { status: 500 }
      );
    }

    // Create wallet client
    const account = privateKeyToAccount(faucetPrivateKey as `0x${string}`);
    const client = createWalletClient({
      account,
      chain: celoAlfajores,
      transport: http(),
    });

    try {
      // Send CELO
      const celoAmount = parseEther(amounts.celo.toString());
      const celoTxHash = await client.sendTransaction({
        to: address as `0x${string}`,
        value: celoAmount,
      });

      // Send cCOP tokens
      const ccopAmount = parseEther(amounts.ccop.toString());
      const ccopTxHash = await client.writeContract({
        address: TOKEN_ADDRESSES.ccop as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [address as `0x${string}`, ccopAmount],
      });

      // Record the claim
      recordClaim(address, githubData.username);

      return NextResponse.json({
        success: true,
        message: `Successfully claimed ${amounts.celo} CELO and ${amounts.ccop} cCOP!`,
        txHash: celoTxHash,
        ccopTxHash,
      });
    } catch (error: any) {
      console.error('Transaction error:', error);
      return NextResponse.json(
        {
          success: false,
          message: `Transaction failed: ${error.message || 'Unknown error'}`,
        },
        { status: 500 }
      );
    }
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
