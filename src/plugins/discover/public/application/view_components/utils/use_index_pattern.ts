/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { IndexPattern } from '../../../../../data/public';
import { useSelector } from '../../utils/state_management';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';

export const useIndexPattern = () => {
  const indexPatternId = useSelector((state) => state.metadata.indexPattern);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);

  const {
    services: { data, toastNotifications },
  } = useOpenSearchDashboards<DiscoverViewServices>();

  useEffect(() => {
    if (!indexPatternId) return;
    const indexPatternMissingWarning = i18n.translate(
      'discover.valueIsNotConfiguredIndexPatternIDWarningTitle',
      {
        defaultMessage: '{id} is not a configured index pattern ID',
        values: {
          id: `"${indexPatternId}"`,
        },
      }
    );

    data.indexPatterns
      .get(indexPatternId)
      .then(setIndexPattern)
      .catch(() => {
        toastNotifications.addDanger({
          title: indexPatternMissingWarning,
        });
      });
  }, [indexPatternId, data.indexPatterns, toastNotifications]);

  return indexPattern;
};
