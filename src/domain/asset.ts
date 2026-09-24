import type {
  CurrencyCode,
  DocumentId,
} from "./value-objects";

/** Future contract only. Asset is identity/catalog, never a portfolio position. */
export type Asset = Readonly<{
  id: DocumentId;
  symbol: string;
  market: string;
  assetType: string;
  currency: CurrencyCode;
}>;
