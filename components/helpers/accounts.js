import {
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
} from "./constants";

import { PublicKey } from "@solana/web3.js";

import { web3 } from "@project-serum/anchor";

export const getTokenWallet = async function (wallet, mint) {
  console.log("getTokenWallet() called");
  return (
    await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )
  )[0];
};

export const getMetadata = async (mint) => {
  console.log("getMetadata() called");
  return (
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const getMasterEdition = async (mint) => {
  console.log("getMasterEdition() called");
  return (
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};
