/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { autoBom } from './auto_bom';

function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

// UTF-8 BOM is the byte sequence EF BB BF
const UTF8_BOM = [0xef, 0xbb, 0xbf];

describe('autoBom', () => {
  it('prepends BOM for text/csv;charset=utf-8', async () => {
    const blob = new Blob(['a,b,c'], { type: 'text/csv;charset=utf-8' });
    const result = autoBom(blob);
    expect(result).not.toBe(blob);
    const bytes = await blobToBytes(result);
    expect(Array.from(bytes.slice(0, 3))).toEqual(UTF8_BOM);
  });

  it('prepends BOM for text/plain;charset=utf-8', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain;charset=utf-8' });
    const result = autoBom(blob);
    expect(result).not.toBe(blob);
    const bytes = await blobToBytes(result);
    expect(Array.from(bytes.slice(0, 3))).toEqual(UTF8_BOM);
  });

  it('does not prepend BOM when charset is not utf-8', async () => {
    const blob = new Blob(['a,b,c'], { type: 'text/csv' });
    const result = autoBom(blob);
    expect(result).toBe(blob);
  });

  it('does not prepend BOM for application/json', async () => {
    const blob = new Blob(['{}'], { type: 'application/json' });
    const result = autoBom(blob);
    expect(result).toBe(blob);
  });

  it('does not prepend BOM for application/octet-stream', async () => {
    const blob = new Blob(['binary'], { type: 'application/octet-stream' });
    const result = autoBom(blob);
    expect(result).toBe(blob);
  });

  it('preserves the original MIME type', async () => {
    const blob = new Blob(['data'], { type: 'text/csv;charset=utf-8' });
    const result = autoBom(blob);
    expect(result.type).toBe('text/csv;charset=utf-8');
  });
});
