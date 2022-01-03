import * as web3 from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { mintNFT } from './utils';

export const NFT = () => {

  const connection = new web3.Connection(
    'http://127.0.0.1:8899',
    'confirmed',
  );

  const generateWallet = async () => {
    let newWallet = web3.Keypair.generate();
    let newAirdropSignature = await connection.requestAirdrop(
      newWallet.publicKey,
      web3.LAMPORTS_PER_SOL,
    );
    await connection.confirmTransaction(newAirdropSignature);
    return newWallet;
  }


  const printAccountInfo = (info) => {
    console.log("{");
    console.log("address:", info.address.toString());
    console.log("owner:", info.owner.toString());
    console.log("tokens:", info.amount.toString());
    console.log("}");
  }


  const generateMint = async (authorityWallet) => {
    const mint = await splToken.Token.createMint(
      connection,
      authorityWallet,
      authorityWallet.publicKey,
      authorityWallet.publicKey,
      0,
      splToken.TOKEN_PROGRAM_ID,
    );
    return mint;
  }


  const test = async () => {
    console.log("start");
    let temp = await generateWallet();
    console.log(temp.publicKey.toString())
    let tempMint = await generateMint(temp);
    let assoc = await tempMint.getOrCreateAssociatedAccountInfo(
      temp.publicKey,
    );
    let info = await tempMint.getAccountInfo(assoc.address);
    printAccountInfo(info);
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(window.solana.publicKey.toString());
      }, 2000);
    });
    promise.then(val => {
      console.log(val);
    });
    console.log("middle")
  }


  const testmetaplex = async () => {
    const key = window.solana.publicKey.toBase58();
    const metadata = {
      name: 'Page',
      symbol: '',
      description: "AB AETERNO",
      external_url: '',
      image: 'https://arweave.net/nhjGl6alIKUbS9MmkYRCaf1MjjTtDEGtuSF42gaIW7k',
      attributes: '',
      seller_fee_basis_points: 0,
      creators: [
        {
          key,
          label: key,
          value: key,
        },
      ],
      properties: {},
    };

    const metadataAddress = mintNFT(
      connection,
      window.solana.publicKey,
      'https://arweave.net/nhjGl6alIKUbS9MmkYRCaf1MjjTtDEGtuSF42gaIW7k',
      false,
    );

    return metadataAddress
  }


  return (
    <>
      <button
        onClick={testmetaplex}
        className="py-2 px-4 border border-purple-700 rounded-md text-sm font-medium text-purple-700 whitespace-nowrap hover:bg-purple-200"
      >
      test metaplex 
      </button>
    </>
  );
}

export default NFT;
