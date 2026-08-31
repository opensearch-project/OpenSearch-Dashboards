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

import { injectI18n } from '@osd/i18n/react';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import { Subscription } from 'rxjs';
import { Layout } from 'react-grid-layout';
import { ViewMode, EmbeddableChildPanel, EmbeddableStart } from '../../../../../embeddable/public';
import { GridData } from '../../../../common';
import { DashboardPanelState } from '../types';
import { withOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardContainerInput } from '../dashboard_container';
import { DashboardContainer, DashboardReactContextValue } from '../dashboard_container';
import { ResponsiveSizedGrid } from './dashboard_responsive_grid';

/**
 * The classic single react-grid-layout of dashboard panels (GridLayout mode).
 * The SectionLayout mode is rendered by SectionLayoutContainer, not here;
 * DashboardViewport picks the renderer based on `layout.type`.
 */
export interface DashboardGridProps extends ReactIntl.InjectedIntlProps {
  opensearchDashboards: DashboardReactContextValue;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
  container: DashboardContainer;
}

interface State {
  focusedPanelIndex?: string;
  isLayoutInvalid: boolean;
  layout?: GridData[];
  panels: { [key: string]: DashboardPanelState };
  viewMode: ViewMode;
  useMargins: boolean;
  expandedPanelId?: string;
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
        }
      });
  }

  public componentWillUnmount() {
    this.mounted = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public buildLayoutFromPanels = (): GridData[] => {
    return _.map(this.state.panels, (panel) => panel.gridData);
  };

  public onLayoutChange = (layout: PanelLayout[]) => {
    const { panels } = this.state;
    const updatedPanels: { [key: string]: DashboardPanelState } = layout.reduce(
      (updatedPanelsAcc, panelLayout) => {
        const existing = panels[panelLayout.i];
        if (!existing) return updatedPanelsAcc;
        updatedPanelsAcc[panelLayout.i] = {
          ...existing,
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

  public renderPanels() {
    const { focusedPanelIndex, panels, expandedPanelId } = this.state;

    // Part of our unofficial API - need to render in a consistent order for
    // plugins to work correctly.
    const panelsInOrder = Object.keys(panels).map((key) => panels[key] as DashboardPanelState);
    panelsInOrder.sort((panelA, panelB) => {
      if (panelA.gridData.y === panelB.gridData.y) {
        return panelA.gridData.x - panelB.gridData.x;
      }
      return panelA.gridData.y - panelB.gridData.y;
    });

    return _.map(panelsInOrder, (panel) => {
      const expandPanel =
        expandedPanelId !== undefined && expandedPanelId === panel.explicitInput.id;
      const hidePanel = expandedPanelId !== undefined && expandedPanelId !== panel.explicitInput.id;
      const classes = classNames({
        'dshDashboardGrid__item--expanded': expandPanel,
        'dshDashboardGrid__item--hidden': hidePanel,
      });

      const id = panel.explicitInput.id;
      return (
        <div
          style={{ zIndex: focusedPanelIndex === id ? 2 : 'auto' }}
          className={classes}
          key={id}
          data-test-subj="dashboardPanel"
          ref={(reactGridItem) => {
            this.gridItems[id] = reactGridItem;
          }}
        >
          <EmbeddableChildPanel
            key={panel.type}
            embeddableId={id}
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

    const { viewMode, useMargins } = this.state;
    const isViewMode = viewMode === ViewMode.VIEW;
    return (
      <ResponsiveSizedGrid
        isViewMode={isViewMode}
        layout={this.buildLayoutFromPanels()}
        onLayoutChange={this.onLayoutChange}
        maximizedPanelId={this.state.expandedPanelId!}
        useMargins={useMargins}
      >
        {this.renderPanels()}
      </ResponsiveSizedGrid>
    );
  }
}

export const DashboardGrid = injectI18n(withOpenSearchDashboards(DashboardGridUi));
