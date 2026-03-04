/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, RefObject } from 'react';

/**
 * A custom React hook that handles clicks outside of a specified element.
 * Useful for closing menus, popups, or modals when a user clicks outside of them.
 *
 * @param ref - React ref object pointing to the element to monitor
 * @param handler - Callback function to execute when a click outside element occurs
 * @returns void
 */
export const useOnClickOutside = <T extends HTMLElement>(
  ref: RefObject<T>,
  handler: () => void
): void => {
  useEffect(() => {
    // Handler to call when a click occurs outside the referenced element
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the ref exists and click target is outside the element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    // Bind the event listener
    document.addEventListener('click', handleClickOutside);

    // Clean up the event listener on component unmount
    return () => document.removeEventListener('click', handleClickOutside);
  }, [ref, handler]);
};
