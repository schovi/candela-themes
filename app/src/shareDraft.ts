import type { Theme } from './themes';

export type SharedDraftMode = 'simple' | 'pro';

export interface SharedDraft {
  draft: Theme;
  mode: SharedDraftMode;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function encodeSharedDraft(sharedDraft: SharedDraft): string {
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(sharedDraft)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeSharedDraft(value: string): unknown {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
