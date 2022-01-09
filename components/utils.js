import {
  createAssociatedTokenAccountInstruction,
  createMetadataInstruction,
  createMasterEditionInstruction,

  ////  createUpdateMetadataInstruction,
} from "./helpers/instructions";

import { sendTransactionWithRetryWithKeypair } from "./helpers/transactions";

import {
  getTokenWallet,
  getMetadata,
  getMasterEdition,
} from "./helpers/accounts";

import * as anchor from "@project-serum/anchor";
console.log(anchor);
import {
  Data,
  Creator,
  CreateMetadataArgs,
  ////UpdateMetadataArgs,
  CreateMasterEditionArgs,
  METADATA_SCHEMA,
} from "./helpers/schema";

import { serialize } from "borsh";

import { TOKEN_PROGRAM_ID } from "./helpers/constants";

import fetch from "node-fetch";

import { MintLayout, Token } from "@solana/spl-token";

import {
  Keypair,
  Connection,
  SystemProgram,
  TransactionInstruction,
  PublicKey,
} from "@solana/web3.js";

//============================================================================
//createMetadata()
//============================================================================
export const createMetadata = async (metadataLink) => {
  console.log("createMetadata() called");
  // Metadata
  let metadata;
  try {
    metadata = await (
      await fetch(metadataLink, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
    ).json();
  } catch (e) {
    return;
  }

  // Validate metadata
  if (
    !metadata.name ||
    !metadata.image ||
    isNaN(metadata.seller_fee_basis_points) ||
    !metadata.properties ||
    !Array.isArray(metadata.properties.creators)
  ) {
    return;
  }

  // Validate creators
  const metaCreators = metadata.properties.creators;
  if (
    metaCreators.some((creator) => !creator.address) ||
    metaCreators.reduce((sum, creator) => creator.share + sum, 0) !== 100
  ) {
    return;
  }

  const creators = metaCreators.map(
    (creator) =>
      new Creator({
        address: creator.address,
        share: creator.share,
        verified: 1,
      })
  );

  console.log("metadata created successfully");
  return new Data({
    symbol: metadata.symbol,
    name: metadata.name,
    uri: metadataLink,
    sellerFeeBasisPoints: metadata.seller_fee_basis_points,
    creators: creators,
  });
};

//============================================================================
//mintNFT()
//============================================================================

export const mintNFT = async (
  connection,
  publicKey,
  metadataLink,
  progressCallback
) => {
  console.log(publicKey);
  if (!publicKey) return;
  console.log("test");
  const metadata = await createMetadata(metadataLink);

  const metadataContent = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    seller_fee_basis_points: metadata.sellerFeeBasisPoints,
    image: metadata.image,
    animation_url: metadata.animation_url,
    attributes: metadata.attributes,
    external_url: metadata.external_url,
    properties: {
      ...metadata.properties,
      creators: metadata.creators?.map((creator) => {
        return {
          address: creator.address,
          share: creator.share,
        };
      }),
    },
  };

  const realFiles = [
    new File([JSON.stringify(metadataContent)], "RESERVED_METADATA"),
  ];

  progressCallback(1);

  // Allocate memory for the account
  console.log("mintRent")
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );

  // Generate a mint
  console.log("instructions")
  const mint = anchor.web3.Keypair.generate();
  const instructions = [];
  const signers = [mint, walletKeypair];

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  instructions.push(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      0,
      publicKey,
      publicKey
    )
  );

  const userTokenAccoutAddress = await getTokenWallet(
    publicKey,
    mint.publicKey
  );
  instructions.push(
    createAssociatedTokenAccountInstruction(
      userTokenAccoutAddress,
      publicKey,
      publicKey,
      mint.publicKey
    )
  );

  // Create metadata
  const metadataAccount = await getMetadata(mint.publicKey);
  let txnData = Buffer.from(
    serialize(
      METADATA_SCHEMA,
      new CreateMetadataArgs({ data, isMutable: mutableMetadata })
    )
  );

  instructions.push(
    createMetadataInstruction(
      metadataAccount,
      mint.publicKey,
      publicKey,
      publicKey,
      publicKey,
      txnData
    )
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      userTokenAccoutAddress,
      publicKey,
      [],
      1
    )
  );

  // Create master edition
  const editionAccount = await getMasterEdition(mint.publicKey);
  txnData = Buffer.from(
    serialize(
      METADATA_SCHEMA,
      new CreateMasterEditionArgs({ maxSupply: new anchor.BN(0) })
    )
  );

  instructions.push(
    createMasterEditionInstruction(
      metadataAccount,
      editionAccount,
      mint.publicKey,
      publicKey,
      publicKey,
      publicKey,
      txnData
    )
  );

  const res = await sendTransactionWithRetryWithKeypair(
    connection,
    walletKeypair,
    instructions,
    signers
  );
  progressCallback(3);

  try {
    await connection.confirmTransaction(txid, "max");
    progressCallback(4);
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  // await connection.confirmTransaction(txid, 'max');
  await connection.getParsedConfirmedTransaction(txid, "confirmed");

  progressCallback(5);

  // TODO:
  // 1. Jordan: --- upload file and metadata to storage API
  // 2. pay for storage by hashing files and attaching memo for each file
  console.log(metadataAccount.toString());
  return { metadataAccount };
};

export const prepPayForFilesTxn = async (wallet, files, metadata) => {
  const memo = programIds().memo;

  const instructions = [];
  const signers = [];

  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: await getAssetCostToStore(files),
      })
    );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(await files[i].text());
    const hex = hashSum.digest("hex");
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      })
    );
  }

  return {
    instructions,
    signers,
  };
};

export const mintNFT2 = async (
  connection,
  walletKeypair,
  metadataLink,
  mutableMetadata
) => {
  console.log("mintNFT() called");
  // Retrieve metadata
  const data = await createMetadata(metadataLink);
  console.log("metadata: ", data.toString());
  if (!data) return;

  // Create wallet from keypair
  console.log(anchor);
  const wallet = new anchor.NodeWallet(walletKeypair);
  if (!wallet.publicKey) return;

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );

  // Generate a mint
  const mint = anchor.web3.Keypair.generate();
  const instructions = [];
  const signers = [mint, walletKeypair];

  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    })
  );
  instructions.push(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      0,
      wallet.publicKey,
      wallet.publicKey
    )
  );

  const userTokenAccoutAddress = await getTokenWallet(
    wallet.publicKey,
    mint.publicKey
  );
  instructions.push(
    createAssociatedTokenAccountInstruction(
      userTokenAccoutAddress,
      wallet.publicKey,
      wallet.publicKey,
      mint.publicKey
    )
  );

  // Create metadata
  const metadataAccount = await getMetadata(mint.publicKey);
  let txnData = Buffer.from(
    serialize(
      METADATA_SCHEMA,
      new CreateMetadataArgs({ data, isMutable: mutableMetadata })
    )
  );

  instructions.push(
    createMetadataInstruction(
      metadataAccount,
      mint.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      txnData
    )
  );

  instructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint.publicKey,
      userTokenAccoutAddress,
      wallet.publicKey,
      [],
      1
    )
  );

  // Create master edition
  const editionAccount = await getMasterEdition(mint.publicKey);
  txnData = Buffer.from(
    serialize(
      METADATA_SCHEMA,
      new CreateMasterEditionArgs({ maxSupply: new anchor.BN(0) })
    )
  );

  instructions.push(
    createMasterEditionInstruction(
      metadataAccount,
      editionAccount,
      mint.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      wallet.publicKey,
      txnData
    )
  );

  const res = await sendTransactionWithRetryWithKeypair(
    connection,
    walletKeypair,
    instructions,
    signers
  );

  try {
    await connection.confirmTransaction(res.txid, "max");
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  await connection.getParsedConfirmedTransaction(res.txid, "confirmed");
  console.log(metadataAccount.toString());
  return metadataAccount;
};
