// Claim amounts
export const CLAIM_AMOUNTS = {
  basic: {
    celo: 1,
    ccop: 1,
  },
  twitter: {
    celo: 5,
    ccop: 5,
  },
  self: {
    celo: 10,
    ccop: 10,
  },
};

// Token addresses on Celo Alfajores testnet
export const TOKEN_ADDRESSES = {
  ccop: '0x5F8d55c3627d2dc0a2B4afa798f877242F382F67',
};

// API endpoints
export const API_ROUTES = {
  claim: '/api/claim',
  verifyGithub: '/api/verify/github',
  verifyTwitter: '/api/verify/twitter',
  getStatus: '/api/status',
};
