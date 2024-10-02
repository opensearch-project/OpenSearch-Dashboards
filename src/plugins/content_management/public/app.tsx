/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { PageRender } from './components/page_render';
import { Page } from './services';
import { EmbeddableStart } from '../../embeddable/public';
import { RenderOptions } from './types';

export const renderPage = ({
  page,
  embeddable,
  savedObjectsClient,
  renderOptions,
}: {
  page: Page;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
  renderOptions?: RenderOptions;
}) => {
  return (
    <PageRender
      page={page}
      embeddable={embeddable}
      savedObjectsClient={savedObjectsClient}
      renderOptions={renderOptions}
    />
  );
};
