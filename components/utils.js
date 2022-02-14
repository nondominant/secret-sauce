import {
  createAssociatedTokenAccountInstruction,
  createMetadataInstruction,
  createMasterEditionInstruction,

  ////  createUpdateMetadataInstruction,
} from "./helpers/instructions";

import * as splToken from '@solana/spl-token';

import { 
  sendTransactionWithRetryWithKeypair,
  sendTransactionWithRetry,
} from "./helpers/transactions";

import { findProgramAddress } from "./helpers/find";

import crypto from 'crypto';

import {
  getTokenWallet,
  getMetadata,
  getMasterEdition,
  createMint,
  toPublicKey,
} from "./helpers/accounts";

import { createMetadataAccount } from "./helpers/metadata";


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

import { getAssetCostToStore } from "./helpers/arweave";

import { serialize } from "borsh";

import { 
  TOKEN_PROGRAM_ID, 
  MEMO_ID, 
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  AR_SOL_HOLDER_ID } from "./helpers/constants";

import fetch from "node-fetch";

import { MintLayout, Token } from "@solana/spl-token";

import {
  Keypair,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
  signTransaction,
  PublicKey,
} from "@solana/web3.js";



//============================================================================
//createMetadata()
//============================================================================
export const createMetadata = async (metadataLink) => {
  console.log("createMetadata() called");
  // Metadata
  const data = await fetch(metadataLink, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      // Validate metadata

      // Validate creators

      console.log("metadata created successfully");
      return new Data({
        symbol: data.symbol,
        name: data.name,
        uri: metadataLink,
        sellerFeeBasisPoints: data.seller_fee_basis_points,
        creators: data.properties.creators,
      });
    });
  return data;
};

//============================================================================
//mintNFT()
//============================================================================

export const mintNFT = async (
  connection,
  wallet,
  endpoint,
  metadataLink,
  progressCallback,
  maxSupply
) => {
  console.log(window.solana);
  if (!window.solana?.publicKey) return;
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

  const RESERVED_METADATA = 'metadata.json';

  const realFiles = [
    new File([JSON.stringify(metadataContent)], RESERVED_METADATA),
  ];

  const { instructions: pushInstructions, signers: pushSigners } =
    await prepPayForFilesTxn(window.solana, realFiles, metadata);


  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );
  // const accountRent = await connection.getMinimumBalanceForRentExemption(
  //   AccountLayout.span,
  // );

  // This owner is a temporary signer and owner of metadata we use to circumvent requesting signing
  // twice post Arweave. We store in an account (payer) and use it post-Arweave to update MD with new link
  // then give control back to the user.
  // const payer = new Account();
  
  const payerPublicKey = window.solana.publicKey.toBase58();
  const instructions = [...pushInstructions];
  const signers = [...pushSigners];

  // This is only temporarily owned by window.solana...transferred to program by createMasterEdition below
  const mintKeyString = await createMint(
    instructions,
    window.solana.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
    toPublicKey(payerPublicKey),
    toPublicKey(payerPublicKey),
    signers
  );
  const mintKey = mintKeyString.toBase58()
  console.log("instructions with mint", instructions)

  const recipientKey = (
    await findProgramAddress(
      [
        window.solana.publicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        toPublicKey(mintKey).toBuffer(),
      ],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )
  )[0];
  console.log("recipientKey : ", recipientKey);

  console.log("instructions BEFORE pushing createAssociatedTokenAccountInstruction", instructions);
  console.log("parameters : ");
   console.log(">recipient", toPublicKey(recipientKey));
   console.log(">window.solana", window.solana.publicKey);
   console.log(">window.solana again", window.solana.publicKey)
   console.log(">mintKey", toPublicKey(mintKey));
  createAssociatedTokenAccountInstruction(
    instructions,
    toPublicKey(recipientKey),
    window.solana.publicKey,
    window.solana.publicKey,
    toPublicKey(mintKey)
  );
  console.log("instructions AFTER pushing createAssociatedTokenAccountInstruction", instructions);

  //what kind of account is being created ... where is it being created?
  console.log("about to create metadata account")
  console.log("metadata.creators", metadata.creators);
  let singleCreator = metadata.creators;
  //PETER===========NEEDS BUG FIX METADATA.CREATORS.CREATORS.CREATORS
  const metadataAccount = await createMetadataAccount(
    new Data({
      symbol: metadata.symbol,
      name: metadata.name,
      uri: " ".repeat(64), // size of url for arweave
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
     // creators: [singleCreator],
    }),
    payerPublicKey,
    mintKey,
    payerPublicKey,
    instructions,
    window.solana.publicKey.toBase58()
  );
  //PETER===========NEEDS BUG FIX METADATA.CREATORS.CREATORS.CREATORS

  // TODO: enable when using payer account to avoid 2nd popup
  // const block = await connection.getRecentBlockhash('singleGossip');
  // instructions.push(
  //   SystemProgram.transfer({
  //     fromPubkey: window.solana.publicKey,
  //     toPubkey: payerPublicKey,
  //     lamports: 0.5 * LAMPORTS_PER_SOL // block.feeCalculator.lamportsPerSignature * 3 + mintRent, // TODO
  //   }),
  // );


  const transaction = new Transaction();
  console.log("instructions : ", instructions);
 // for (let i = 0; i < instructions.length - 1; i++) {
 //   transaction.add(instructions[i]);
 // }
  transaction.add(instructions[0])
  transaction.add(instructions[1])
  console.log("signers : ", signers[0]["_keypair"]);
  console.log("transaction object : ", transaction);
  console.log("connection object : ", connection);
//==============================================
  console.log("window object", window.solana);

  transaction.feePayer = payerPublicKey;                        
  let blockhashObj2 = await connection.getRecentBlockhash(); 
  transaction.recentBlockhash = await blockhashObj2.blockhash;
  console.log("transaction.recentblockhash : ", transaction.recentBlockhash)

  connection.getBalance(window.solana.publicKey).then(function(value) { console.log('balance of account ',value); })

  let Airdrop = await connection.requestAirdrop(
    window.solana.publicKey,
    1000000,
  );
  let message = await connection.confirmTransaction(Airdrop)
  console.log("airdrop ", message)

  let test = transaction;
  test.recentBlockhash = await blockhashObj2.blockhash;
  test.feePayer = window.solana.publicKey;
  let signed = await window.solana.signTransaction(test);               
  console.log("signed transaction: ", signed)
    // The signature is generated 
  const txid = await connection.sendRawTransaction(signed.serialize());                      

//let signed3 = signTransaction(transaction, window.solana, accountId, 'testnet');
//==============================================
 // const signature = await sendAndConfirmTransaction(
 //   connection,
 //   transaction,
 //   [signers[0]["_keypair"]],
 //   {commitment: 'confirmed'},
 // );
 // console.log("transaction signature", signature)
  //PETER================replaced with sendAndConfirmTransaction
//  const { txid } = await sendTransactionWithRetry(
//    connection,
//    window.solana,
//    instructions,
//    signers,
//    "single"
//  );
  //  ====================================================

  try {
    await connection.confirmTransaction(txid, "max");
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  // await connection.confirmTransaction(txid, 'max');
  await connection.getParsedConfirmedTransaction(txid, "confirmed");


  // this means we're done getting AR txn setup. Ship it off to ARWeave!
  const data = new FormData();
  metadata.append("transaction", txid);
  metadata.append("env", endpoint);

  const tags = realFiles.reduce((acc, f) => {
    acc[f.name] = [{ name: "mint", value: mintKey }];
    return acc;
  }, {});
  metadata.append("tags", JSON.stringify(tags));
  realFiles.map((f) => metadata.append("file[]", f));

  // TODO: convert to absolute file name for image

  const result = await uploadToArweave(metadata);

  const metadataFile = result.messages?.find(
    (m) => m.filename === RESERVED_TXN_MANIFEST
  );
  if (metadataFile?.transactionId && window.solana.publicKey) {
    const updateInstructions = [];
    const updateSigners = [];

    // TODO: connect to testnet arweave
    const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;
    await updateMetadata(
      new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: arweaveLink,
        creators: metadata.creators,
        sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      }),
      undefined,
      undefined,
      mintKey,
      payerPublicKey,
      updateInstructions,
      metadataAccount
    );

    updateInstructions.push(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        toPublicKey(mintKey),
        toPublicKey(recipientKey),
        toPublicKey(payerPublicKey),
        [],
        1
      )
    );

    // // In this instruction, mint authority will be removed from the main mint, while
    // // minting authority will be maintained for the Printing mint (which we want.)
    await createMasterEdition(
      maxSupply !== undefined ? new BN(maxSupply) : undefined,
      mintKey,
      payerPublicKey,
      payerPublicKey,
      payerPublicKey,
      updateInstructions
    );

    // TODO: enable when using payer account to avoid 2nd popup
    /*  if (maxSupply !== undefined)
      updateInstructions.push(
        setAuthority({
          target: authTokenAccount,
          currentAuthority: payerPublicKey,
          newAuthority: window.solana.publicKey,
          authorityType: 'AccountOwner',
        }),
      );
*/
    // TODO: enable when using payer account to avoid 2nd popup
    // Note with refactoring this needs to switch to the updateMetadataAccount command
    // await transferUpdateAuthority(
    //   metadataAccount,
    //   payerPublicKey,
    //   window.solana.publicKey,
    //   updateInstructions,
    // );


    const txid = await sendTransactionWithRetry(
      connection,
      window.solana,
      updateInstructions,
      updateSigners
    );

    notify({
      message: "Art created on Solana",
      description: (
        <a href={arweaveLink} target="_blank" rel="noopener noreferrer">
          Arweave Link
        </a>
      ),
      type: "success",
    });

    // TODO: refund funds

    // send transfer back to user
  }
  // TODO:
  // 1. Jordan: --- upload file and metadata to storage API
  // 2. pay for storage by hashing files and attaching memo for each file
  console.log(metadataAccount.toString());
  return { metadataAccount };
};

export const prepPayForFilesTxn = async (wallet, files, metadata) => {
  const memo = MEMO_ID;

  const instructions = [];
  const signers = [];
  const cost = await getAssetCostToStore(files);
  console.log("cost", cost);

  //Remove storage related transactions because we are using 
  //existing NFT's
  //=======================================================
  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: cost,
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
  //=======================================================
  console.log("prepPayForFilesTxn");
  console.log("instructions : ",instructions);
  console.log("signers : ", signers);
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
  const wallet = new anchor.Nodewallet(walletKeypair);
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

  const userTokenAccoutAddress = await getTokenwallet(
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

  console.log("data parameter passed to CreateMetadataArgs", data)
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
