export type DecimalFormatOptions = Readonly<{
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}>;

type DecimalParts = Readonly<{
  negative: boolean;
  integer: string;
  fraction: string;
}>;

function decimalParts(value: string): DecimalParts {
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) {
    throw new Error("Expected a canonical decimal string");
  }

  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  return { negative, integer, fraction };
}

function groupInteger(integer: string): string {
  let grouped = "";
  for (let index = 0; index < integer.length; index += 1) {
    if (index > 0 && (integer.length - index) % 3 === 0) {
      grouped += ".";
    }
    grouped += integer[index];
  }
  return grouped;
}

function roundedParts(value: string, maximumFractionDigits: number): DecimalParts {
  const parts = decimalParts(value);
  if (maximumFractionDigits < 0 || !Number.isInteger(maximumFractionDigits)) {
    throw new Error("Fraction digits must be a non-negative integer");
  }

  if (parts.fraction.length <= maximumFractionDigits) return parts;

  const kept = parts.fraction.slice(0, maximumFractionDigits);
  const discarded = parts.fraction[maximumFractionDigits];
  const shouldRoundUp = discarded >= "5";
  if (!shouldRoundUp) return { ...parts, fraction: kept };

  const digits = `${parts.integer}${kept}`.split("");
  let index = digits.length - 1;
  while (index >= 0 && digits[index] === "9") {
    digits[index] = "0";
    index -= 1;
  }

  const integerLength = parts.integer.length;
  if (index < 0) {
    return {
      ...parts,
      integer: `1${"0".repeat(integerLength)}`,
      fraction: "",
    };
  }

  digits[index] = String.fromCharCode(digits[index].charCodeAt(0) + 1);
  const rounded = digits.join("");
  return {
    ...parts,
    integer: rounded.slice(0, integerLength),
    fraction: rounded.slice(integerLength),
  };
}

function formatParts(value: string, options: DecimalFormatOptions = {}): string {
  const maximumFractionDigits = Math.max(
    options.maximumFractionDigits ?? decimalParts(value).fraction.length,
    options.minimumFractionDigits ?? 0,
  );
  const parts = roundedParts(value, maximumFractionDigits);
  const minimumFractionDigits = options.minimumFractionDigits ?? 0;

  if (minimumFractionDigits > maximumFractionDigits) {
    throw new Error("Minimum fraction digits cannot exceed maximum fraction digits");
  }

  let fraction = parts.fraction.replace(/0+$/, "");
  while (fraction.length < minimumFractionDigits) fraction += "0";

  const sign = parts.negative ? "-" : "";
  return `${sign}${groupInteger(parts.integer)}${fraction ? `,${fraction}` : ""}`;
}

/** Formats a canonical decimal without converting it to a floating-point number. */
export function formatDecimal(
  value: string,
  options: DecimalFormatOptions = {},
): string {
  return formatParts(value, options);
}

const CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
  BRL: "R$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  USD: "US$",
};

/** Formats money in pt-BR with exact string rounding to centavos. */
export function formatMoney(value: string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = formatParts(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted.startsWith("-") ? "-" : ""}${symbol} ${formatted.replace(/^-/, "")}`;
}

function multiplyByOneHundred(value: string): string {
  const parts = decimalParts(value);
  const digits = `${parts.integer}${parts.fraction}`;
  const decimalIndex = parts.integer.length + 2;
  const paddedDigits = decimalIndex > digits.length
    ? `${digits}${"0".repeat(decimalIndex - digits.length)}`
    : digits;
  const rawInteger = paddedDigits.slice(0, decimalIndex);
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  const fraction = paddedDigits.slice(decimalIndex);
  return `${parts.negative ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
}

/** Formats an allocation ratio (1 = 100%) as a textual percentage. */
export function formatPercentage(value: string | null): string {
  if (value === null) return "Indisponível";
  return `${formatParts(multiplyByOneHundred(value), {
    maximumFractionDigits: 2,
  })}%`;
}

/** Formats canonical UTC quote instants consistently for the Brazilian UI. */
export function formatTimestamp(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Expected a valid timestamp");

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}
