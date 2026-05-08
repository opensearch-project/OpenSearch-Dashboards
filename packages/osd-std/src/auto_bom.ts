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

const UTF8_TEXT_MIME_RE = /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i;

/**
 * Prepend a UTF-8 BOM (U+FEFF) to a Blob whose MIME type indicates
 * `charset=utf-8` text content (e.g. `text/csv;charset=utf-8`).
 *
 * This restores the behavior of the old `@elastic/filesaver` package,
 * which ran this check automatically.  The replacement `file-saver`
 * library defaults `autoBom` to `false` and only applies it in the
 * legacy IE code-path, so callers must handle it themselves.
 */
export function autoBom(blob: Blob): Blob {
  if (UTF8_TEXT_MIME_RE.test(blob.type)) {
    return new Blob(['\uFEFF', blob], { type: blob.type });
  }
  return blob;
}
