/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A custom React hook that provides access to an element's geometry (dimensions and position)
 * through a ref and its bounding client rectangle. The geometry is updated when shouldRefresh changes.
 *
 * @template T - Type parameter extending HTMLElement for type-safe element references
 * @param shouldRefresh - Boolean flag that triggers geometry recalculation when true
 * @returns {Object} An object containing:
 *          - elRef: React ref object to attach to an element
 *          - rect: DOMRect | null - Element's current size and position, or null if element doesn't exist
 */
import { useState, useRef, useEffect } from 'react';

export function useElementGeometry<T extends HTMLElement>(shouldRefresh: boolean) {
  const elRef = useRef<T | null>(null);
  // Track the element's bounding rectangle state
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Update geometry when shouldRefresh is true and element exists
    if (shouldRefresh && elRef.current) {
      const boundingRect = elRef.current.getBoundingClientRect();
      setRect(boundingRect);
    }
  }, [shouldRefresh]);

  return {
    elRef,
    rect,
  };
}
