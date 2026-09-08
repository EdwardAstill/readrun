/**
 * Tiny record utilities shared by the model layer. Pure, immutable.
 */

/** Copy a record without the given key. */
export function withoutKey<T extends Record<string, unknown>>(
 record: T,
 key: string,
): T {
 const copy = { ...record } as T;
 delete (copy as Record<string, unknown>)[key];
 return copy;
}
