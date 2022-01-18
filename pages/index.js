import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useMemo } from "react";
import ConnectToPhantom from "../components/ConnectToPhantom";
import NFT from "../components/NFT";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
require("@solana/wallet-adapter-react-ui/styles.css");

export default function Home() {
  // You can also provide a custom RPC endpoint.
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint="http://localhost:8899">
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <div className="h-screen flex items-center justify-center">
            <WalletMultiButton />
            <WalletDisconnectButton />
            {/*<ConnectToPhantom /> */}
            <NFT />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
