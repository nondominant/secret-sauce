
export class Data {
  name;
  symbol;
  uri;
  sellerFeeBasisPoints;
  //creators; //Creator[] | null;

  constructor(args) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    //this.creators = args.creators;
  }
}


export class Creator {
  address;
  verified;
  share;

  constructor(args) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}


export class CreateMetadataArgs {
  instruction;
  data;
  isMutable;

  constructor(args) {
    this.instruction = 0;
    this.data = args.data;
    this.isMutable = args.isMutable;
  }
}

export class Metadata {
  key;
  updateAuthority;
  mint;
  data;
  primarySaleHappened;
  isMutable;
  editionNonce;

  // set lazy
  masterEdition;
  edition;

  constructor(args) {
    this.key = MetadataKey.MetadataV1;
    this.updateAuthority = args.updateAuthority;
    this.mint = args.mint;
    this.data = args.data;
    this.primarySaleHappened = args.primarySaleHappened;
    this.isMutable = args.isMutable;
    this.editionNonce = args.editionNonce;
  }
}

class UpdateMetadataArgs {
  instruction;
  data;
  // Not used by this app, just required for instruction
  updateAuthority;
  primarySaleHappened;
  constructor(args) {
    this.data = args.data;
    this.updateAuthority = args.updateAuthority;
    this.primarySaleHappened = args.primarySaleHappened;
  }
}

class MintPrintingTokensArgs {
  instruction;
  supply;

  constructor(args) {
    this.supply = args.supply;
  }
}

class CreateMasterEditionArgs {
  instruction;
  maxSupply;
  constructor(args ) {
    this.maxSupply = args.maxSupply;
  }
}

export class MasterEditionV1 {
  key;
  supply;
  maxSupply;
  /// Can be used to mint tokens that give one-time permission to mint a single limited edition.
  printingMint;
  /// If you don't know how many printing tokens you are going to need, but you do know
  /// you are going to need some amount in the future, you can use a token from this mint.
  /// Coming back to token metadata with one of these tokens allows you to mint (one time)
  /// any number of printing tokens you want. This is used for instance by Auction Manager
  /// with participation NFTs, where we dont know how many people will bid and need participation
  /// printing tokens to redeem, so we give it ONE of these tokens to use after the auction is over,
  /// because when the auction begins we just dont know how many printing tokens we will need,
  /// but at the end we will. At the end it then burns this token with token-metadata to
  /// get the printing tokens it needs to give to bidders. Each bidder then redeems a printing token
  /// to get their limited editions.
  oneTimePrintingAuthorizationMint;

  constructor(args) {
    this.key = MetadataKey.MasterEditionV1;
    this.supply = args.supply;
    this.maxSupply = args.maxSupply;
    this.printingMint = args.printingMint;
    this.oneTimePrintingAuthorizationMint =
      args.oneTimePrintingAuthorizationMint;
  }
}

export class MasterEditionV2 {
  key;
  supply;
  maxSupply;

  constructor(args) {
    this.key = MetadataKey.MasterEditionV2;
    this.supply = args.supply;
    this.maxSupply = args.maxSupply;
  }
}

export class Edition {
  key;
  /// Points at MasterEdition struct
  parent;
  /// Starting at 0 for master record, this is incremented for each edition minted.
  edition;
  constructor(args) {
    this.key = MetadataKey.EditionV1;
    this.parent = args.parent;
    this.edition = args.edition;
  }
}

export class EditionMarker {
  key;
  ledger;

  constructor(args) {
    this.key = MetadataKey.EditionMarker;
    this.ledger = args.ledger;
  }

  editionTaken(edition) {
    const editionOffset = edition % EDITION_MARKER_BIT_SIZE;
    const indexOffset = Math.floor(editionOffset / 8);

    if (indexOffset > 30) {
      throw Error('bad index for edition');
    }

    const positionInBitsetFromRight = 7 - (editionOffset % 8);

    const mask = Math.pow(2, positionInBitsetFromRight);

    const appliedMask = this.ledger[indexOffset] & mask;

    return appliedMask != 0;
  }
}
//const value = new Test({ x: 255, y: 20, z: '123', q: [1, 2, 3] });
//const schema = new Map([
//  [Test, 
//    { 
//      kind: 'struct', 
//      fields: [
//        ['x', 'u8'], 
//        ['y', 'u64'], 
//        ['z', 'string'], 
//        ['q', [3]]
//      ] 
//    }
//  ]
//]);
//const buffer = borsh.serialize(schema, value);
export const METADATA_SCHEMA = new Map([
  [
    CreateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', Data],
        ['isMutable', 'u8'], // bool
      ]
    }
  ],
  [
    UpdateMetadataArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['data', { kind: 'option', type: Data }],
        ['updateAuthority', { kind: 'option', type: 'pubkeyAsString' }],
        ['primarySaleHappened', { kind: 'option', type: 'u8' }],
      ],
    },
  ],
  [
    CreateMasterEditionArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
  [
    MintPrintingTokensArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['supply', 'u64'],
      ],
    },
  ],
  [
    MasterEditionV1,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['supply', 'u64'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
        ['printingMint', 'pubkeyAsString'],
        ['oneTimePrintingAuthorizationMint', 'pubkeyAsString'],
      ],
    },
  ],
  [
    MasterEditionV2,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['supply', 'u64'],
        ['maxSupply', { kind: 'option', type: 'u64' }],
      ],
    },
  ],
  [
    Edition,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['parent', 'pubkeyAsString'],
        ['edition', 'u64'],
      ],
    },
  ],
  [
    Data,
    {
      kind: 'struct',
      fields: [
        ['name', 'string'],
        ['symbol', 'string'],
        ['uri', 'string'],
        ['sellerFeeBasisPoints', 'u16'],
        //['creators', { kind: 'option', type: [Creator] }],
      ],
    },
  ],
  [
    Creator,
    {
      kind: 'struct',
      fields: [
        ['address', 'pubkeyAsString'],
        ['verified', 'u8'],
        ['share', 'u8'],
      ],
    },
  ],
  [
    Metadata,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['updateAuthority', 'pubkeyAsString'],
        ['mint', 'pubkeyAsString'],
        ['data', Data],
        ['primarySaleHappened', 'u8'], // bool
        ['isMutable', 'u8'], // bool
        ['editionNonce', { kind: 'option', type: 'u8' }],
      ],
    },
  ],
  [
    EditionMarker,
    {
      kind: 'struct',
      fields: [
        ['key', 'u8'],
        ['ledger', [31]],
      ],
    },
  ],
]);
