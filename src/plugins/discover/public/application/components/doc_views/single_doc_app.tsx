/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { Doc } from '../doc/doc';

export interface SingleDocUrlParams {
  index: string;
  indexPatternId: string;
}

function useQueryString() {
  return new URLSearchParams(useLocation().search);
}

export function SingleDocApp() {
  const {
    services: { chrome, timefilter, indexPatterns },
  } = useOpenSearchDashboards<DiscoverServices>();

  const { index, indexPatternId } = useParams<SingleDocUrlParams>();
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  // get query string
  const query = useQueryString();
  // get doc id from query string
  const docId = query.get('id') || '';

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
        text: i18n.translate('discover.single.breadcrumb', {
          defaultMessage: '{index}#{docId}',
          values: {
            index,
            docId,
          },
        }),
      },
    ]);
  }, [chrome, index, docId]);

  useEffect(() => {
    timefilter.disableAutoRefreshSelector();
    timefilter.disableTimeRangeSelector();
  });

  if (error) {
    return <div>Error fetching index pattern: {error.message}</div>;
  }

  if (!indexPattern) {
    return <div>Index pattern loading</div>;
  }

  return (
    <div className="single doc view">
      <Doc
        id={docId}
        index={index}
        indexPatternId={indexPatternId}
        indexPatternService={indexPatterns}
      />
    </div>
  );
}
