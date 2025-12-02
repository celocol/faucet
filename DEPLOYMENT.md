# Deployment Guide

## Deploying to Railway

### 1. Push to GitHub

First, commit and push your code to GitHub:

```bash
git add .
git commit -m "Initial faucet setup"
git push origin main
```

### 2. Create Railway Project

1. Go to [Railway](https://railway.app/)
2. Sign in with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your faucet repository

### 3. Configure Environment Variables

In Railway, go to your project settings and add these environment variables:

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_BASE_URL=https://your-app.up.railway.app
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
FAUCET_PRIVATE_KEY=0x_your_private_key_here
```

### 4. Update GitHub OAuth Callback URL

1. Go to your [GitHub OAuth App settings](https://github.com/settings/developers)
2. Update the Authorization callback URL to:
   ```
   https://your-app.up.railway.app/api/auth/github/callback
   ```

### 5. Deploy

Railway will automatically deploy your app. The build process uses the `.npmrc` file which handles the peer dependency conflicts.

### Troubleshooting

If the build fails:

1. **Check logs**: Railway provides detailed build logs
2. **Environment variables**: Make sure all required env vars are set
3. **GitHub OAuth**: Verify the callback URL matches your Railway URL
4. **Private key format**: Ensure FAUCET_PRIVATE_KEY starts with `0x`

### Build Configuration

The project includes:
- `.npmrc` with `legacy-peer-deps=true` to handle wagmi/rainbowkit version conflicts
- Next.js 16 with Turbopack (disabled in production builds automatically)
- All required dependencies in package.json

### Post-Deployment

1. **Test GitHub OAuth**: Click "Connect GitHub" on the deployed site
2. **Fund the faucet**: Send CELO and cCOP to your faucet wallet address
3. **Test a claim**: Connect a wallet and try claiming tokens
4. **Monitor**: Check Railway logs for any issues

### Cost Considerations

Railway offers:
- Free tier with $5 credit/month
- This app should run comfortably within the free tier limits
- Consider upgrading if you expect high traffic

### Security Notes

- Never commit `.env.local` to git (already in .gitignore)
- Use Railway's secret management for environment variables
- Rotate your faucet private key regularly
- Monitor transaction logs for suspicious activity
- Consider implementing additional rate limiting for production

---

## Alternative: Deploying to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables

```bash
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NEXT_PUBLIC_BASE_URL
vercel env add NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
vercel env add FAUCET_PRIVATE_KEY
```

### 4. Deploy to Production

```bash
vercel --prod
```

---

## Monitoring and Maintenance

### Health Checks

Monitor these endpoints:
- `/` - Main faucet page should load
- `/api/auth/github` - Should redirect to GitHub
- Check Railway/Vercel logs for API errors

### Database Migration (Future)

Currently using in-memory storage for claims. For production:

1. Set up PostgreSQL on Railway
2. Update claim tracking to use database
3. Implement proper migrations

### Updates

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically redeploy on push to main branch.
