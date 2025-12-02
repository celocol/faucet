export interface UserStatus {
  address: string;
  githubConnected: boolean;
  githubUsername?: string;
  twitterVerified: boolean;
  lastClaimTime?: number;
  canClaim: boolean;
  claimAmounts: {
    celo: number;
    ccop: number;
  };
}

export interface ClaimRequest {
  address: string;
  githubToken?: string;
  twitterPostUrl?: string;
}

export interface ClaimResponse {
  success: boolean;
  message: string;
  txHash?: string;
}
