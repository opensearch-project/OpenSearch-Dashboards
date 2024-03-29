/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';
import { SurroundingDocsView } from './surrounding_docs_view';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { PLUGIN_ID } from '../../../../common';

export interface SurroundingDocsUrlParams {
  id: string;
  indexPatternId: string;
}

export function SurroundingDocsApp() {
  const {
    services: {
      chrome,
      indexPatterns,
      core: {
        application: { getUrlForApp },
      },
    },
  } = useOpenSearchDashboards<DiscoverServices>();
  const baseUrl = getUrlForApp(PLUGIN_ID);
  const { id, indexPatternId } = useParams<SurroundingDocsUrlParams>();
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function getIndexPatternById() {
      try {
        const ip = await indexPatterns.get(indexPatternId);
        setIndexPattern(ip);
      } catch (e) {
        setError(e);
      }
    }
    getIndexPatternById();
  }, [indexPatternId, indexPatterns]);

  useEffect(() => {
    chrome.setBreadcrumbs([
      ...getRootBreadcrumbs(),
      {
        text: i18n.translate('discover.context.breadcrumb', {
          defaultMessage: `Context of #{docId}`,
          values: {
            docId: id,
          },
        }),
      },
    ]);
  }, [id, chrome, baseUrl]);

  if (error) {
    return <div>Error fetching index pattern: {error.message}</div>;
  }

  if (!indexPattern) {
    return <div>Index pattern loading</div>;
  }
  return <SurroundingDocsView id={id} indexPattern={indexPattern} />;
}
