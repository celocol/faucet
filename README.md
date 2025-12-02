# Celo Colombia Faucet

A faucet application for distributing CELO and cCOP tokens on the Celo Alfajores testnet.

## Features

- **GitHub Verification Required**: Users must connect their GitHub account to claim tokens
- **Wallet Integration**: Users can connect their wallet or manually enter an address
- **Twitter Boost**: Users can increase their claim amount by posting on X (Twitter) and tagging @celo_col
- **Daily Limits**: Claims are limited to once per 24 hours per address

### Claim Amounts

- **Basic Claim** (GitHub verified): 1 CELO + 1 cCOP
- **Twitter Boost** (with X post): 5 CELO + 5 cCOP
- **Self Verification** (coming soon): 10 CELO + 10 cCOP

## Prerequisites

- Node.js 18+ and npm
- A wallet with CELO and cCOP tokens on Alfajores testnet (for the faucet wallet)
- GitHub OAuth App credentials
- WalletConnect Project ID

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd faucet
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# GitHub OAuth Configuration
# Create at: https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Wallet Connect Project ID
# Get at: https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Faucet Wallet Private Key
# This wallet should have CELO and cCOP tokens
FAUCET_PRIVATE_KEY=0x_your_private_key_here
```

### 3. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Celo Colombia Faucet
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. Copy the Client ID and generate a Client Secret
5. Add these to your `.env.local` file

### 4. Get WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy the Project ID
4. Add it to your `.env.local` file

### 5. Set Up Faucet Wallet

1. Create a new wallet or use an existing one
2. Fund it with CELO and cCOP tokens on Alfajores testnet
3. Add the private key to `.env.local`

**Important**: Never commit your `.env.local` file or share your private key!

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the faucet.

### Production Build

```bash
npm run build
npm start
```

## Token Addresses

- **cCOP on Alfajores**: `0x5F8d55c3627d2dc0a2B4afa798f877242F382F67`

## How It Works

1. **User connects GitHub**: Required for all claims to prevent abuse
2. **User connects wallet or enters address**: Specifies where to receive tokens
3. **Optional Twitter boost**: User can post on X mentioning @celo_col and paste the link to increase claim amount
4. **Claim tokens**: User clicks claim and receives tokens instantly on Alfajores testnet
5. **Rate limiting**: Each address can claim once per 24 hours

## Project Structure

```
faucet/
├── app/
│   ├── api/
│   │   ├── auth/github/       # GitHub OAuth endpoints
│   │   └── claim/             # Token claim endpoint
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Main faucet page
├── components/
│   ├── faucet-card.tsx        # Main faucet UI component
│   └── providers.tsx          # Web3 providers wrapper
├── lib/
│   ├── config.ts              # Wagmi configuration
│   ├── constants.ts           # App constants
│   ├── store.ts               # In-memory claim tracking
│   └── twitter.ts             # Twitter verification helpers
└── types/
    └── index.ts               # TypeScript types
```

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Wagmi + Viem**: Ethereum library for React
- **RainbowKit**: Wallet connection UI
- **Celo**: Layer-1 blockchain

## Security Considerations

- Private keys are stored in environment variables (never commit them!)
- GitHub OAuth is required to prevent anonymous abuse
- Rate limiting prevents excessive claims
- In-memory storage (upgrade to proper database for production)

## Future Improvements

- Add Self verification integration
- Implement proper database (PostgreSQL/MongoDB)
- Add comprehensive Twitter API verification
- Add admin dashboard for monitoring
- Implement captcha for additional security
- Add claim history and statistics

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Deployment

For detailed deployment instructions to Railway or Vercel, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Railway Deploy

1. Push to GitHub
2. Connect repository to Railway
3. Add environment variables in Railway dashboard
4. Railway will automatically deploy using the `.npmrc` configuration

## License

MIT
