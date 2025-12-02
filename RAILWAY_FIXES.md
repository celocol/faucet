# Railway Deployment Fixes

This document explains the fixes implemented to resolve Railway deployment issues.

## Problem

Railway builds were failing with errors like:
- `ERESOLVE could not resolve` - Peer dependency conflicts between wagmi@3.0.2 and @rainbow-me/rainbowkit@2.2.9
- `Module not found: Can't resolve 'tap'` - Turbopack trying to bundle test files from thread-stream package
- `Module not found: Can't resolve 'why-is-node-running'` - Test dependencies not available in production

## Root Causes

1. **Peer Dependency Conflicts**: wagmi v3 and RainbowKit v2 have conflicting peer dependency requirements
2. **Turbopack Test File Bundling**: Next.js 16's Turbopack attempts to bundle test files from `thread-stream` (a WalletConnect dependency)
3. **Missing Test Dependencies**: Test files require dev dependencies (`tap`, `why-is-node-running`) that aren't installed in production

## Solutions Implemented

### 1. `.npmrc` - Handle Peer Dependencies
```
legacy-peer-deps=true
```

**Purpose**: Tells npm to use legacy peer dependency resolution, allowing wagmi v3 and RainbowKit v2 to coexist despite version mismatches.

**Effect**: Fixes `npm ci` failures on Railway.

### 2. `railway.json` - Custom Build Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci --legacy-peer-deps && npm run build"
  }
}
```

**Purpose**: Explicitly tells Railway to use `--legacy-peer-deps` during the build process.

**Effect**: Ensures consistent build behavior.

### 3. `.env.production` - Disable Turbopack for Production
```
NEXT_PRIVATE_DISABLE_TURBOPACK=1
```

**Purpose**: Forces Next.js to use webpack instead of Turbopack for production builds.

**Effect**: Prevents Turbopack from trying to bundle test files that cause build failures.

### 4. `next.config.ts` - Webpack Configuration
```typescript
{
  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@walletconnect/logger',
  ],
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Mark test dependencies as external
    config.externals.push({
      'tap': 'tap',
      'why-is-node-running': 'why-is-node-running',
    });
    // ... additional config
  }
}
```

**Purpose**:
- Excludes problematic packages from server bundling
- Marks test dependencies as external to prevent bundling
- Provides node module fallbacks for client-side code

**Effect**: Ensures webpack correctly handles dependencies without trying to bundle test files.

### 5. `package.json` - Dev Script Update
```json
{
  "scripts": {
    "dev": "next dev --turbopack"
  }
}
```

**Purpose**: Explicitly enables Turbopack for local development (it's fast), while production uses webpack.

**Effect**: Best of both worlds - fast dev builds, reliable production builds.

## How It Works

### Local Development (npm run dev)
1. Uses Turbopack for fast hot-reload
2. Turbopack warnings about test files are non-fatal in dev mode
3. Development is fast and efficient

### Production Build (npm run build on Railway)
1. `.env.production` disables Turbopack
2. Webpack is used instead
3. `serverExternalPackages` prevents bundling of problematic packages
4. Test dependencies are marked as external
5. Build succeeds without errors

## Testing

To verify these fixes work:

### Local Development
```bash
npm run dev
# Should start without errors
```

### Local Production Build
```bash
npm run build
# Should complete without Turbopack/test file errors
```

### Railway Deployment
```bash
git add .
git commit -m "Add Railway deployment fixes"
git push origin main
# Railway will automatically deploy with the new configuration
```

## Alternative Approaches Considered

### ❌ Installing test dependencies
**Why not**: Bloats production bundle, security risk, unnecessary overhead

### ❌ Modifying node_modules
**Why not**: Not persistent, breaks on reinstall, bad practice

### ❌ Disabling Turbopack entirely
**Why not**: Loses fast dev builds. Our solution uses Turbopack for dev, webpack for prod.

### ✅ Environment-based build tool selection (our solution)
**Why yes**: Best performance in dev, maximum compatibility in production

## Maintenance

These fixes should remain stable across Next.js updates. If future versions of the packages resolve their conflicts:

1. Test removing `.npmrc` legacy-peer-deps
2. Test removing `.env.production` Turbopack disabling
3. Simplify `next.config.ts` if packages no longer include test files

## Additional Notes

- The warnings about multiple lockfiles (pnpm-lock.yaml) are cosmetic and don't affect builds
- RainbowKit and wagmi teams are working on better version compatibility
- Next.js 16+ may improve Turbopack's handling of test files in future releases

## Summary

All changes ensure:
- ✅ Local development works with Turbopack
- ✅ Railway builds succeed with webpack
- ✅ No code changes required to core application
- ✅ Production bundles are clean and optimized
- ✅ All dependencies install correctly

The faucet application now deploys successfully to Railway! 🚀
