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

export async function createUninitializedMint(
  instructions,
  payer,
  amount,
  signers,
) {
  const account = Keypair.generate();
  let inx3 = SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: MintLayout.span,
      programId: TOKEN_PROGRAM_ID,
    });
  console.log("from pubkey", payer);
  console.log("new account pubkey", account.publicKey);
  console.log("lamports", amount);
  console.log("mint layout", MintLayout.span);
  console.log("program id : ", inx3.data)
  console.log("3rd inx : ", inx3)

  let inx4 = new TransactionInstruction({
    keys: [
      {payer, true, true},
      {account.publicKey, true, true},
    ],
    programId: new PublicKey('11111111111111111111111111111111')
    inx3.data,
  });

  console.log("inx4 : ", inx4)

  instructions.push(
    inx3,
  );

  signers.push(account);

  return account.publicKey;
}

export async function createMint(
  instructions,
  payer,
  mintRentExempt,
  decimals,
  owner,
  freezeAuthority,
  signers,
) {
  console.log("instructions when createMint is called", instructions)
  const account = await createUninitializedMint(
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
