import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import ConnectToPhantom from "../components/ConnectToPhantom";
import NFT from "../components/NFT";

export default function Home() {
  return (
    <>
      <div className="h-screen flex items-center justify-center">
        <ConnectToPhantom />
        <NFT />
      </div>
    </>
  );
}
