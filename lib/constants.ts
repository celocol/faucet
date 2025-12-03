// Verification levels (must match smart contract enum)
export enum VerificationLevel {
  NONE = 0,
  GITHUB = 1,
  TWITTER = 2,
  SELF = 3,
}

// Base claim amount
export const BASE_CLAIM_AMOUNT = {
  celo: 1,
  ccop: 1,
};

// Verification multipliers
export const VERIFICATION_MULTIPLIERS = {
  [VerificationLevel.GITHUB]: 5,
  [VerificationLevel.TWITTER]: 5,
  [VerificationLevel.SELF]: 10, // Not stackable with others
};

// Legacy: Claim amounts (from smart contract)
export const CLAIM_AMOUNTS = {
  [VerificationLevel.GITHUB]: {
    celo: 1,
    ccop: 1,
  },
  [VerificationLevel.TWITTER]: {
    celo: 5,
    ccop: 5,
  },
  [VerificationLevel.SELF]: {
    celo: 10,
    ccop: 10,
  },
};

// Token addresses on Celo Sepolia testnet
export const TOKEN_ADDRESSES = {
  ccop: '0x5F8d55c3627d2dc0a2B4afa798f877242F382F67',
};

// Faucet contract address (update after deployment)
export const FAUCET_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS || '';

// API endpoints
export const API_ROUTES = {
  getSignature: '/api/signature',
  verifyGithub: '/api/verify/github',
  verifyTwitter: '/api/verify/twitter',
  getStatus: '/api/status',
};
