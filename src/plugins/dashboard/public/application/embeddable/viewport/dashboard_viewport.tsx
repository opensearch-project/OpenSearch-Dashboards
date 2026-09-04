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

import React from 'react';
import { Subscription } from 'rxjs';
import { Logos } from 'opensearch-dashboards/public';
import { PanelState, EmbeddableStart } from '../../../../../embeddable/public';
import { DashboardContainer, DashboardReactContextValue } from '../dashboard_container';
import { DashboardGrid, SectionLayoutContainer } from '../grid';
import { context } from '../../../../../opensearch_dashboards_react/public';
import { DashboardLayout } from '../../../../common';

export interface DashboardViewportProps {
  container: DashboardContainer;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
  renderEmpty?: () => React.ReactNode;
  logos: Logos;
}

interface State {
  isFullScreenMode: boolean;
  useMargins: boolean;
  title: string;
  description?: string;
  panels: { [key: string]: PanelState };
  isEmbeddedExternally?: boolean;
  isEmptyState?: boolean;
  layout?: DashboardLayout;
}

export class DashboardViewport extends React.Component<DashboardViewportProps, State> {
  static contextType = context;

  // @ts-expect-error TS2612 TODO(ts-error): fixme
  public readonly context!: DashboardReactContextValue;
  private subscription?: Subscription;
  private mounted: boolean = false;
  constructor(props: DashboardViewportProps) {
    super(props);
    const {
      isFullScreenMode,
      panels,
      useMargins,
      title,
      isEmbeddedExternally,
      isEmptyState,
      layout,
    } = this.props.container.getInput();

    this.state = {
      isFullScreenMode,
      panels,
      useMargins,
      title,
      isEmbeddedExternally,
      isEmptyState,
      layout,
    };
  }

  public componentDidMount() {
    this.mounted = true;
    this.subscription = this.props.container.getInput$().subscribe(() => {
      const {
        isFullScreenMode,
        useMargins,
        title,
        description,
        isEmbeddedExternally,
        isEmptyState,
        layout,
      } = this.props.container.getInput();
      if (this.mounted) {
        this.setState({
          isFullScreenMode,
          description,
          useMargins,
          title,
          isEmbeddedExternally,
          isEmptyState,
          layout,
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

  public onExitFullScreenMode = () => {
    this.props.container.updateInput({
      isFullScreenMode: false,
    });
  };

  private renderEmptyScreen() {
    const { renderEmpty } = this.props;
    const { isEmbeddedExternally, isFullScreenMode } = this.state;
    return (
      <div className="dshDashboardEmptyScreen">
        {isFullScreenMode && (
          <this.context.services.ExitFullScreenButton
            onExitFullScreenMode={this.onExitFullScreenMode}
            toggleChrome={!isEmbeddedExternally}
            logos={this.props.logos}
          />
        )}
        {renderEmpty && renderEmpty()}
      </div>
    );
  }

  private renderContainerScreen(isSectionLayout: boolean) {
    const { container, PanelComponent } = this.props;
    const { isEmbeddedExternally, isFullScreenMode, panels, title, description, useMargins } =
      this.state;
    // A SectionLayout with at least one section renders the vertical section
    // stack; undefined / GridLayout / an empty SectionLayout (auto-revert) fall
    // back to the classic single-grid renderer.
    return (
      <div
        data-shared-items-count={Object.values(panels).length}
        data-shared-items-container
        data-title={title}
        data-description={description}
        className={useMargins ? 'dshDashboardViewport-withMargins' : 'dshDashboardViewport'}
      >
        {isFullScreenMode && (
          <this.context.services.ExitFullScreenButton
            onExitFullScreenMode={this.onExitFullScreenMode}
            toggleChrome={!isEmbeddedExternally}
            logos={this.props.logos}
          />
        )}
        {isSectionLayout ? (
          <SectionLayoutContainer container={container} PanelComponent={PanelComponent} />
        ) : (
          <DashboardGrid container={container} PanelComponent={PanelComponent} />
        )}
      </div>
    );
  }

  public render() {
    const { isEmptyState, layout } = this.state;
    // In SectionLayout mode the empty-state prompt lives inside the empty
    // SECTION (its add-visualization widget), so suppress the dashboard-level
    // empty widget to avoid stacking two "add a panel" prompts.
    //
    // Gate on the feature flag: when `allowDashboardSections` is off, a dashboard
    // that still has a saved SectionLayout renders as a flat GridLayout (from
    // panelsJSON.gridData) rather than as sections, so turning the flag off
    // cleanly hides the feature for existing sectioned dashboards.
    const isSectionLayout =
      !!this.context.services.allowDashboardSections &&
      layout?.type === 'SectionLayout' &&
      layout.items.length > 0;
    return (
      <React.Fragment>
        {isEmptyState && !isSectionLayout ? this.renderEmptyScreen() : null}
        {this.renderContainerScreen(isSectionLayout)}
      </React.Fragment>
    );
  }
}
