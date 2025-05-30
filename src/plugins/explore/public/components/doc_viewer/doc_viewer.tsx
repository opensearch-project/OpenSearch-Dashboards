/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './doc_viewer.scss';
import React, { useMemo } from 'react';
import { EuiTabbedContent } from '@elastic/eui';
import { DocViewerTab } from './doc_viewer_tab/doc_viewer_tab';
import { DocView, DocViewRenderProps, DocViewsRegistry } from '../../types/doc_views_types';

export interface IDocViewerProps {
  renderProps: DocViewRenderProps;
  docViewsRegistry: DocViewsRegistry;
}

/**
 * Rendering tabs with different views of 1 OpenSearch hit in Discover.
 * The tabs are provided by the `docs_views` registry.
 * A view can contain a React `component`, or any JS framework by using
 * a `render` function.
 */
export function DocViewer({ renderProps, docViewsRegistry }: IDocViewerProps) {
  const tabs = useMemo(() => {
    return docViewsRegistry
      .getDocViewsSorted(renderProps.hit)
      .map(({ title, render, component }: DocView, idx: number) => {
        return {
          id: `osd_doc_viewer_tab_${idx}`,
          name: title,
          content: (
            <DocViewerTab
              id={idx}
              title={title}
              component={component}
              renderProps={renderProps}
              render={render}
            />
          ),
        };
      });
  }, [docViewsRegistry, renderProps]);

  if (!tabs.length) {
    // There there's a minimum of 2 tabs active in Discover.
    // This condition takes care of unit tests with 0 tabs.
    return null;
  }

  return (
    <div className="exploreDocViewer" data-test-subj="osdDocViewer">
      <EuiTabbedContent tabs={tabs} size="s" />
    </div>
  );
}
