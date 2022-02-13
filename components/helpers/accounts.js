import { AccountLayout, MintLayout, Token } from '@solana/spl-token';

import {
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
} from './constants';

import {
  PublicKey,
  Keypair,
  SystemProgram,
} from '@solana/web3.js';

export const getTokenWallet = async function (
  wallet,
  mint,
) {
  console.log("getTokenWallet() called")
  return (
    await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    )
  )[0];
};

const PubKeysInternedMap = new Map();

export const toPublicKey = (key) => {
  if (typeof key !== 'string') {
    return key;
  }
  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }
  return result;
};

export function createUninitializedMint(
  instructions,
  payer,
  amount,
  signers,
) {
  const account = Keypair.generate();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    }),
  );

  signers.push(account);

  return account.publicKey;
}

export function createMint(
  instructions,
  payer,
  mintRentExempt,
  decimals,
  owner,
  freezeAuthority,
  signers,
) {
  const account = createUninitializedMint(
    instructions,
    payer,
    mintRentExempt,
    signers,
  );

  instructions.push(
    Token.createInitMintInstruction(
      TOKEN_PROGRAM_ID,
      account,
      decimals,
      owner,
      freezeAuthority,
    ),
  );

  return account;
}

export const getMetadata = async (
  mint,
) => {
  console.log("getMetadata() called")
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};

export const getMasterEdition = async (
  mint,
) => {
  console.log("getMasterEdition() called")
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )
  )[0];
};
