// Roster persistence: URL query param (share links) + JSON export/import.
// No localStorage — state lives in the URL.

import { SPECS } from './specs.js';

// Compact wire format: { m: 10|25, r: [[spec, name], ...] }
export function encodeState(roster, mode) {
  const wire = { m: mode, r: roster.map((pl) => [pl.spec, pl.name || '']) };
  const json = JSON.stringify(wire);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeState(param) {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const wire = JSON.parse(new TextDecoder().decode(bytes));
    const mode = wire.m === 10 ? 10 : 25;
    const roster = (wire.r ?? [])
      .filter((entry) => Array.isArray(entry) && SPECS[entry[0]])
      .map(([spec, name], i) => ({ id: `${Date.now()}_${i}`, spec, name: String(name ?? '') }));
    return { roster, mode };
  } catch {
    return null;
  }
}

export function syncUrl(roster, mode) {
  const url = new URL(window.location.href);
  if (roster.length === 0) {
    url.searchParams.delete('r');
  } else {
    url.searchParams.set('r', encodeState(roster, mode));
  }
  history.replaceState(null, '', url);
}

export function loadFromUrl() {
  const param = new URLSearchParams(window.location.search).get('r');
  return param ? decodeState(param) : null;
}

// TBCRCO = this tool's native roster format.
export function buildTbcrcoJson(roster, mode) {
  const data = {
    format: 'tbcrco',
    mode,
    roster: roster.map((pl) => ({ spec: pl.spec, name: pl.name || undefined })),
  };
  return JSON.stringify(data, null, 2);
}

export function parseJsonImport(text) {
  const data = JSON.parse(text);
  const mode = data.mode === 10 ? 10 : 25;
  const roster = (data.roster ?? [])
    .filter((pl) => pl && SPECS[pl.spec])
    .map((pl, i) => ({ id: `${Date.now()}_${i}`, spec: pl.spec, name: String(pl.name ?? '') }));
  return { roster, mode };
}
