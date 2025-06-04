/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiResizableContainer,
  useIsWithinBreakpoints,
} from '@elastic/eui';
import classNames from 'classnames';
import { AppMountParameters } from 'opensearch-dashboards/public';
import React, { lazy, memo, Suspense, useRef } from 'react';
import { IDataPluginServices } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../components/constants';
import { Sidebar } from '../../components/sidebar';
import { DISCOVER_LOAD_EVENT, NEW_DISCOVER_LOAD_EVENT, trackUiMetric } from '../../ui_metric';
import './logs_page.scss';

export const LogsPage = ({ params }: { params: AppMountParameters }) => {
  const isMobile = useIsWithinBreakpoints(['xs', 's', 'm']);

  const opensearchDashboards = useOpenSearchDashboards<IDataPluginServices>();
  const { uiSettings } = opensearchDashboards.services;
  const isEnhancementsEnabled = uiSettings?.get(QUERY_ENHANCEMENT_ENABLED_SETTING);
  const showActionsInGroup = uiSettings?.get('home:useNewHomePage');

  const topLinkRef = useRef<HTMLDivElement>(null);
  const datasetSelectorRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  trackUiMetric(DISCOVER_LOAD_EVENT);
  if (isEnhancementsEnabled) {
    trackUiMetric(NEW_DISCOVER_LOAD_EVENT);
  }

  const DiscoverCanvas = lazy(
    () => import('../legacy/discover/application/view_components/canvas')
  );
  const DiscoverPanel = lazy(() => import('../legacy/discover/application/view_components/panel'));
  const DiscoverContext = lazy(
    () => import('../legacy/discover/application/view_components/context')
  );

  const MemoizedPanel = memo(DiscoverPanel);
  const MemoizedCanvas = memo(DiscoverCanvas);

  params.optionalRef = {
    topLinkRef,
    datasetSelectorRef,
    datePickerRef,
  };
  // Render the application DOM.
  return (
    <div className="mainPage">
      <div>WIP: this is logs flavor rendered by the new explore plugin</div>
      {isEnhancementsEnabled && (
        <EuiFlexGroup
          direction="row"
          className={showActionsInGroup ? '' : 'mainPage navBar'}
          gutterSize="none"
          alignItems="center"
          justifyContent="spaceBetween"
        >
          {!showActionsInGroup && (
            <EuiFlexItem grow={false}>
              <div ref={topLinkRef} />
            </EuiFlexItem>
          )}
          <EuiFlexItem grow={false}>
            <div ref={datePickerRef} />
          </EuiFlexItem>
        </EuiFlexGroup>
      )}

      <EuiPage
        className={classNames(
          'deLayout',
          isEnhancementsEnabled && !showActionsInGroup ? 'dsc--next' : undefined
        )}
        paddingSize="none"
        grow={false}
      >
        {/* TODO: improve fallback state */}
        <Suspense fallback={<div>Loading...</div>}>
          <DiscoverContext {...params}>
            <EuiResizableContainer direction={isMobile ? 'vertical' : 'horizontal'}>
              {(EuiResizablePanel, EuiResizableButton) => (
                <>
                  <EuiResizablePanel
                    initialSize={20}
                    minSize="260px"
                    mode={['collapsible', { position: 'top' }]}
                    paddingSize="none"
                  >
                    <Sidebar datasetSelectorRef={datasetSelectorRef}>
                      <MemoizedPanel {...params} />
                    </Sidebar>
                  </EuiResizablePanel>
                  <EuiResizableButton />

                  <EuiResizablePanel initialSize={80} minSize="65%" mode="main" paddingSize="none">
                    <EuiPageBody className="deLayout__canvas">
                      <MemoizedCanvas {...params} />
                    </EuiPageBody>
                  </EuiResizablePanel>
                </>
              )}
            </EuiResizableContainer>
          </DiscoverContext>
        </Suspense>
      </EuiPage>
    </div>
  );
};
