import { METADATA_PROGRAM_ID } from './constants';
import { findProgramAddress } from './find';
import { toPublicKey } from './accounts';
import { METADATA_SCHEMA, CreateMetadataArgs } from './schema';
import { deserializeUnchecked, serialize } from 'borsh';
import {
  SystemProgram, 
  SYSVAR_RENT_PUBKEY, 
  TransactionInstruction, } from '@solana/web3.js';

export async function createMetadataAccount(
  data,
  updateAuthority,
  mintKey,
  mintAuthorityKey,
  instructions,
  payer,
) {
  console.log("helpers/metadata.js createMetadataAccount called")
  const metadataProgramId = METADATA_PROGRAM_ID;

  const metadataAccount = (
    await findProgramAddress(
      [
        Buffer.from('metadata'),
        toPublicKey(metadataProgramId).toBuffer(),
        toPublicKey(mintKey).toBuffer(),
      ],
      toPublicKey(metadataProgramId),
    )
  )[0];
  console.log('Data', data);
  const value = new CreateMetadataArgs({ data, isMutable: true });
  console.log("Value", value);
  console.log("METADATAT_SCHEMA corresponding createMetadataArgs value",
    METADATA_SCHEMA);
  const txnData = Buffer.from(serialize(METADATA_SCHEMA, value));
  console.log("txn Data created : ", txnData)

  const keys = [
    {
      pubkey: toPublicKey(metadataAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(mintKey),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(mintAuthorityKey),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(updateAuthority),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  instructions.push(
    new TransactionInstruction({
      keys,
      programId: toPublicKey(metadataProgramId),
      data: txnData,
    }),
  );

  return metadataAccount;
}
