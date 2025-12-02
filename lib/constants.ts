// Verification levels (must match smart contract enum)
export enum VerificationLevel {
  NONE = 0,
  GITHUB = 1,
  TWITTER = 2,
  SELF = 3,
}

// Claim amounts (from smart contract)
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

// Token addresses on Celo Alfajores testnet
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
