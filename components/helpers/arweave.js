import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { calculate } from '@metaplex/arweave-cost';

export const LAMPORT_MULTIPLIER = LAMPORTS_PER_SOL;

export const ARWEAVE_UPLOAD_ENDPOINT =
  'https://us-central1-metaplex-studios.cloudfunctions.net/uploadFile';

export async function getAssetCostToStore(files){
  const sizes = files.map(f => f.size);
  const result = await calculate(sizes);
  return LAMPORTS_PER_SOL * result.solana;
}
