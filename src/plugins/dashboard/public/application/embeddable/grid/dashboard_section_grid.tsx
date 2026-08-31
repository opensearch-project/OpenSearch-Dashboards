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

// Dashboard collapsible sections
// "Rendering architecture: nested grids with section-relative coordinates".
//
// One instance of this component is rendered per EXPANDED section, inside that
// section's outer grid item (below its header). It owns a real, independent
// `react-grid-layout` instance containing ONLY that section's member panels.
// react-grid-layout provides drag/resize/collision natively for this inner
// grid, exactly as it does for the outer dashboard grid -- no hand-rolled
// placement/collision logic (that was the flat-overlay Path-1 approach that
// was removed).
//
// Coordinate model: a member's gridData.x/y are
// SECTION-RELATIVE -- coordinates within THIS inner grid (0-based rows), NOT
// the outer dashboard grid. They are never compared against outer-grid or
// other-section coordinates.

import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiButtonEmpty, EuiText, EuiSpacer } from '@elastic/eui';
import { Layout } from 'react-grid-layout';
import { EmbeddableChildPanel, EmbeddableStart } from '../../../../../embeddable/public';
import { DashboardContainer } from '../dashboard_container';
import { DashboardPanelState } from '../types';
import { SectionLayoutMember } from '../../../../common';
import { ResponsiveSizedGrid, PANEL_DRAG_HANDLE } from './dashboard_responsive_grid';

interface PanelLayout extends Layout {
  i: string;
}

export interface DashboardSectionGridProps {
  container: DashboardContainer;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
  /** Section panel id these members belong to. */
  sectionId: string;
  /**
   * This section's members as { panel, layout } pairs, where `panel` is the
   * member's entry in the flat dashboard map and `layout` is its
   * SECTION-RELATIVE position owned by the section (explicitInput.members).
   */
  members: Array<{ panel: DashboardPanelState; member: SectionLayoutMember }>;
  isViewMode: boolean;
  useMargins: boolean;
  /**
   * When true the section is collapsed: the inner grid is CSS-hidden
   * (display:none) but its member panels stay MOUNTED. We deliberately do NOT
   * unmount them -- OSD's EmbeddablePanel.componentWillUnmount() calls
   * embeddable.destroy(), so unmounting a collapsed section's members would
   * tear them down and they'd re-mount blank/white on expand. Hiding (the same
   * mechanism OSD's "expand one panel" uses for the other panels via
   * dshDashboardGrid__item--hidden) keeps each member alive so expand restores
   * it intact.
   */
  collapsed: boolean;
  /**
   * The dashboard's currently maximized panel id (container.expandedPanelId).
   * When it matches one of THIS section's members, that member is expanded to
   * fill the section (and its siblings hidden) -- the inner half of the
   * two-level maximize. Undefined / non-member id => normal grid.
   */
  expandedPanelId?: string;
  /**
   * Called when the inner grid reports a layout change (drag/resize/collision
   * within the section). Receives the section's NEW section-relative member
   * layout list; the caller writes it back into the section panel's
   * explicitInput.members (member panels' own gridData is never touched).
   */
  onMembersLayoutChange: (sectionId: string, updatedLayouts: SectionLayoutMember[]) => void;
  /**
   * Opens the "add existing visualization to section" flyout. Used by the
   * call-to-action shown when the (expanded) section has no members yet.
   */
  onAddPanel?: () => void;
  /**
   * Creates a brand-new visualization for this section (navigates to the
   * Visualize editor; the new panel funnels into a section on return). Shown in
   * the empty-section widget alongside "Add existing visualization".
   */
  onCreateNewPanel?: () => void;
  /**
   * When true, suppress the collapsed-state hint text (the SectionLayout stack
   * wants a collapsed section to show only its header). Members stay mounted
   * either way.
   */
  hideCollapsedHint?: boolean;
}

export class DashboardSectionGrid extends React.Component<DashboardSectionGridProps> {
  public onLayoutChange = (layout: PanelLayout[]) => {
    const { members, sectionId, onMembersLayoutChange } = this.props;
    const validIds = new Set(members.map((m) => m.panel.explicitInput.id));
    const updatedLayouts: SectionLayoutMember[] = layout
      .filter((panelLayout) => validIds.has(panelLayout.i))
      .map((panelLayout) => ({
        idRef: panelLayout.i,
        type: 'panel',
        gridData: _.pick(panelLayout, ['x', 'y', 'w', 'h']),
      }));
    onMembersLayoutChange(sectionId, updatedLayouts);
  };

  public render() {
    const {
      members,
      container,
      PanelComponent,
      isViewMode,
      useMargins,
      sectionId,
      collapsed,
      expandedPanelId,
      onAddPanel,
      onCreateNewPanel,
      hideCollapsedHint,
    } = this.props;

    const membersInOrder = [...members].sort((a, b) => {
      if (a.member.gridData.y === b.member.gridData.y)
        return a.member.gridData.x - b.member.gridData.x;
      return a.member.gridData.y - b.member.gridData.y;
    });

    const layout: PanelLayout[] = membersInOrder.map((m) => ({
      ..._.pick(m.member.gridData, ['x', 'y', 'w', 'h']),
      i: m.panel.explicitInput.id,
    }));

    // Inner half of the two-level maximize: when the dashboard's maximized
    // panel is one of THIS section's members, that member fills the section
    // and its siblings are hidden -- reusing the outer grid's own expand/hide
    // classes so the CSS (position/height/width overrides) is shared.
    const hasMaximizedMember =
      expandedPanelId !== undefined &&
      membersInOrder.some((m) => m.panel.explicitInput.id === expandedPanelId);

    const children = membersInOrder.map(({ panel }) => {
      const memberId = panel.explicitInput.id;
      const expandPanel = hasMaximizedMember && expandedPanelId === memberId;
      const hidePanel = hasMaximizedMember && expandedPanelId !== memberId;
      const itemClassName = classNames({
        'dshDashboardGrid__item--expanded': expandPanel,
        'dshDashboardGrid__item--hidden': hidePanel,
      });
      return (
        <div key={memberId} className={itemClassName} data-test-subj="dashboardPanel">
          <EmbeddableChildPanel
            key={panel.type}
            embeddableId={memberId}
            container={container}
            PanelComponent={PanelComponent}
          />
        </div>
      );
    });

    const innerClassName = collapsed
      ? 'dshDashboardSectionGrid__inner dshDashboardSectionGrid__inner--collapsed'
      : 'dshDashboardSectionGrid__inner';

    return (
      <div className="dshDashboardSectionGrid" data-test-subj={`dashboardSectionGrid-${sectionId}`}>
        {collapsed && !hideCollapsedHint ? (
          <div
            className="dshDashboardSectionGrid__collapsedHint"
            data-test-subj={`dashboardSectionCollapsedHint-${sectionId}`}
          >
            {i18n.translate('dashboard.section.collapsedHint', {
              defaultMessage:
                'This section is collapsed. Click the expand arrow in the header to show its panels.',
            })}
          </div>
        ) : null}
        {!collapsed && members.length === 0 ? (
          <div
            className="dshDashboardSectionGrid__emptyCta"
            data-test-subj={`dashboardSectionEmptyCta-${sectionId}`}
          >
            {/* Mirrors the empty-dashboard start screen (.dshEmptyWidget): a
                dashed box prompting the user to add their first panel, offering
                both "Create new visualization" and "Add existing visualization". */}
            <div
              className="dshDashboardSectionGrid__emptyWidget"
              data-test-subj="emptySectionWidget"
            >
              <EuiText size="s" color="subdued">
                <p>
                  {i18n.translate('dashboard.section.addPanel.emptyPrompt', {
                    defaultMessage: 'This section is empty.',
                  })}
                </p>
              </EuiText>
              <EuiSpacer size="s" />
              {onCreateNewPanel ? (
                <EuiButton
                  size="s"
                  iconType="plusInCircle"
                  onClick={onCreateNewPanel}
                  data-test-subj="createNewVisToSectionButton"
                >
                  {i18n.translate('dashboard.section.addPanel.createNewLabel', {
                    defaultMessage: 'Create new visualization',
                  })}
                </EuiButton>
              ) : null}
              {onAddPanel ? (
                <>
                  <EuiSpacer size="xs" />
                  <EuiButtonEmpty
                    size="s"
                    iconType="plusInCircle"
                    onClick={onAddPanel}
                    data-test-subj="addExistingVisToSectionButton"
                  >
                    {i18n.translate('dashboard.section.addPanel.ctaLabel', {
                      defaultMessage: 'Add existing visualization',
                    })}
                  </EuiButtonEmpty>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={innerClassName}>
          <ResponsiveSizedGrid
            className="dshDashboardSectionGrid__grid"
            isViewMode={isViewMode}
            layout={layout}
            onLayoutChange={this.onLayoutChange}
            useMargins={useMargins}
            draggableHandle={PANEL_DRAG_HANDLE}
            draggableCancel={undefined}
            maximizedPanelId={hasMaximizedMember ? expandedPanelId : undefined}
          >
            {children}
          </ResponsiveSizedGrid>
        </div>
      </div>
    );
  }
}
