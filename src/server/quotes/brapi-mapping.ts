import type { Asset } from "../../domain/asset";
import {
  mapAssetToBrapi as mapDomainAssetToBrapi,
  type BrapiAssetMapping,
} from "../../domain/quote";

/** The server adapter's only supported provider mapping. */
export function mapAssetToBrapi(asset: Asset): BrapiAssetMapping | null {
  // Asset normally arrives from the domain parser. Keep this guard at the
  // server boundary so a malformed synthetic/runtime value cannot become a
  // provider query parameter.
  if (
    typeof asset.symbol !== "string" ||
    asset.symbol.trim() !== asset.symbol ||
    !/^[A-Z0-9._-]+$/.test(asset.symbol)
  ) {
    return null;
  }

  return mapDomainAssetToBrapi(asset);
}

export type { BrapiAssetMapping } from "../../domain/quote";
