import '../styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, midnightTheme } from '@rainbow-me/rainbowkit';
import type { AppProps } from 'next/app';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  sepolia,
} from 'wagmi/chains';
import { alchemyProvider } from '@wagmi/core/providers/alchemy'
import {publicProvider} from '@wagmi/core/providers/public'
import { IDProvider } from '../context/IDContext';

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY!;
const project = process.env.NEXT_PUBLIC_PROJECT_ID!;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    sepolia,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  [
    alchemyProvider({apiKey: alchemyApiKey}),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Fantasy Payments',
  projectId: project,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <IDProvider>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider modalSize="compact" chains={chains} theme={midnightTheme()}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig>
    </IDProvider>
  );
}

export default MyApp;
