/**
 * Tiny id helper for workspace entities. Prefixes keep ids readable when
 * debugging state ("view-x", "stack-x", ...).
 */

let counter = 0;

export function createId(prefix: string): string {
 counter += 1;
 const random = Math.random().toString(36).slice(2, 8);
 return `${prefix}-${counter.toString(36)}${random}`;
}
