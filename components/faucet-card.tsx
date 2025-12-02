'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Wallet, Github, Twitter, Loader2 } from 'lucide-react';
import { CLAIM_AMOUNTS, VerificationLevel } from '@/lib/constants';

export function FaucetCard() {
  const { address, isConnected } = useAccount();
  const [manualAddress, setManualAddress] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [twitterPostUrl, setTwitterPostUrl] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveAddress = isConnected ? address : manualAddress;

  // Calculate claim amounts based on verifications
  const getClaimAmounts = () => {
    if (twitterPostUrl) {
      return CLAIM_AMOUNTS[VerificationLevel.TWITTER];
    }
    return CLAIM_AMOUNTS[VerificationLevel.GITHUB];
  };

  const claimAmounts = getClaimAmounts();

  const handleGithubConnect = async () => {
    setLoading(true);
    try {
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/github';
    } catch (error) {
      setMessage('Failed to connect to GitHub');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!effectiveAddress) {
      setMessage('Please connect wallet or enter an address');
      return;
    }

    if (!githubConnected) {
      setMessage('GitHub connection is required to claim tokens');
      return;
    }

    setClaiming(true);
    setMessage('');

    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: effectiveAddress,
          twitterPostUrl: twitterPostUrl || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Successfully claimed ${claimAmounts.celo} CELO and ${claimAmounts.ccop} cCOP! TX: ${data.txHash}`);
        setTwitterPostUrl('');
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Failed to claim tokens. Please try again.');
      console.error(error);
    } finally {
      setClaiming(false);
    }
  };

  // Check for GitHub auth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const github = params.get('github');
    const username = params.get('username');

    if (github === 'connected' && username) {
      setGithubConnected(true);
      setGithubUsername(username);
      setMessage('✅ GitHub connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/');
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-200">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Celo Colombia Faucet</h1>
        <p className="text-gray-600">Claim CELO and cCOP tokens on Alfajores testnet</p>
      </div>

      {/* Wallet Connection Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Wallet</h2>
          </div>
          <ConnectButton />
        </div>

        {!isConnected && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter address manually
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* GitHub Connection Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">GitHub Verification</h2>
            <span className="text-xs text-red-600">(Required)</span>
          </div>
          {githubConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <span className="text-sm">@{githubUsername}</span>
              <span className="text-lg">✓</span>
            </div>
          ) : (
            <button
              onClick={handleGithubConnect}
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect GitHub'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Twitter Verification Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Twitter className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">X (Twitter) Boost</h2>
          <span className="text-xs text-blue-600">(Optional +4 CELO & +4 cCOP)</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post on X tagging @celo_col and paste the link here
          </label>
          <input
            type="url"
            placeholder="https://twitter.com/..."
            value={twitterPostUrl}
            onChange={(e) => setTwitterPostUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Claim Amounts Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-gray-900 mb-2">Current Claim Amount</h3>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-blue-600">{claimAmounts.celo}</div>
            <div className="text-sm text-gray-600">CELO</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-green-600">{claimAmounts.ccop}</div>
            <div className="text-sm text-gray-600">cCOP</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Daily limit per address
        </div>
      </div>

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={claiming || !effectiveAddress || !githubConnected}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {claiming ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Claiming...
          </>
        ) : (
          'Claim Tokens'
        )}
      </button>

      {/* Message Display */}
      {message && (
        <div className={`mt-4 p-4 rounded-lg ${
          message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
          message.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          <p className="text-sm break-words">{message}</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          ⚠️ This faucet operates on the Celo Alfajores testnet. Tokens have no real value.
          Claims are limited to once per day per address.
        </p>
      </div>
    </div>
  );
}
