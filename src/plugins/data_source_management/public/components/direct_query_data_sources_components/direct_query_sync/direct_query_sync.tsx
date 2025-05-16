/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiText } from '@elastic/eui';
import { HttpStart } from 'opensearch-dashboards/public';

import './direct_query_sync.scss';

interface Props {
  http: HttpStart;
  dashboardId: string;
  removeBanner: () => void;
}

interface SavedObject {
  id: string;
  type: string;
  attributes: any;
  references: Array<{ name: string; type: string; id: string }>;
}

interface ExportDashboardsResponse {
  version: string;
  objects: SavedObject[];
}

export const DashboardDirectQuerySync: React.FC<Props> = ({ http, dashboardId, removeBanner }) => {
  const [isIndexPatternConsistent, setIsIndexPatternConsistent] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch index pattern info using exportDashboards API
  useEffect(() => {
    const fetchIndexPatterns = async () => {
      try {
        // Call the exportDashboards API
        const response = await http.get<ExportDashboardsResponse>(
          '/api/opensearch-dashboards/dashboards/export',
          { query: { dashboard: dashboardId } }
        );

        // Find the dashboard object
        const dashboardObj = response.objects.find(
          (obj) => obj.type === 'dashboard' && obj.id === dashboardId
        );
        if (!dashboardObj) {
          throw new Error('Dashboard object not found in response');
        }

        // Get panel references (visualizations, lenses)
        const panelRefs = dashboardObj.references.filter((ref) =>
          ['visualization', 'lens'].includes(ref.type)
        );

        // Collect index pattern IDs
        const indexPatternIds: string[] = [];
        for (const panelRef of panelRefs) {
          const panelObj = response.objects.find(
            (obj) => obj.id === panelRef.id && obj.type === panelRef.type
          );
          if (!panelObj) continue;

          const indexPatternRef = panelObj.references.find((ref) => ref.type === 'index-pattern');
          if (indexPatternRef) {
            indexPatternIds.push(indexPatternRef.id);
          }
        }

        // Compare index pattern IDs for consistency
        const uniqueIndexPatternIds = Array.from(new Set(indexPatternIds));
        const isConsistent = uniqueIndexPatternIds.length <= 1;

        // Log the comparison result
        console.log('Index Pattern Comparison:', {
          indexPatternIds,
          uniqueIndexPatternIds,
          isConsistent,
        });

        setIsIndexPatternConsistent(isConsistent);
        setError(null);

        // Remove the banner if index patterns are not consistent
        if (!isConsistent) {
          removeBanner();
        }
      } catch (err) {
        console.error('Error fetching dashboard export:', err);
        setError('Failed to fetch dashboard information');
        setIsIndexPatternConsistent(false);
        removeBanner();
      }
    };

    fetchIndexPatterns();
  }, [dashboardId, http, removeBanner]);

  // Show error if fetching failed
  if (error) {
    return (
      <EuiText size="m" className="direct-query-sync" color="danger">
        {error}
      </EuiText>
    );
  }

  // Don't render until we know if the index patterns are consistent
  if (isIndexPatternConsistent === null) {
    return null;
  }

  // Render the component only if index patterns are consistent
  return (
    <EuiText size="m" className="direct-query-sync">
      Data scheduled to sync every x mins. Last sync: 3 minutes ago. Synchronize Now
    </EuiText>
  );
};
