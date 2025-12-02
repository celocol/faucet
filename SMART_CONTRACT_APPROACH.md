# Smart Contract Approach - Architecture

## Why Smart Contract is Better

### ❌ Old Approach (Centralized Wallet)
- Backend holds tokens in a wallet with private key
- Users request tokens via API
- Backend signs transactions and sends tokens
- **Problems:**
  - Private key stored on server = security risk
  - Single point of failure
  - Users must trust the backend
  - Not transparent or auditable

### ✅ New Approach (Smart Contract)
- Smart contract holds tokens on-chain
- Users interact directly with the contract
- Backend only signs verification messages
- **Benefits:**
  - ✅ No private key on server (only verifier key for signatures)
  - ✅ Transparent and auditable
  - ✅ Trustless - smart contract enforces rules
  - ✅ Users interact directly with blockchain
  - ✅ More secure and decentralized

## Architecture Overview

```
┌─────────────┐          ┌──────────────┐          ┌─────────────────┐
│             │          │              │          │                 │
│    User     │◄────────►│   Frontend   │◄────────►│   Backend API   │
│   Wallet    │          │              │          │   (Verifier)    │
│             │          │              │          │                 │
└─────────────┘          └──────────────┘          └─────────────────┘
       │                         │                          │
       │                         │                          │
       │        Claim TX         │     Request Signature    │
       └────────────────────────►│◄─────────────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │                  │
                        │  Smart Contract  │
                        │  (On-Chain)      │
                        │                  │
                        └──────────────────┘
                                 │
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
              ┌──────────┐            ┌──────────┐
              │   CELO   │            │   cCOP   │
              │  Tokens  │            │  Tokens  │
              └──────────┘            └──────────┘
```

## How It Works

### 1. Contract Deployment
```bash
# Deploy the smart contract
npx hardhat run scripts/deploy.ts --network alfajores

# Contract is deployed with:
# - cCOP token address
# - Verifier address (backend wallet)
```

### 2. Fund the Contract
```bash
# Send CELO directly to contract address
# Transfer cCOP tokens to contract address
```

### 3. User Claims Tokens

#### Step 1: User connects GitHub
- User authenticates with GitHub OAuth
- Backend verifies GitHub account
- Backend stores verification in session

#### Step 2: (Optional) User verifies Twitter
- User posts on X mentioning @celo_col
- User submits post URL
- Backend validates URL format

#### Step 3: User requests signature
- Frontend requests signature from backend API
- Backend checks:
  - GitHub verified? ✓
  - Twitter verified? (optional)
  - Determines verification level (GITHUB, TWITTER, or SELF)
- Backend signs message: `sign(userAddress + verificationLevel)`
- Backend returns signature to frontend

#### Step 4: User claims from contract
- Frontend calls smart contract with:
  - Verification level
  - Signature from backend
- Smart contract:
  - Verifies signature is from verifier
  - Checks cooldown period (24 hours)
  - Transfers CELO and cCOP to user
  - Records claim on-chain

## Smart Contract Details

### Contract: `CeloColombiaFaucet.sol`

**Key Functions:**
- `claim(verificationLevel, signature)` - Claim tokens
- `canClaim(address)` - Check if user can claim
- `timeUntilNextClaim(address)` - Time until next claim
- `getBalances()` - Get contract balances

**Verification Levels:**
```solidity
enum VerificationLevel {
    NONE,    // 0 - Not allowed
    GITHUB,  // 1 - Basic: 1 CELO + 1 cCOP
    TWITTER, // 2 - Boost: 5 CELO + 5 cCOP
    SELF     // 3 - Max: 10 CELO + 10 cCOP
}
```

**Security Features:**
- ✅ ReentrancyGuard - Prevents reentrancy attacks
- ✅ Ownable - Only owner can withdraw funds
- ✅ Signature verification - Only verifier can approve claims
- ✅ Cooldown period - 24 hours between claims
- ✅ On-chain tracking - All claims recorded

## Backend Changes

### Old (Centralized):
```typescript
// ❌ Old: Backend sends tokens
const faucetWallet = new Wallet(FAUCET_PRIVATE_KEY);
await faucetWallet.sendTransaction({
  to: userAddress,
  value: parseEther("1.0")
});
```

### New (Smart Contract):
```typescript
// ✅ New: Backend only signs verification
const verifier = new Wallet(VERIFIER_PRIVATE_KEY);
const messageHash = solidityPackedKeccak256(
  ["address", "uint8"],
  [userAddress, verificationLevel]
);
const signature = await verifier.signMessage(arrayify(messageHash));
return { signature };
```

## Frontend Changes

### Old (Centralized):
```typescript
// ❌ Old: Call backend API to send tokens
const response = await fetch('/api/claim', {
  method: 'POST',
  body: JSON.stringify({ address, twitterPostUrl })
});
```

### New (Smart Contract):
```typescript
// ✅ New: Get signature, then call contract
// 1. Get signature from backend
const { signature } = await fetch('/api/signature', {
  method: 'POST',
  body: JSON.stringify({ address, twitterPostUrl })
}).then(r => r.json());

// 2. Call smart contract directly
const contract = new Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);
const tx = await contract.claim(verificationLevel, signature);
await tx.wait();
```

## Environment Variables

### Old:
```env
FAUCET_PRIVATE_KEY=0x...  # ❌ Holds all the funds
```

### New:
```env
VERIFIER_PRIVATE_KEY=0x...              # ✅ Only signs messages
NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=0x...  # Contract address
DEPLOYER_PRIVATE_KEY=0x...               # Only for deployment
```

## Deployment Steps

### 1. Deploy Contract
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat compile
npx hardhat run scripts/deploy.ts --network alfajores
```

### 2. Fund Contract
```bash
# Send CELO to contract address
# Transfer cCOP tokens to contract address
```

### 3. Update Environment
```env
NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=<deployed_contract_address>
VERIFIER_PRIVATE_KEY=<verifier_wallet_private_key>
```

### 4. Deploy Frontend
```bash
git add .
git commit -m "Switch to smart contract approach"
git push origin main
# Railway will deploy with updated config
```

## Testing

### Local Testing:
```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost

# Update .env.local with local contract address
# Test frontend with local network
```

### Testnet Testing:
```bash
# Deploy to Alfajores
npx hardhat run scripts/deploy.ts --network alfajores

# Fund contract
# Test claims through frontend
```

## Security Considerations

1. **Verifier Private Key**
   - Only used for signing messages
   - Does NOT hold any funds
   - If compromised: attacker can bypass verification but can't steal funds
   - Easy to rotate: just deploy new verifier

2. **Contract Owner Key**
   - Can withdraw funds from contract
   - Keep this key very secure
   - Consider multi-sig in production

3. **Signature Verification**
   - Contract verifies every signature
   - Can't claim without valid signature from verifier
   - Cooldown period prevents spam

4. **On-Chain Tracking**
   - All claims recorded on blockchain
   - Transparent and auditable
   - Can detect abuse patterns

## Advantages Summary

| Feature | Centralized | Smart Contract |
|---------|-------------|----------------|
| Security | ❌ Private key on server | ✅ Funds in contract |
| Transparency | ❌ Backend only | ✅ On-chain records |
| Trust | ❌ Must trust backend | ✅ Trust smart contract |
| Auditability | ❌ Limited | ✅ Full on-chain history |
| Decentralization | ❌ Centralized | ✅ Decentralized |
| Key Compromise Risk | ❌ Lose all funds | ✅ Can rotate verifier |

## Next Steps

1. ✅ Smart contract created (`contracts/CeloFaucet.sol`)
2. ✅ Deployment script created (`scripts/deploy.ts`)
3. ✅ Hardhat configuration added (`hardhat.config.ts`)
4. ⏳ Update backend API to sign messages
5. ⏳ Update frontend to call contract
6. ⏳ Deploy contract to Alfajores
7. ⏳ Fund contract with tokens
8. ⏳ Test end-to-end
9. ⏳ Deploy to Railway

## Cost Comparison

### Old Approach:
- Gas for each transfer: ~21,000 gas + token transfer
- Backend pays gas for every claim
- Must keep backend wallet funded

### New Approach:
- Contract deployment: One-time cost (~1-2M gas)
- User pays gas for claim (~100k-150k gas)
- Backend pays nothing for claims
- More sustainable long-term

## Conclusion

The smart contract approach is:
- ✅ More secure
- ✅ More transparent
- ✅ More decentralized
- ✅ More sustainable
- ✅ Better user experience
- ✅ Easier to audit

**This is the recommended approach for any production faucet!** 🚀
