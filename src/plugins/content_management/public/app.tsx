/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { PageRender } from './components/page_render';
import { Page } from './services';
import { EmbeddableStart } from '../../embeddable/public';

export const renderPage = ({
  page,
  embeddable,
  savedObjectsClient,
}: {
  page: Page;
  embeddable: EmbeddableStart;
  savedObjectsClient: SavedObjectsClientContract;
}) => {
  return <PageRender page={page} embeddable={embeddable} savedObjectsClient={savedObjectsClient} />;
};
