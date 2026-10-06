/**
 * Compute SHA-256 hash of an ArrayBuffer / Uint8Array in the browser using Web Crypto API.
 */
export async function calculateSHA256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
