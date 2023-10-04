/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DocViewerLinks } from '../components/doc_viewer_links/doc_viewer_links';

export function createDocViewerLinksDirective(reactDirective: any) {
  return reactDirective(
    (props: any) => {
      return <DocViewerLinks {...props} />;
    },
    [
      'hit',
      ['indexPattern', { watchDepth: 'reference' }],
      ['columns', { watchDepth: 'collection' }],
    ],
    {
      restrict: 'E',
      scope: {
        hit: '=',
        indexPattern: '=',
        columns: '=?',
      },
    }
  );
}
