import {
  Blockhash,
  Commitment,
  Connection,
  FeeCalculator,
  Keypair,
  RpcResponseAndContext,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";

import { getUnixTs, sleep } from "./constants";

import { DEFAULT_TIMEOUT } from "./constants";

export const sendTransactionWithRetryWithKeypair = async (
  connection,
  wallet,
  instructions,
  signers,
  commitment = "singleGossip",
  includesFeePayer,
  beforeSend //set to either false, or a callback function
) => {
  console.log("sendTransactionWithRetryWithKeypair() called");
  const con = connection.connection;
  const transaction = new Transaction();
  instructions.forEach((instruction) => transaction.add(instruction));
  transaction.recentBlockhash = (
    await con.getRecentBlockhash(commitment)  
  ).blockhash;

  if (includesFeePayer) {
    transaction.setSigners(...signers.map((s) => s.publicKey));
  } else {
    transaction.setSigners(
      // fee payed by the wallet owner
      wallet.publicKey,
      ...signers.map((s) => s.publicKey)
    );
  }

  if (signers.length > 0) {
    wallet.signTransaction(transaction);
  } else {
    wallet.signTransaction(transaction);
  }

  if (beforeSend) {
    beforeSend();
  }

  console.log(wallet);

  const { txid, slot } = await wallet.sendTransaction(transaction, connection);

  return { txid, slot };
};
