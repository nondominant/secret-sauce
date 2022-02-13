import { PublicKey } from '@solana/web3.js';

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112',
);

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

export const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export const AR_SOL_HOLDER_ID = new PublicKey(
  '6FKvsq4ydWFci6nGq9ckbjYMtnmaqAoatz5c9XWjiDuS',
);

export const DEFAULT_TIMEOUT = 15000;

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

export const SYSTEM = new PublicKey('11111111111111111111111111111111');

export const ORACLE_ID = new PublicKey(
  'rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9',
);

export const PACK_CREATE_ID = new PublicKey(
  'packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu',
);

export const METADATA_PROGRAM_ID =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

export const VAULT_ID =
  'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn';

export const AUCTION_ID =
  'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8';

export const METAPLEX_ID =
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98';
