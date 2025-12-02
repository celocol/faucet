import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { celo, celoAlfajores } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Celo Colombia Faucet',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [celoAlfajores, celo],
  ssr: true,
});
