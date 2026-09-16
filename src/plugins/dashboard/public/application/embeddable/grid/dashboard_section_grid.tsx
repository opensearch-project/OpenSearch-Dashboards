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

// Each section owns an independent grid whose member coordinates are relative
// to that section.

import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import { EuiButton, EuiButtonEmpty } from '@elastic/eui';
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
  sectionId: string;
  members: Array<{ panel: DashboardPanelState; member: SectionLayoutMember }>;
  isViewMode: boolean;
  useMargins: boolean;
  /**
   * Collapsing is visual: member panels remain mounted so already-created
   * embeddables are not destroyed.
   */
  collapsed: boolean;
  expandedPanelId?: string;
  onMembersLayoutChange: (sectionId: string, updatedLayouts: SectionLayoutMember[]) => void;
  onAddPanel?: () => void;
  onCreateNewPanel?: () => void;
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

    // A maximized member fills its section while its siblings remain hidden.
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

    const innerClassName = classNames('dshDashboardSectionGrid__inner', {
      'dshDashboardSectionGrid__inner--collapsed': collapsed,
    });

    return (
      <div className="dshDashboardSectionGrid" data-test-subj={`dashboardSectionGrid-${sectionId}`}>
        <div className={innerClassName} aria-hidden={collapsed}>
          <div className="dshDashboardSectionGrid__content">
            {members.length === 0 ? (
              <div
                className="dshDashboardSectionGrid__emptyCta"
                data-test-subj={`dashboardSectionEmptyCta-${sectionId}`}
              >
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
                  <EuiButtonEmpty
                    size="s"
                    onClick={onAddPanel}
                    data-test-subj="addExistingVisToSectionButton"
                  >
                    {i18n.translate('dashboard.section.addPanel.ctaLabel', {
                      defaultMessage: 'Add from library',
                    })}
                  </EuiButtonEmpty>
                ) : null}
              </div>
            ) : null}
            <ResponsiveSizedGrid
              className="dshDashboardSectionGrid__grid"
              isViewMode={isViewMode}
              layout={layout}
              onLayoutChange={this.onLayoutChange}
              useMargins={useMargins}
              draggableHandle={PANEL_DRAG_HANDLE}
              maximizedPanelId={hasMaximizedMember ? expandedPanelId : undefined}
            >
              {children}
            </ResponsiveSizedGrid>
          </div>
        </div>
      </div>
    );
  }
}
