import {
  InvalidDateError,
  InvalidDecimalError,
  InvalidDomainInputError,
  InvalidDomainValueError,
} from "./errors";

const BASE_CURRENCY = "BRL" as const;
const ISO_4217_CODES = new Set([
  "AED",
  "AFN",
  "ALL",
  "AMD",
  "ANG",
  "AOA",
  "ARS",
  "AUD",
  "AWG",
  "AZN",
  "BAM",
  "BBD",
  "BDT",
  "BGN",
  "BHD",
  "BIF",
  "BMD",
  "BND",
  "BOB",
  "BOV",
  "BRL",
  "BSD",
  "BTN",
  "BWP",
  "BYN",
  "BZD",
  "CAD",
  "CDF",
  "CHE",
  "CHF",
  "CHW",
  "CLF",
  "CLP",
  "CNY",
  "COP",
  "COU",
  "CRC",
  "CUC",
  "CUP",
  "CVE",
  "CZK",
  "DJF",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ERN",
  "ETB",
  "EUR",
  "FJD",
  "FKP",
  "GBP",
  "GEL",
  "GHS",
  "GIP",
  "GMD",
  "GNF",
  "GTQ",
  "GYD",
  "HKD",
  "HNL",
  "HTG",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KHR",
  "KMF",
  "KPW",
  "KRW",
  "KWD",
  "KYD",
  "KZT",
  "LAK",
  "LBP",
  "LKR",
  "LRD",
  "LSL",
  "LYD",
  "MAD",
  "MDL",
  "MGA",
  "MKD",
  "MMK",
  "MNT",
  "MOP",
  "MRU",
  "MUR",
  "MVR",
  "MWK",
  "MXN",
  "MXV",
  "MYR",
  "MZN",
  "NAD",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "OMR",
  "PAB",
  "PEN",
  "PGK",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "RUB",
  "RWF",
  "SAR",
  "SBD",
  "SCR",
  "SDG",
  "SEK",
  "SGD",
  "SHP",
  "SLE",
  "SOS",
  "SRD",
  "SSP",
  "STN",
  "SVC",
  "SYP",
  "SZL",
  "THB",
  "TJS",
  "TMT",
  "TND",
  "TOP",
  "TRY",
  "TTD",
  "TWD",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "USN",
  "UYI",
  "UYU",
  "UYW",
  "UZS",
  "VED",
  "VES",
  "VND",
  "VUV",
  "WST",
  "XAF",
  "XAG",
  "XAU",
  "XBA",
  "XBB",
  "XBC",
  "XBD",
  "XCD",
  "XDR",
  "XOF",
  "XPD",
  "XPF",
  "XPT",
  "XSU",
  "XTS",
  "XUA",
  "XXX",
  "YER",
  "ZAR",
  "ZMW",
  "ZWG",
  "ZWL",
]);

declare const currencyCodeBrand: unique symbol;
declare const positiveMoneyMinorBrand: unique symbol;

/** ISO 4217 uppercase code; V1's Portfolio base currency is separately fixed to BRL. */
export type CurrencyCode = string & {
  readonly [currencyCodeBrand]: "CurrencyCode";
};

export type BaseCurrencyCode = typeof BASE_CURRENCY;

export { BASE_CURRENCY };

declare const decimalStringBrand: unique symbol;
declare const positiveDecimalStringBrand: unique symbol;
declare const basisPointsBrand: unique symbol;
declare const documentIdBrand: unique symbol;
declare const civilDateBrand: unique symbol;
declare const timestampPartsBrand: unique symbol;

/** Canonical decimal persisted as text: no exponent, float or ambiguous zeros. */
export type DecimalString = string & {
  readonly [decimalStringBrand]: "DecimalString";
};

/** Strictly positive canonical decimal used by quantities and unit prices. */
export type PositiveDecimalString = DecimalString & {
  readonly [positiveDecimalStringBrand]: "PositiveDecimalString";
};

/** Integer percentage where 10000 represents 100%. */
export type BasisPoints = number & {
  readonly [basisPointsBrand]: "BasisPoints";
};

/** Firestore document identity, kept separate from display names and tickers. */
export type DocumentId = string & {
  readonly [documentIdBrand]: "DocumentId";
};

/** Civil business date, independent from timezone and local Date parsing. */
export type CivilDate = string & {
  readonly [civilDateBrand]: "CivilDate";
};

/** Firebase Timestamp precision without importing the Firebase SDK into domain. */
export type TimestampParts = Readonly<{
  seconds: number;
  nanoseconds: number;
}> & {
  readonly [timestampPartsBrand]: "TimestampParts";
};

export type MoneyMinor = Readonly<{
  currency: CurrencyCode;
  amountMinor: number;
}>;

/** Money amount whose direction is supplied by its transaction kind. */
export type PositiveMoneyMinor = MoneyMinor & {
  readonly [positiveMoneyMinorBrand]: "PositiveMoneyMinor";
};

export type UnitPrice = Readonly<{
  currency: CurrencyCode;
  decimal: PositiveDecimalString;
}>;

export type Fee = Readonly<{
  currency: CurrencyCode;
  decimal: DecimalString;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  field: string,
): void {
  const actualKeys = Object.keys(value).sort();
  const allowedKeys = [...expectedKeys].sort();

  if (
    actualKeys.length !== allowedKeys.length ||
    actualKeys.some((key, index) => key !== allowedKeys[index])
  ) {
    throw new InvalidDomainInputError(
      field,
      `expected fields ${allowedKeys.join(", ")}`,
    );
  }
}

export function parseCurrencyCode(value: unknown): CurrencyCode {
  if (typeof value !== "string" || !ISO_4217_CODES.has(value)) {
    throw new InvalidDomainValueError(
      "currency",
      "must be an uppercase ISO 4217 code",
    );
  }

  return value as CurrencyCode;
}

export function parseBaseCurrencyCode(value: unknown): BaseCurrencyCode {
  if (value !== BASE_CURRENCY) {
    throw new InvalidDomainValueError(
      "baseCurrency",
      `V1 supports only ${BASE_CURRENCY}`,
    );
  }

  return BASE_CURRENCY;
}

export function parseDocumentId(value: unknown): DocumentId {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("/")
  ) {
    throw new InvalidDomainValueError(
      "id",
      "must be a non-empty document ID without path separators",
    );
  }

  return value as DocumentId;
}

export const PERSISTED_DECIMAL_PATTERN =
  /^(?:0|[1-9][0-9]{0,29})(?:\.[0-9]{0,17}[1-9])?$/;
const INPUT_DECIMAL_PATTERN = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;
export const DECIMAL_MAX_INTEGER_DIGITS = 30;
export const DECIMAL_MAX_FRACTION_DIGITS = 18;

export function parseDecimalString(value: unknown): DecimalString {
  if (typeof value !== "string" || !INPUT_DECIMAL_PATTERN.test(value)) {
    throw new InvalidDecimalError(
      "decimal",
      "must be a decimal string without exponent or ambiguous zeros",
    );
  }

  const isNegative = value.startsWith("-");
  const unsignedValue = isNegative ? value.slice(1) : value;
  const [integerPart, fractionPart] = unsignedValue.split(".");

  if (
    integerPart.length > DECIMAL_MAX_INTEGER_DIGITS ||
    (fractionPart?.length ?? 0) > DECIMAL_MAX_FRACTION_DIGITS
  ) {
    throw new InvalidDecimalError(
      "decimal",
      "must contain at most 30 integer and 18 fractional digits",
    );
  }

  const normalizedFraction = fractionPart?.replace(/0+$/, "");
  const normalizedUnsigned = normalizedFraction
    ? `${integerPart}.${normalizedFraction}`
    : integerPart;

  if (isNegative && normalizedUnsigned === "0") {
    throw new InvalidDecimalError("decimal", "negative zero is not canonical");
  }

  return `${isNegative ? "-" : ""}${normalizedUnsigned}` as DecimalString;
}

/** Parses only the exact grammar accepted by Firestore Rules. */
export function parsePersistedDecimalString(value: unknown): DecimalString {
  if (typeof value !== "string" || !PERSISTED_DECIMAL_PATTERN.test(value)) {
    throw new InvalidDecimalError(
      "decimal",
      "must use the canonical persisted decimal grammar",
    );
  }

  return value as DecimalString;
}

export function parseNonNegativeDecimalString(value: unknown): DecimalString {
  const decimal = parseDecimalString(value);

  if (decimal.startsWith("-")) {
    throw new InvalidDecimalError("decimal", "must not be negative");
  }

  return decimal;
}

export function parsePositiveDecimalString(value: unknown): PositiveDecimalString {
  const decimal = parseNonNegativeDecimalString(value);

  if (decimal === "0") {
    throw new InvalidDecimalError("decimal", "must be greater than zero");
  }

  return decimal as PositiveDecimalString;
}

export function parseMoneyMinor(value: unknown): MoneyMinor {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("money", "must be an object");
  }

  assertExactKeys(value, ["currency", "amountMinor"], "money");
  const currency = parseCurrencyCode(value.currency);

  if (
    typeof value.amountMinor !== "number" ||
    !Number.isSafeInteger(value.amountMinor) ||
    value.amountMinor < 0
  ) {
    throw new InvalidDomainValueError(
      "amountMinor",
      "must be a non-negative safe integer",
    );
  }

  return { currency, amountMinor: value.amountMinor };
}

export function createMoneyMinor(
  currency: string,
  amountMinor: number,
): MoneyMinor {
  return parseMoneyMinor({ currency: parseCurrencyCode(currency), amountMinor });
}

export function parsePositiveMoneyMinor(value: unknown): PositiveMoneyMinor {
  const money = parseMoneyMinor(value);

  if (money.amountMinor === 0) {
    throw new InvalidDomainValueError(
      "amountMinor",
      "must be greater than zero",
    );
  }

  return money as PositiveMoneyMinor;
}

export function parseUnitPrice(value: unknown): UnitPrice {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("unitPrice", "must be an object");
  }

  assertExactKeys(value, ["currency", "decimal"], "unitPrice");

  return {
    currency: parseCurrencyCode(value.currency),
    decimal: parsePositiveDecimalString(value.decimal),
  };
}

export function parseFee(value: unknown): Fee | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new InvalidDomainInputError("fee", "must be null or an object");
  }

  assertExactKeys(value, ["currency", "decimal"], "fee");

  let currency: CurrencyCode;
  try {
    currency = parseCurrencyCode(value.currency);
  } catch {
    throw new InvalidDomainValueError("fee", "must use an ISO 4217 currency");
  }

  let decimal: DecimalString;
  try {
    decimal = parseNonNegativeDecimalString(value.decimal);
  } catch {
    throw new InvalidDecimalError("fee", "must be a non-negative decimal");
  }

  return decimal === "0" ? null : { currency, decimal };
}

export function parsePersistedUnitPrice(value: unknown): UnitPrice {
  if (!isRecord(value)) {
    throw new InvalidDomainInputError("unitPrice", "must be an object");
  }

  assertExactKeys(value, ["currency", "decimal"], "unitPrice");
  const decimal = parsePersistedDecimalString(value.decimal);

  if (decimal === "0") {
    throw new InvalidDecimalError("decimal", "must be greater than zero");
  }

  return {
    currency: parseCurrencyCode(value.currency),
    decimal: decimal as PositiveDecimalString,
  };
}

export function parsePersistedFee(value: unknown): Fee | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new InvalidDomainInputError("fee", "must be null or an object");
  }

  assertExactKeys(value, ["currency", "decimal"], "fee");

  let currency: CurrencyCode;
  try {
    currency = parseCurrencyCode(value.currency);
  } catch {
    throw new InvalidDomainValueError("fee", "must use an ISO 4217 currency");
  }

  let decimal: DecimalString;
  try {
    decimal = parsePersistedDecimalString(value.decimal);
  } catch {
    throw new InvalidDecimalError("fee", "must use a canonical decimal");
  }

  return decimal === "0" ? null : { currency, decimal };
}

export function createUnitPrice(
  currency: string,
  decimal: string,
): UnitPrice {
  return parseUnitPrice({ currency: parseCurrencyCode(currency), decimal });
}

export type Quantity = PositiveDecimalString;

export function parseQuantity(value: unknown): Quantity {
  return parsePositiveDecimalString(value);
}

export function parsePersistedQuantity(value: unknown): Quantity {
  const decimal = parsePersistedDecimalString(value);

  if (decimal === "0") {
    throw new InvalidDecimalError("quantity", "must be greater than zero");
  }

  return decimal as Quantity;
}

export function parseBasisPoints(value: unknown): BasisPoints {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > 10_000
  ) {
    throw new InvalidDomainValueError(
      "basisPoints",
      "must be a safe integer between 0 and 10000",
    );
  }

  return value as BasisPoints;
}

export function parseCivilDate(value: unknown): CivilDate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InvalidDateError(
      "effectiveDate",
      "must use YYYY-MM-DD format",
    );
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new InvalidDateError("effectiveDate", "must be a real calendar date");
  }

  return value as CivilDate;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseInstant(value: unknown, field = "instant"): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new InvalidDomainValueError(field, "must be a valid Date instant");
  }

  return new Date(value.getTime());
}

export function parseTimestampParts(value: unknown, field = "createdAt"): TimestampParts {
  if (!isRecord(value)) {
    throw new InvalidDomainValueError(field, "must be a Timestamp value");
  }

  assertExactKeys(value, ["seconds", "nanoseconds"], field);

  if (
    typeof value.seconds !== "number" ||
    !Number.isSafeInteger(value.seconds) ||
    typeof value.nanoseconds !== "number" ||
    !Number.isInteger(value.nanoseconds) ||
    value.nanoseconds < 0 ||
    value.nanoseconds > 999_999_999
  ) {
    throw new InvalidDomainValueError(
      field,
      "must preserve integer seconds and nanoseconds between 0 and 999999999",
    );
  }

  return {
    seconds: value.seconds,
    nanoseconds: value.nanoseconds,
  } as TimestampParts;
}
