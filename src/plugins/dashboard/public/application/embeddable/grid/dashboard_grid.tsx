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
import { DASHBOARD_SECTION_EMBEDDABLE } from '../section';
import {
  buildSectionMemberMap,
  SectionMember,
  DashboardSectionEmbeddableInput,
} from '../section/section_embeddable';
import { withOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardContainerInput } from '../dashboard_container';
import { DashboardContainer, DashboardReactContextValue } from '../dashboard_container';
import { ResponsiveSizedGrid, SECTION_INNER_GRID_CANCEL } from './dashboard_responsive_grid';
import { DashboardSectionGrid } from './dashboard_section_grid';
import { SECTION_HEADER_ROWS } from '../dashboard_constants';
import { openAddPanelToSectionFlyout } from '../../actions/add_panel_to_section_flyout';

/**
 * SECTION_HEADER_ROWS (the outer-grid
 * rows reserved for a section's header strip) now lives in dashboard_constants
 * as the single source of truth -- see the constant there for the rendering
 * rationale (single-line header, 1-row-clips / 2-rows-clears trade-off).
 */

/** Extra inner rows reserved for an empty, expanded section's add-panel CTA. */
const EMPTY_SECTION_CTA_ROWS = 5;

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

  // ---------------------------------------------------------------------------
  // Option 1 (section-owned member list). Membership + the
  // section-relative layout of members live in each section panel's
  // `explicitInput.members`. Member panels stay in the flat `panels` map with
  // their own ABSOLUTE gridData and NO sectionId. The flat map therefore
  // contains only two kinds of OUTER entry from the grid's perspective:
  //   1. Section panels    (type === DASHBOARD_SECTION_EMBEDDABLE)
  //   2. Ungrouped panels  (not listed in any section's `members`)
  // A panel listed in some section's `members` is rendered by that section's
  // inner DashboardSectionGrid (at its section-relative layout), never by the
  // outer grid.
  // ---------------------------------------------------------------------------

  private isSectionPanel = (panel: DashboardPanelState): boolean =>
    panel.type === DASHBOARD_SECTION_EMBEDDABLE;

  /**
   * Whether the collapsible-sections feature is active. When the
   * allowDashboardSections flag is off, plugin.tsx never registers the section
   * embeddable factory, so getEmbeddableFactory returns undefined. In that case
   * the grid filters section panels out entirely and renders every other panel
   * (including former members) at its own ABSOLUTE gridData -- former members
   * are valid standalone panels under Option 1, so no error and no relayout.
   */
  private sectionsEnabled = (): boolean =>
    Boolean(
      this.props.opensearchDashboards?.services?.embeddable?.getEmbeddableFactory?.(
        DASHBOARD_SECTION_EMBEDDABLE
      )
    );

  /** Section member map, or an empty map when the feature is disabled. */
  private getMemberMap = (panels: { [key: string]: DashboardPanelState }) =>
    this.sectionsEnabled()
      ? buildSectionMemberMap(panels)
      : new Map<string, { sectionId: string; member: SectionMember }>();

  /**
   * Open the "add existing visualization to section" flyout for a section.
   * Shared by the section's kebab action and the empty-section call-to-action.
   */
  private openAddPanelToSection = (sectionId: string) => {
    const services = this.props.opensearchDashboards?.services;
    if (!services?.overlays) return;
    openAddPanelToSectionFlyout({
      overlays: services.overlays,
      notifications: services.notifications,
      container: this.props.container,
      sectionId,
      savedObjectFinder: services.SavedObjectFinder,
      getEmbeddableFactories: services.embeddable.getEmbeddableFactories,
    });
  };

  private isSectionCollapsed = (sectionPanel: DashboardPanelState): boolean =>
    Boolean((sectionPanel.explicitInput as { collapsed?: boolean }).collapsed);

  /** The section's own authoritative member list (section-relative layout). */
  private getSectionMemberLayouts = (sectionPanel: DashboardPanelState): SectionMember[] =>
    (
      (sectionPanel.explicitInput as Partial<DashboardSectionEmbeddableInput>).members ?? []
    ).slice();

  /**
   * Resolve a section's members to { panel, member } pairs for rendering, in
   * layout order. Entries whose panel no longer exists in the flat map
   * (stale reference) are skipped.
   */
  private getSectionMembers = (
    sectionPanel: DashboardPanelState,
    panels: { [key: string]: DashboardPanelState }
  ): Array<{ panel: DashboardPanelState; member: SectionMember }> =>
    this.getSectionMemberLayouts(sectionPanel)
      .map((member) => ({ panel: panels[member.id], member }))
      .filter((m) => Boolean(m.panel));

  /**
   * Outer-grid height (in outer rows) for a section item: the header strip
   * plus, when expanded, enough rows to contain the inner grid's content.
   * Inner and outer grids share rowHeight/margin/columns, so an inner content
   * span of N rows occupies N outer rows too (no scaling).
   */
  private computeSectionOuterHeight = (
    sectionPanel: DashboardPanelState,
    collapsed: boolean
  ): number => {
    if (collapsed) return SECTION_HEADER_ROWS;
    const innerContentRows = this.getSectionMemberLayouts(sectionPanel).reduce(
      (max, m) => Math.max(max, m.gridData.y + m.gridData.h),
      0
    );
    // An empty, expanded section reserves a few rows so its "add visualization"
    // call-to-action has room to render.
    if (innerContentRows === 0) return SECTION_HEADER_ROWS + EMPTY_SECTION_CTA_ROWS;
    return SECTION_HEADER_ROWS + innerContentRows;
  };

  /**
   * The OUTER grid's layout: ungrouped panels + section panels only. Panels
   * listed in a section's `members` are excluded (rendered by inner grids).
   * Each section panel's `h` is overridden with the computed header+content
   * height so the outer item is exactly tall enough for its inner grid.
   */
  public buildLayoutFromPanels = (): Array<GridData & { isResizable?: boolean }> => {
    const { panels } = this.state;
    const sectionsEnabled = this.sectionsEnabled();
    const memberMap = this.getMemberMap(panels);
    return Object.values(panels)
      .filter((panel) => {
        // When the feature is off, drop section panels entirely (their factory
        // is unregistered -> they'd render as errors). Members are not in the
        // (empty) member map, so they fall through and render at absolute coords.
        if (this.isSectionPanel(panel)) return sectionsEnabled;
        return !memberMap.has(panel.explicitInput.id);
      })
      .map((panel) => {
        if (sectionsEnabled && this.isSectionPanel(panel)) {
          const collapsed = this.isSectionCollapsed(panel);
          return {
            ...panel.gridData,
            h: this.computeSectionOuterHeight(panel, collapsed),
            // The section container is NOT user-resizable -- its outer height is
            // derived each render from its members, so a manual resize would be
            // overwritten. Per-item RGL override; ordinary panels keep resize.
            isResizable: false,
          };
        }
        return panel.gridData;
      });
  };

  /**
   * OUTER grid layout-change handler. `layout` only contains outer items
   * (ungrouped panels + section panels). Section members are NOT in it and are
   * preserved untouched -- merge the reported outer updates over the full map.
   */
  public onLayoutChange = (layout: PanelLayout[]) => {
    const { panels } = this.state;
    const updatedOuter: { [key: string]: DashboardPanelState } = layout.reduce(
      (acc, panelLayout) => {
        const existing = panels[panelLayout.i];
        if (!existing) return acc;
        acc[panelLayout.i] = {
          ...existing,
          gridData: _.pick(panelLayout, ['x', 'y', 'w', 'h', 'i']),
        };
        return acc;
      },
      {} as { [key: string]: DashboardPanelState }
    );
    this.onPanelsUpdated({ ...panels, ...updatedOuter });
  };

  /**
   * INNER grid layout-change handler, one section at a time. The section OWNS
   * its members' layout, so we write the updated section-relative layout back
   * into that section panel's `explicitInput.members` -- member panels' own
   * gridData is never touched here.
   */
  public onSectionMembersLayoutChange = (sectionId: string, updatedLayouts: SectionMember[]) => {
    const { panels } = this.state;
    const sectionPanel = panels[sectionId];
    if (!sectionPanel) return;
    this.onPanelsUpdated({
      ...panels,
      [sectionId]: {
        ...sectionPanel,
        explicitInput: {
          ...sectionPanel.explicitInput,
          members: updatedLayouts,
        },
      },
    });
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
    const { focusedPanelIndex, panels, expandedPanelId, viewMode, useMargins } = this.state;
    const isViewMode = viewMode === ViewMode.VIEW;

    // When the maximized panel is a section MEMBER it lives in that section's
    // inner grid, not the outer grid. Maximizing it is therefore a two-level
    // operation: the OWNING SECTION's outer item is expanded (and every other
    // outer item hidden) while that section's inner grid expands the member
    // itself (see DashboardSectionGrid). Resolve the owning section here.
    const memberMap = this.getMemberMap(panels);
    const sectionsEnabled = this.sectionsEnabled();
    // If the maximized panel is a section MEMBER, resolve its owning section so
    // the two-level maximize can expand that section at the outer level.
    const expandedOwnerSectionId = expandedPanelId
      ? memberMap.get(expandedPanelId)?.sectionId
      : undefined;

    // Outer children: section panels (only when enabled) + ungrouped panels
    // (anything NOT listed as a member of some section), in consistent order.
    const outerPanels = Object.values(panels).filter((panel) => {
      if (this.isSectionPanel(panel)) return sectionsEnabled;
      return !memberMap.has(panel.explicitInput.id);
    });
    outerPanels.sort((panelA, panelB) => {
      if (panelA.gridData.y === panelB.gridData.y) {
        return panelA.gridData.x - panelB.gridData.x;
      }
      return panelA.gridData.y - panelB.gridData.y;
    });

    return _.map(outerPanels, (panel) => {
      const id = panel.explicitInput.id;
      // A section item is "expanded" when the section itself is maximized OR
      // when it owns the maximized member; any other outer item is hidden.
      const expandPanel =
        expandedPanelId !== undefined && (expandedPanelId === id || id === expandedOwnerSectionId);
      const hidePanel = expandedPanelId !== undefined && !expandPanel;
      const isSection = this.isSectionPanel(panel);
      const classes = classNames({
        'dshDashboardGrid__item--expanded': expandPanel,
        'dshDashboardGrid__item--hidden': hidePanel,
        'dshDashboardGrid__item--section': isSection,
      });

      // Section item: header (via EmbeddableChildPanel chrome, so it keeps its
      // own kebab actions) + an inner grid of its members when expanded.
      if (isSection) {
        const collapsed = this.isSectionCollapsed(panel);
        const members = this.getSectionMembers(panel, panels);
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
            <div className="dshDashboardGrid__sectionHeader">
              <EmbeddableChildPanel
                key={panel.type}
                embeddableId={id}
                container={this.props.container}
                PanelComponent={this.props.PanelComponent}
              />
            </div>
            <DashboardSectionGrid
              container={this.props.container}
              PanelComponent={this.props.PanelComponent}
              sectionId={id}
              members={members}
              isViewMode={isViewMode}
              useMargins={useMargins}
              collapsed={collapsed}
              expandedPanelId={expandedPanelId}
              onMembersLayoutChange={this.onSectionMembersLayoutChange}
              onAddPanel={() => this.openAddPanelToSection(id)}
            />
          </div>
        );
      }

      // Ordinary (ungrouped) panel -- unchanged from the pre-sections behavior.
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
        // a mousedown inside any section's inner grid must NOT
        // start a drag of the section (outer) item -- the inner grid handles
        // its own members. This is the disjoint-drag isolation from the
        // nested-grid prototype (see dashboard_responsive_grid).
        draggableCancel={SECTION_INNER_GRID_CANCEL}
      >
        {this.renderPanels()}
      </ResponsiveSizedGrid>
    );
  }
}

export const DashboardGrid = injectI18n(withOpenSearchDashboards(DashboardGridUi));
