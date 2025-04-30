/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import 'react-resizable/css/styles.css';

// @ts-ignore
import sizeMe from 'react-sizeme';

import { injectI18n } from '@osd/i18n/react';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import { Subscription } from 'rxjs';
import ReactGridLayout, { Layout, ReactGridLayoutProps } from 'react-grid-layout';
import type { SavedObjectsClientContract } from 'src/core/public';
import { HttpStart, NotificationsStart } from 'src/core/public';
import { ViewMode, EmbeddableChildPanel, EmbeddableStart } from '../../../../../embeddable/public';
import { GridData } from '../../../../common';
import { DASHBOARD_GRID_COLUMN_COUNT, DASHBOARD_GRID_HEIGHT } from '../dashboard_constants';
import { DashboardPanelState } from '../types';
import { withOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardContainerInput } from '../dashboard_container';
import { DashboardContainer, DashboardReactContextValue } from '../dashboard_container';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
import { DirectQueryRequest } from '../../../../framework/types';
import {
  extractIndexInfoFromDashboard,
  generateRefreshQuery,
  EMR_STATES,
} from '../../utils/direct_query_sync/direct_query_sync';
import { DashboardDirectQuerySync } from './dashboard_direct_query_sync';
import { isDirectQuerySyncEnabledByUrl } from '../../utils/direct_query_sync/direct_query_sync_url_flag';

let lastValidGridSize = 0;

/**
 * This is a fix for a bug that stopped the browser window from automatically scrolling down when panels were made
 * taller than the current grid.
 * see https://github.com/elastic/kibana/issues/14710.
 */
function ensureWindowScrollsToBottom(event: { clientY: number; pageY: number }) {
  // The buffer is to handle the case where the browser is maximized and it's impossible for the mouse to move below
  // the screen, out of the window.  see https://github.com/elastic/kibana/issues/14737
  const WINDOW_BUFFER = 10;
  if (event.clientY > window.innerHeight - WINDOW_BUFFER) {
    window.scrollTo(0, event.pageY + WINDOW_BUFFER - window.innerHeight);
  }
}

function ResponsiveGrid({
  size,
  isViewMode,
  layout,
  onLayoutChange,
  children,
  maximizedPanelId,
  useMargins,
}: {
  size: { width: number };
  isViewMode: boolean;
  layout: Layout[];
  onLayoutChange: ReactGridLayoutProps['onLayoutChange'];
  children: JSX.Element[];
  maximizedPanelId?: string;
  useMargins: boolean;
}) {
  // This is to prevent a bug where view mode changes when the panel is expanded.  View mode changes will trigger
  // the grid to re-render, but when a panel is expanded, the size will be 0. Minimizing the panel won't cause the
  // grid to re-render so it'll show a grid with a width of 0.
  lastValidGridSize = size.width > 0 ? size.width : lastValidGridSize;
  const classes = classNames({
    'dshLayout--viewing': isViewMode,
    'dshLayout--editing': !isViewMode,
    'dshLayout-isMaximizedPanel': maximizedPanelId !== undefined,
    'dshLayout-withoutMargins': !useMargins,
  });

  const MARGINS = useMargins ? 8 : 0;
  // We can't take advantage of isDraggable or isResizable due to performance concerns:
  // https://github.com/STRML/react-grid-layout/issues/240
  return (
    <ReactGridLayout
      width={lastValidGridSize}
      className={classes}
      isDraggable={true}
      // There is a bug with d3 + firefox + elements using transforms.
      // See https://github.com/elastic/kibana/issues/16870 for more context.
      isResizable={true}
      useCSSTransforms={false}
      margin={[MARGINS, MARGINS]}
      cols={DASHBOARD_GRID_COLUMN_COUNT}
      rowHeight={DASHBOARD_GRID_HEIGHT}
      // Pass the named classes of what should get the dragging handle
      // (.doesnt-exist literally doesnt exist)
      draggableHandle={isViewMode ? '.doesnt-exist' : '.embPanel__dragger'}
      layout={layout}
      onLayoutChange={onLayoutChange}
      onResize={({}, {}, {}, {}, event) => ensureWindowScrollsToBottom(event)}
    >
      {children}
    </ReactGridLayout>
  );
}

// Using sizeMe sets up the grid to be re-rendered automatically not only when the window size changes, but also
// when the container size changes, so it works for Full Screen mode switches.
const config = { monitorWidth: true };
const ResponsiveSizedGrid = sizeMe(config)(ResponsiveGrid);

export interface DashboardGridProps extends ReactIntl.InjectedIntlProps {
  opensearchDashboards: DashboardReactContextValue;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
  container: DashboardContainer;
  savedObjectsClient: SavedObjectsClientContract;
  http: HttpStart;
  notifications: NotificationsStart;
  startLoading: (payload: DirectQueryRequest) => void;
  loadStatus: DirectQueryLoadingStatus;
  pollingResult: any;
  isDirectQuerySyncEnabled: boolean;
  setMdsId?: (mdsId?: string) => void;
}

interface State {
  focusedPanelIndex?: string;
  isLayoutInvalid: boolean;
  layout?: GridData[];
  panels: { [key: string]: DashboardPanelState };
  viewMode: ViewMode;
  useMargins: boolean;
  expandedPanelId?: string;
  panelMetadata: Array<{ panelId: string; savedObjectId: string; type: string }>;
  extractedProps: { lastRefreshTime?: number; refreshInterval?: number } | null;
  prevStatus?: string;
}

interface PanelLayout extends Layout {
  i: string;
}

class DashboardGridUi extends React.Component<DashboardGridProps, State> {
  private subscription?: Subscription;
  private mounted: boolean = false;
  // A mapping of panelIndexes to grid items so we can set the zIndex appropriately on the last focused
  // item.
  private gridItems = {} as { [key: string]: HTMLDivElement | null };

  private extractedDatasource?: string;
  private extractedDatabase?: string;
  private extractedIndex?: string;

  constructor(props: DashboardGridProps) {
    super(props);

    this.state = {
      layout: [],
      isLayoutInvalid: false,
      focusedPanelIndex: undefined,
      panels: this.props.container.getInput().panels,
      viewMode: this.props.container.getInput().viewMode,
      useMargins: this.props.container.getInput().useMargins,
      expandedPanelId: this.props.container.getInput().expandedPanelId,
      panelMetadata: [],
      extractedProps: null,
    };
  }

  public componentDidMount() {
    this.mounted = true;
    let isLayoutInvalid = false;
    let layout;
    try {
      layout = this.buildLayoutFromPanels();
    } catch (error: any) {
      console.error(error); // eslint-disable-line no-console

      isLayoutInvalid = true;
      this.props.opensearchDashboards.notifications.toasts.danger({
        title: this.props.intl.formatMessage({
          id: 'dashboard.dashboardGrid.toast.unableToLoadDashboardDangerMessage',
          defaultMessage: 'Unable to load dashboard.',
        }),
        body: error.message,
        toastLifeTimeMs: 5000,
      });
    }
    this.setState({
      layout,
      isLayoutInvalid,
    });

    this.subscription = this.props.container
      .getInput$()
      .subscribe((input: DashboardContainerInput) => {
        if (this.mounted) {
          this.setState({
            panels: input.panels,
            viewMode: input.viewMode,
            useMargins: input.useMargins,
            expandedPanelId: input.expandedPanelId,
          });
          this.collectAllPanelMetadata();
        }
      });

    this.collectAllPanelMetadata();
  }

  public componentWillUnmount() {
    this.mounted = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public buildLayoutFromPanels = (): GridData[] => {
    return _.map(this.state.panels, (panel) => {
      return panel.gridData;
    });
  };

  public onLayoutChange = (layout: PanelLayout[]) => {
    const panels = this.state.panels;
    const updatedPanels: { [key: string]: DashboardPanelState } = layout.reduce(
      (updatedPanelsAcc, panelLayout) => {
        updatedPanelsAcc[panelLayout.i] = {
          ...panels[panelLayout.i],
          gridData: _.pick(panelLayout, ['x', 'y', 'w', 'h', 'i']),
        };
        return updatedPanelsAcc;
      },
      {} as { [key: string]: DashboardPanelState }
    );
    this.onPanelsUpdated(updatedPanels);
  };

  public onPanelsUpdated = (panels: { [key: string]: DashboardPanelState }) => {
    this.props.container.updateInput({
      panels,
    });
  };

  public onPanelFocused = (focusedPanelIndex: string): void => {
    this.setState({ focusedPanelIndex });
  };

  public onPanelBlurred = (blurredPanelIndex: string): void => {
    if (this.state.focusedPanelIndex === blurredPanelIndex) {
      this.setState({ focusedPanelIndex: undefined });
    }
  };

  /**
   * Collects metadata (panelId, savedObjectId, type) for all panels in the dashboard.
   * Runs on mount and when the container input (panels) changes.
   */
  private async collectAllPanelMetadata() {
    const indexInfo = await extractIndexInfoFromDashboard(
      this.state.panels,
      this.props.savedObjectsClient,
      this.props.http
    );
    console.log('Extracted metadata:', indexInfo?.mapping);

    if (indexInfo) {
      this.extractedDatasource = indexInfo.parts.datasource;
      this.extractedDatabase = indexInfo.parts.database;
      this.extractedIndex = indexInfo.parts.index;
      this.setState({ extractedProps: indexInfo.mapping });
      console.log('Resolved index info:', indexInfo);
      if (this.props.setMdsId) {
        this.props.setMdsId(indexInfo.mdsId);
      }
    } else {
      console.warn(
        'Dashboard does not qualify for synchronization: inconsistent or unsupported visualization sources.'
      );
      this.setState({ extractedProps: null });
      if (this.props.setMdsId) {
        this.props.setMdsId(undefined);
      }
    }
  }

  synchronizeNow = () => {
    const { extractedDatasource, extractedDatabase, extractedIndex } = this;
    if (
      !extractedDatasource ||
      !extractedDatabase ||
      !extractedIndex ||
      extractedDatasource === 'unknown' ||
      extractedDatabase === 'unknown' ||
      extractedIndex === 'unknown'
    ) {
      console.error('Datasource, database, or index not properly set. Cannot run REFRESH command.');
      return;
    }

    const query = generateRefreshQuery({
      datasource: extractedDatasource,
      database: extractedDatabase,
      index: extractedIndex,
    });

    this.props.startLoading({
      query,
      lang: 'sql',
      datasource: extractedDatasource,
    });
  };

  public renderPanels() {
    const { focusedPanelIndex, panels, expandedPanelId } = this.state;

    // Part of our unofficial API - need to render in a consistent order for plugins.
    const panelsInOrder = Object.keys(panels).map(
      (key: string) => panels[key] as DashboardPanelState
    );
    panelsInOrder.sort((panelA, panelB) => {
      if (panelA.gridData.y === panelB.gridData.y) {
        return panelA.gridData.x - panelB.gridData.x;
      } else {
        return panelA.gridData.y - panelB.gridData.y;
      }
    });

    return _.map(panelsInOrder, (panel) => {
      const expandPanel =
        expandedPanelId !== undefined && expandedPanelId === panel.explicitInput.id;
      const hidePanel = expandedPanelId !== undefined && expandedPanelId !== panel.explicitInput.id;
      const classes = classNames({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'dshDashboardGrid__item--expanded': expandPanel,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'dshDashboardGrid__item--hidden': hidePanel,
      });
      return (
        <div
          style={{ zIndex: focusedPanelIndex === panel.explicitInput.id ? 2 : 'auto' }}
          className={classes}
          key={panel.explicitInput.id}
          data-test-subj="dashboardPanel"
          ref={(reactGridItem) => {
            this.gridItems[panel.explicitInput.id] = reactGridItem;
          }}
        >
          <EmbeddableChildPanel
            key={panel.type}
            embeddableId={panel.explicitInput.id}
            container={this.props.container}
            PanelComponent={this.props.PanelComponent}
          />
        </div>
      );
    });
  }

  public render() {
    if (this.state.isLayoutInvalid) {
      return null;
    }

    const { viewMode } = this.state;
    const isViewMode = viewMode === ViewMode.VIEW;
    const state = EMR_STATES.get(this.props.loadStatus as string)!;

    if (state?.terminal && this.props.loadStatus !== 'fresh') {
      window.location.reload();
    }

    return (
      <div style={{ position: 'relative', padding: '16px' }}>
        {(() => {
          const urlOverride = isDirectQuerySyncEnabledByUrl();
          const featureFlagEnabled =
            urlOverride !== undefined ? urlOverride : this.props.isDirectQuerySyncEnabled;

          const metadataAvailable = this.state.extractedProps !== null;

          const shouldRenderSyncUI = featureFlagEnabled && metadataAvailable;

          return shouldRenderSyncUI ? (
            <DashboardDirectQuerySync
              loadStatus={this.props.loadStatus}
              lastRefreshTime={this.state.extractedProps?.lastRefreshTime}
              refreshInterval={this.state.extractedProps?.refreshInterval}
              onSynchronize={this.synchronizeNow}
            />
          ) : null;
        })()}

        <ResponsiveSizedGrid
          isViewMode={isViewMode}
          layout={this.buildLayoutFromPanels()}
          onLayoutChange={this.onLayoutChange}
          maximizedPanelId={this.state.expandedPanelId!}
          useMargins={this.state.useMargins}
        >
          {this.renderPanels()}
        </ResponsiveSizedGrid>
      </div>
    );
  }
}

export const DashboardGrid = injectI18n(withOpenSearchDashboards(DashboardGridUi));
