/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComponentType } from 'react';
import { SearchResponse } from 'elasticsearch';
import { IndexPattern } from 'src/plugins/data/public';

export type OpenSearchSearchHit<T = unknown> = SearchResponse<T>['hits']['hits'][number] & {
  isAnchor?: boolean;
};

export interface FieldMapping {
  filterable?: boolean;
  scripted?: boolean;
  rowCount?: number;
  type: string;
  name: string;
}

export type DocViewFilterFn = (
  mapping: FieldMapping | string | undefined,
  value: unknown,
  mode: '+' | '-'
) => void;

export interface DocViewRenderProps {
  columns?: string[];
  filter?: DocViewFilterFn;
  hit: OpenSearchSearchHit;
  indexPattern: IndexPattern;
  onAddColumn?: (columnName: string) => void;
  onRemoveColumn?: (columnName: string) => void;
}
export type DocViewerComponent = ComponentType<DocViewRenderProps>;
export type DocViewRenderFn = (
  domeNode: HTMLDivElement,
  renderProps: DocViewRenderProps
) => () => void;

export interface DocViewInput {
  component?: DocViewerComponent;
  order: number;
  render?: DocViewRenderFn;
  shouldShow?: (hit: OpenSearchSearchHit) => boolean;
  title: string;
}

export interface DocView extends DocViewInput {
  shouldShow: (hit: OpenSearchSearchHit) => boolean;
}

export type DocViewInputFn = () => DocViewInput;

export class DocViewsRegistry {
  private docViews: DocView[] = [];

  /**
   * Extends and adds the given doc view to the registry array
   */
  addDocView(docViewRaw: DocViewInput | DocViewInputFn) {
    const docView = typeof docViewRaw === 'function' ? docViewRaw() : docViewRaw;
    if (typeof docView.shouldShow !== 'function') {
      docView.shouldShow = () => true;
    }
    this.docViews.push(docView as DocView);
  }
  /**
   * Returns a sorted array of doc_views for rendering tabs
   */
  getDocViewsSorted(hit: OpenSearchSearchHit) {
    return this.docViews
      .filter((docView) => docView.shouldShow(hit))
      .sort((a, b) => (Number(a.order) > Number(b.order) ? 1 : -1));
  }
}
