/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: no-preference)';
const isRenderingOnServer = typeof window === 'undefined';

const getInitialState = () => {
  // For our initial server render, we won't know if the user
  // prefers reduced motion, but it doesn't matter. This value
  // will be overwritten on the client, before any animations
  // occur.
  return isRenderingOnServer ? true : !window.matchMedia(QUERY).matches;
};

export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialState);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(QUERY);
    const listener = (event) => {
      setPrefersReducedMotion(!event.matches);
    };
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    }

    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, []);

  return prefersReducedMotion;
}
