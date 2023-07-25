/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { matchPath } from 'react-router-dom';

interface RedirectState {
  indexPattern: string;
  id?: string;
  appState?: any;
  index?: string;
  docView: string;
}

/**
 * Returns the redirect state for a given path, based on a list of path patterns.
 * @param path The path to match against the patterns.
 * @param pathPatterns An array of path patterns to match against the path.
 * @returns The redirect state if a match is found, otherwise null.
 */
export function getRedirectState(path: string): RedirectState | null {
  const pathPatterns = [
    {
      pattern: '#/context/:indexPattern/:id\\?:appState',
      extraState: { docView: 'context' },
    },
    { pattern: '#/doc/:indexPattern/:index', extraState: { docView: 'doc' } },
  ];

  for (let i = 0; i < pathPatterns.length; i++) {
    const redirectState = matchPath<RedirectState>(path, {
      path: pathPatterns[i].pattern,
      exact: false,
    })?.params;

    if (redirectState) {
      return { ...redirectState, ...pathPatterns[i].extraState };
    }
  }

  return null;
}
