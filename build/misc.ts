
type JsonPrim = string | boolean | number | null
export type JsonObject = { [key: string]: JsonValue }
export type JsonValue = JsonPrim | JsonObject | JsonArray
export type JsonArray = JsonValue[]

/**
 * Converts a number to a string with the given precision, removing trailing zeros.
 * @param value The number to convert
 * @param precision The number of digits after the decimal point
 * @returns The string representation of the number
 */
export function toFixedUnpadded(value: number, precision: number) {
    const fixed = value.toFixed(precision);
    return fixed.replace(/\.?0+$/, '');
}
