/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

/** Rows added each time the end of a sessions table scrolls into view. */
export const LAZY_LOAD_BATCH_SIZE = 50;

/**
 * Render a long table in batches: returns how many rows to render and a ref for a sentinel
 * element after the last row, which renders the next batch when it scrolls into view.
 * Back to the first batch whenever `resetKey` changes (new rows, new sort order).
 */
export const useLazyRows = (resetKey: unknown) => {
  const [renderedCount, setRenderedCount] = useState(LAZY_LOAD_BATCH_SIZE);
  useEffect(() => setRenderedCount(LAZY_LOAD_BATCH_SIZE), [resetKey]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (node && typeof IntersectionObserver !== 'undefined') {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) setRenderedCount((c) => c + LAZY_LOAD_BATCH_SIZE);
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, []);
  useEffect(() => () => observerRef.current?.disconnect(), []);

  return { renderedCount, sentinelRef };
};

/** Show the full text as a native tooltip only when the cell is truncated (like DataTable). */
export const setTitleIfTruncated = (text: string) => (e: React.MouseEvent<HTMLSpanElement>) => {
  const el = e.currentTarget;
  el.title = el.scrollWidth > el.clientWidth ? text : '';
};
