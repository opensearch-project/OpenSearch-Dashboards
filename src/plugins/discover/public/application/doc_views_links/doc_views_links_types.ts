/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiListGroupItemProps } from '@elastic/eui';
import { OpenSearchSearchHit } from '../doc_views/doc_views_types';
import { IndexPattern } from '../../../../data/public';

export interface DocViewLink extends EuiListGroupItemProps {
  href?: string;
  order: number;
  generateUrlFn?(renderProps: any): string;
}

export interface DocViewLinkRenderProps {
  columns?: string[];
  hit: OpenSearchSearchHit;
  indexPattern: IndexPattern;
}
