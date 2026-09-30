export const successfulBrapiResponse = {
  results: [
    {
      requestedSymbol: "PETR4",
      symbol: "PETR4",
      changed: false,
      data: {
        currency: "BRL",
        regularMarketPrice: 41.18,
        regularMarketTime: "2026-09-30T12:00:00.000Z",
      },
    },
  ],
};

export const changedBrapiResponse = {
  results: [
    {
      requestedSymbol: "PETR4",
      symbol: "PETR4F",
      changed: true,
      data: {
        currency: "BRL",
        regularMarketPrice: 41.18,
        regularMarketTime: "2026-09-30T12:00:00.000Z",
      },
    },
  ],
};
