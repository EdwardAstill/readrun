export function decodeSource(encoded: string): string {
	return new TextDecoder("utf-8", { fatal: true }).decode(
		Uint8Array.from(atob(encoded.trim()), (character) => character.charCodeAt(0)),
	);
}
