import { listOwnedAssets } from "@/server/data/asset-reader";
import {
  FirebaseAdminNotConfiguredError,
  verifyIdToken,
} from "@/server/firebase-admin";
import { createQuoteService } from "@/server/quotes/quote-service";
import { createQuotesPostHandler } from "@/server/quotes/route-handler";

export const runtime = "nodejs";

const postQuotes = createQuotesPostHandler({
  async verifyIdToken(token) {
    try {
      return await verifyIdToken(token);
    } catch (error) {
      if (error instanceof FirebaseAdminNotConfiguredError) {
        throw error;
      }

      throw error;
    }
  },
  listOwnedAssets,
  quoteService: createQuoteService(),
});

export const POST = postQuotes;
