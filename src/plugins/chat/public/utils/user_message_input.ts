/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { InputContent } from '../../common/types';

export interface ResolvedImage {
  base64?: string;
  url?: string;
  mimeType: string;
}

/**
 * Normalize an image content block, whatever shape it arrived in.
 *
 * Two shapes are in play, so every consumer that renders or exports an image has to accept both
 * or the image silently disappears:
 * - `{type: 'image', source: {type: 'data' | 'url', value, mimeType}}` — the current shape.
 * - `{type: 'binary', mimeType, data | url}` — the legacy flat shape, still produced by the local
 *   screenshot path and still present in saved conversations.
 *
 * Returns undefined when the block is not an image or carries no payload.
 */
export const resolveImageContent = (block: unknown): ResolvedImage | undefined => {
  if (typeof block !== 'object' || block === null) return undefined;
  const candidate = block as {
    type?: string;
    mimeType?: string;
    data?: string;
    url?: string;
    source?: { type?: string; value?: string; mimeType?: string };
  };

  if (candidate.type === 'image' && candidate.source?.value) {
    const { type, value, mimeType } = candidate.source;
    const resolvedMimeType = mimeType || 'image/jpeg';
    return type === 'url'
      ? { url: value, mimeType: resolvedMimeType }
      : { base64: value, mimeType: resolvedMimeType };
  }

  if (candidate.type === 'binary') {
    const resolvedMimeType = candidate.mimeType || 'image/jpeg';
    if (candidate.data) return { base64: candidate.data, mimeType: resolvedMimeType };
    if (candidate.url) return { url: candidate.url, mimeType: resolvedMimeType };
  }

  return undefined;
};

//  Resolve an image content block to a value usable as an `<img src>`
export const getImageSrc = (block: unknown): string | undefined => {
  const image = resolveImageContent(block);
  if (!image) return undefined;
  return image.url ?? `data:${image.mimeType};base64,${image.base64}`;
};

export const flattenContentText = (content: string | InputContent[]): string =>
  Array.isArray(content)
    ? content
        .filter((block) => 'text' in block)
        .map((block) => block.text)
        .join('\n')
    : content;
