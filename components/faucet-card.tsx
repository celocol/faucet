'use client';

import { useState, useEffect, useRef } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Wallet, Github, Twitter, Loader2, Sun, Moon, ExternalLink } from 'lucide-react';
import { BASE_CLAIM_AMOUNT, VERIFICATION_MULTIPLIERS, VerificationLevel } from '@/lib/constants';
import ReCAPTCHA from 'react-google-recaptcha';
import { useTheme } from '@/app/providers';

export function FaucetCard() {
  const { address, isConnected } = useAccount();
  const { theme, toggleTheme } = useTheme();
  const [manualAddress, setManualAddress] = useState('');
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [twitterPostUrl, setTwitterPostUrl] = useState('');
  const [twitterValidating, setTwitterValidating] = useState(false);
  const [twitterValid, setTwitterValid] = useState<boolean | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [claimsRemaining, setClaimsRemaining] = useState<number>(10);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const effectiveAddress = isConnected ? address : manualAddress;
  const maxDailyClaims = githubConnected || twitterValid ? 10 : 4;

  // Calculate claim amounts based on verifications
  const getClaimAmounts = () => {
    // If captcha is required and not completed, show 0
    const isCaptchaRequired = !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (isCaptchaRequired && !captchaToken) {
      return {
        celo: 0,
        ccop: 0,
        multiplier: 0,
      };
    }

    let multiplier = 1;

    // GitHub verification (optional)
    if (githubConnected) {
      multiplier *= VERIFICATION_MULTIPLIERS[VerificationLevel.GITHUB];
    }

    // Twitter verification (optional, multiplicative) - only if validated
    if (twitterValid) {
      multiplier *= VERIFICATION_MULTIPLIERS[VerificationLevel.TWITTER];
    }

    return {
      celo: BASE_CLAIM_AMOUNT.celo * multiplier,
      ccop: BASE_CLAIM_AMOUNT.ccop * multiplier,
      multiplier,
    };
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

  const validateTwitterPost = async (url: string) => {
    if (!url) {
      setTwitterValid(null);
      return;
    }

    // Basic URL validation
    const twitterRegex = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/;
    if (!twitterRegex.test(url)) {
      setTwitterValid(false);
      return;
    }

    setTwitterValidating(true);
    setTwitterValid(null);

    try {
      // Simple client-side check for now
      // In production, this would call the backend to verify @celo_col mention
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // For now, just validate URL format
      // Backend will do real verification when claiming
      setTwitterValid(true);
    } catch (error) {
      setTwitterValid(false);
    } finally {
      setTwitterValidating(false);
    }
  };

  const handleClaim = async () => {
    if (!effectiveAddress) {
      setMessage('Please connect wallet or enter an address');
      return;
    }

    // Only require captcha if it's configured
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setMessage('Please complete the captcha verification');
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
          captchaToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Successfully claimed ${claimAmounts.celo} CELO and ${claimAmounts.ccop} cCOP! TX: ${data.txHash}`);
        setTwitterPostUrl('');
        // Reset captcha
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
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
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-yellow-200 dark:border-yellow-600 transition-colors duration-200">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400 bg-clip-text text-transparent mb-2">
            Celo Colombia Faucet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Claim CELO and cCOP tokens on Celo Sepolia testnet</p>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Daily Claims Counter */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Claims</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Resets every 24 hours</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {claimsRemaining}/{maxDailyClaims}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">remaining</p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Wallet</h2>
          </div>
          <ConnectButton />
        </div>

        {!isConnected && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or enter address manually
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* GitHub Connection Section */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">GitHub Verification</h2>
            <span className="text-xs text-blue-600 dark:text-blue-400">(Optional - 5x Multiplier)</span>
          </div>
          {githubConnected ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="text-sm">@{githubUsername}</span>
              <span className="text-lg">✓</span>
            </div>
          ) : (
            <button
              onClick={handleGithubConnect}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 dark:bg-yellow-600 text-white rounded-lg hover:bg-yellow-600 dark:hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
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
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Twitter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">X (Twitter) Boost</h2>
          <span className="text-xs text-yellow-600 dark:text-yellow-400">(Optional - 5x Multiplier = 25x Total!)</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Post on X mentioning @celo_col and paste the link here
          </label>
          <div className="relative">
            <input
              type="url"
              placeholder="https://twitter.com/..."
              value={twitterPostUrl}
              onChange={(e) => {
                setTwitterPostUrl(e.target.value);
                validateTwitterPost(e.target.value);
              }}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent ${
                twitterValid === true
                  ? 'border-green-500 dark:border-green-400 focus:ring-green-500 dark:focus:ring-green-400'
                  : twitterValid === false
                  ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-yellow-500 dark:focus:ring-yellow-400'
              }`}
            />
            {twitterValidating && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
            {!twitterValidating && twitterValid === true && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-green-600 text-lg">✓</span>
              </div>
            )}
            {!twitterValidating && twitterValid === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="text-red-600 text-lg">✗</span>
              </div>
            )}
          </div>
          {twitterValid === true && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">✅ Valid X post! 5x multiplier will be applied.</p>
          )}
          {twitterValid === false && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">❌ Invalid URL. Must be a valid X/Twitter post link.</p>
          )}
        </div>
      </div>

      {/* Claim Amounts Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Current Claim Amount</h3>
          {claimAmounts.multiplier >= 1 && (
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">
              {claimAmounts.multiplier}x Multiplier
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{claimAmounts.celo}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">CELO</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{claimAmounts.ccop}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">cCOP</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {claimAmounts.multiplier === 0 && 'Complete captcha to see claim amount'}
          {claimAmounts.multiplier > 0 && !githubConnected && !twitterValid && 'Add verifications to increase your claim amount!'}
          {claimAmounts.multiplier > 0 && githubConnected && !twitterValid && 'Add X verification to get 25x total!'}
          {claimAmounts.multiplier > 0 && !githubConnected && twitterValid && 'Add GitHub verification to get 25x total!'}
          {claimAmounts.multiplier > 0 && githubConnected && twitterValid && 'Maximum multiplier active!'}
        </div>
      </div>

      {/* reCAPTCHA */}
      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
        <div className="mb-6 flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
            theme={theme}
          />
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
            ⚠️ reCAPTCHA not configured. Contact admin to enable bot protection.
          </p>
        </div>
      )}

      {/* Claim Button */}
      <button
        onClick={handleClaim}
        disabled={claiming || !effectiveAddress || (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? !captchaToken : false)}
        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
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
          message.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' :
          message.includes('❌') ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700' :
          'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
        }`}>
          <p className="text-sm break-words">{message}</p>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ This faucet operates on the Celo Sepolia testnet. Tokens have no real value.
          Claims are limited to {maxDailyClaims} times per day per address.
        </p>
      </div>

      {/* Useful Links */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Useful Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://docs.celo.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">Celo Docs</span>
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
          </a>
          <a
            href="https://celo-sepolia.blockscout.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">Block Explorer</span>
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
          </a>
          <a
            href="https://www.celocolombia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">Celo Colombia</span>
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
          </a>
          <a
            href="https://discord.gg/celo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">Discord Community</span>
            <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
