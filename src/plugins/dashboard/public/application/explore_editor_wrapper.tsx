/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './app.scss';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Wrapper component that extracts exploreId and containerId from route
export const ExploreEditorWrapper = ({ EditorComponent, services }: any) => {
  const location = useLocation();

  const { dashboardId, dashboardName } = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return {
      dashboardId: searchParams.get('containerId'),
      dashboardName: searchParams.get('containerName'),
    };
  }, [location.search]);

  useEffect(() => {
    const breadcrumbs = [
      {
        text: 'Dashboards',
        href: '#/',
      },
    ];

    // Add dashboard breadcrumb if available
    if (dashboardId && dashboardName) {
      breadcrumbs.push({
        text: dashboardName,
        href: `#/view/${dashboardId}`,
      });
    }

    // placeholder
    breadcrumbs.push({
      text: 'Edit',
      href: '',
    });

    services.chrome.setBreadcrumbs(breadcrumbs);
  }, [services.chrome, dashboardName, dashboardId]);

  const exploreId = useMemo(() => {
    const match = location.pathname.match(/^\/view_explore\/([^\/?\s]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  if (!EditorComponent) {
    return null;
  }

  return (
    <EditorComponent
      containerId={dashboardId}
      services={services}
      exploreId={exploreId}
      history={services.history}
      setHeaderActionMenu={services.setHeaderActionMenu}
    />
  );
};
