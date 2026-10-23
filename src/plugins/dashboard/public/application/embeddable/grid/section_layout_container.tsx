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

// Renders sections in layout order. Each section owns a grid of member panels
// using section-relative coordinates.

import React from 'react';
import { Subscription } from 'rxjs';
import classNames from 'classnames';
import { i18n } from '@osd/i18n';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFieldText,
  EuiPopover,
  EuiTitle,
  EuiButton,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiDragDropContext,
  EuiDroppable,
  EuiDraggable,
  euiDragDropReorder,
  DropResult,
} from '@elastic/eui';
import {
  ViewMode,
  EmbeddableStart,
  EmbeddableInput,
  openAddPanelFlyout,
} from '../../../../../embeddable/public';
import { withOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardLayout, DashboardSection, SectionLayoutMember } from '../../../../common';
import {
  DashboardContainer,
  DashboardContainerInput,
  DashboardReactContextValue,
} from '../dashboard_container';
import { DashboardPanelState } from '../types';
import { DashboardSectionGrid } from './dashboard_section_grid';
import { claimPanelIntoSection } from '../section_create_target';
import {
  computeUnclaimedPanels,
  computeUngroupedLayout,
  flattenSectionsToPanels,
  removeSection,
  renameSection,
  setSectionCollapsed,
} from '../section_layout_utils';

export interface SectionLayoutContainerProps {
  container: DashboardContainer;
  PanelComponent: EmbeddableStart['EmbeddablePanel'];
}

type Props = SectionLayoutContainerProps & {
  opensearchDashboards: DashboardReactContextValue;
};

interface State {
  layout?: DashboardLayout;
  panels: { [key: string]: DashboardPanelState };
  viewMode: ViewMode;
  useMargins: boolean;
  expandedPanelId?: string;
  openKebabSectionId?: string;
  renamingSectionId?: string;
  renameDraft: string;
}

class SectionLayoutContainerUi extends React.Component<Props, State> {
  private subscription?: Subscription;
  private mounted: boolean = false;

  constructor(props: Props) {
    super(props);
    const input = props.container.getInput();
    this.state = {
      layout: input.layout,
      panels: input.panels,
      viewMode: input.viewMode,
      useMargins: input.useMargins,
      expandedPanelId: input.expandedPanelId,
      renameDraft: '',
    };
  }

  public componentDidMount() {
    this.mounted = true;
    this.subscription = this.props.container
      .getInput$()
      .subscribe((input: DashboardContainerInput) => {
        if (this.mounted) {
          this.setState({
            layout: input.layout,
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

  private getSections = (): DashboardSection[] => this.state.layout?.items ?? [];

  private updateSections = (items: DashboardSection[]) => {
    this.props.container.updateInput({ layout: { type: 'SectionLayout', items } });
  };

  private toggleCollapsed = (sectionId: string) => {
    const section = this.getSections().find((s) => s.id === sectionId);
    if (!section) return;
    this.updateSections(setSectionCollapsed(this.getSections(), sectionId, !section.collapsed));
  };

  private onSectionDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;
    this.updateSections(euiDragDropReorder(this.getSections(), source.index, destination.index));
  };

  private startRename = (section: DashboardSection) => {
    this.setState({
      renamingSectionId: section.id,
      renameDraft: section.name,
      openKebabSectionId: undefined,
    });
  };

  private commitRename = () => {
    const { renamingSectionId, renameDraft } = this.state;
    const name = renameDraft.trim();
    if (renamingSectionId && name) {
      this.updateSections(renameSection(this.getSections(), renamingSectionId, name));
    }
    this.setState({ renamingSectionId: undefined, renameDraft: '' });
  };

  private openAddPanel = (sectionId: string) => {
    const services = this.props.opensearchDashboards.services;
    if (!services?.overlays) return;
    this.setState({ openKebabSectionId: undefined });
    openAddPanelFlyout({
      embeddable: this.props.container,
      getFactory: services.embeddable.getEmbeddableFactory,
      getAllFactories: services.embeddable.getEmbeddableFactories,
      overlays: services.overlays,
      notifications: services.notifications,
      SavedObjectFinder: services.SavedObjectFinder,
      showCreateNew: false,
      closeAfterAdd: true,
      onPanelAdded: (embeddable) => {
        claimPanelIntoSection(this.props.container, sectionId, embeddable.id);
      },
    });
  };

  private createNewVisualization = async (sectionId: string) => {
    const services = this.props.opensearchDashboards.services;
    this.setState({ openKebabSectionId: undefined });
    const factory = services.embeddable?.getEmbeddableFactory?.('visualization');
    if (factory) {
      // Preserve the target section through the editor round trip.
      this.props.container.setPendingCreateSectionContext?.(sectionId);
      await factory.create({} as EmbeddableInput, this.props.container);
    }
  };

  private deleteSection = async (sectionId: string) => {
    const services = this.props.opensearchDashboards.services;
    this.setState({ openKebabSectionId: undefined });
    const items0 = this.getSections();
    const section = items0.find((s) => s.id === sectionId);
    const memberCount = section ? section.members.length : 0;

    const confirmed = await services.overlays.openConfirm(
      i18n.translate('dashboard.section.delete.confirmDescription', {
        defaultMessage:
          'This removes the section and its {memberCount, plural, one {# panel} other {# panels}}. This cannot be undone.',
        values: { memberCount },
      }),
      {
        title: i18n.translate('dashboard.section.delete.confirmTitle', {
          defaultMessage: 'Delete section and its panels?',
        }),
        confirmButtonText: i18n.translate('dashboard.section.delete.confirmButtonLabel', {
          defaultMessage: 'Delete',
        }),
        cancelButtonText: i18n.translate('dashboard.section.delete.cancelButtonLabel', {
          defaultMessage: 'Cancel',
        }),
        buttonColor: 'danger',
      }
    );
    if (!confirmed) return;

    const { items, removedMemberIds } = removeSection(items0, sectionId);
    const panels = { ...this.props.container.getInput().panels };
    removedMemberIds.forEach((id) => delete panels[id]);
    if (items.length) {
      this.props.container.updateInput({ panels, layout: { type: 'SectionLayout', items } });
      return;
    }

    this.props.container.reparentPanels(
      Object.keys(panels),
      { type: 'GridLayout', items: [] },
      panels
    );
  };

  private ungroupAllSections = async () => {
    const services = this.props.opensearchDashboards.services;
    this.setState({ openKebabSectionId: undefined });
    const items = this.getSections();
    if (items.length === 0) return;

    const confirmed = await services.overlays.openConfirm(
      i18n.translate('dashboard.section.ungroupAll.confirmDescription', {
        defaultMessage:
          'This removes all sections and returns the dashboard to a single grid. Your panels are kept. This cannot be undone.',
      }),
      {
        title: i18n.translate('dashboard.section.ungroupAll.confirmTitle', {
          defaultMessage: 'Ungroup all sections?',
        }),
        confirmButtonText: i18n.translate('dashboard.section.ungroupAll.confirmButtonLabel', {
          defaultMessage: 'Ungroup all sections',
        }),
        cancelButtonText: i18n.translate('dashboard.section.ungroupAll.cancelButtonLabel', {
          defaultMessage: 'Cancel',
        }),
      }
    );
    if (!confirmed) return;

    const currentPanels = this.props.container.getInput().panels;
    const panels = flattenSectionsToPanels(items, currentPanels);
    this.props.container.reparentPanels(
      Object.keys(panels),
      { type: 'GridLayout', items: [] },
      panels
    );
  };

  private resolveMembers = (section: DashboardSection) => {
    const { panels } = this.state;
    return section.members
      .map((member) => ({ panel: panels[member.idRef], member }))
      .filter((entry) => Boolean(entry.panel));
  };

  private renderSectionKebab = (section: DashboardSection) => {
    const button = (
      <EuiButtonIcon
        iconType="boxesVertical"
        color="text"
        data-test-subj={`dashboardSectionMenuButton-${section.id}`}
        aria-label={i18n.translate('dashboard.section.menuAriaLabel', {
          defaultMessage: 'Section options for {name}',
          values: { name: section.name },
        })}
        onClick={() =>
          this.setState((s) => ({
            openKebabSectionId: s.openKebabSectionId === section.id ? undefined : section.id,
          }))
        }
      />
    );
    const items = [
      <EuiContextMenuItem
        key="rename"
        icon="pencil"
        data-test-subj={`dashboardSectionRename-${section.id}`}
        onClick={() => this.startRename(section)}
      >
        {i18n.translate('dashboard.section.menu.rename', { defaultMessage: 'Rename' })}
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="createNew"
        icon="visualizeApp"
        data-test-subj={`dashboardSectionCreateNew-${section.id}`}
        onClick={() => this.createNewVisualization(section.id)}
      >
        {i18n.translate('dashboard.section.menu.createNewVisualization', {
          defaultMessage: 'Create new visualization',
        })}
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="addPanel"
        icon="plusInCircle"
        data-test-subj={`dashboardSectionAddPanel-${section.id}`}
        onClick={() => this.openAddPanel(section.id)}
      >
        {i18n.translate('dashboard.section.menu.addExistingVisualization', {
          defaultMessage: 'Add from library',
        })}
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="delete"
        icon="trash"
        data-test-subj={`dashboardSectionDelete-${section.id}`}
        onClick={() => this.deleteSection(section.id)}
      >
        {i18n.translate('dashboard.section.menu.delete', { defaultMessage: 'Delete section' })}
      </EuiContextMenuItem>,
      <EuiContextMenuItem
        key="ungroupAll"
        icon="fold"
        data-test-subj={`dashboardSectionUngroupAll-${section.id}`}
        onClick={this.ungroupAllSections}
      >
        {i18n.translate('dashboard.section.menu.ungroupAll', {
          defaultMessage: 'Ungroup all sections',
        })}
      </EuiContextMenuItem>,
    ];

    return (
      <EuiPopover
        id={`dashboardSectionMenu-${section.id}`}
        button={button}
        isOpen={this.state.openKebabSectionId === section.id}
        closePopover={() => this.setState({ openKebabSectionId: undefined })}
        panelPaddingSize="none"
        anchorPosition="downRight"
      >
        <EuiContextMenuPanel items={items} />
      </EuiPopover>
    );
  };

  private renderRenameModal() {
    const { renamingSectionId, renameDraft } = this.state;
    if (!renamingSectionId) return null;
    return (
      <EuiModal onClose={() => this.setState({ renamingSectionId: undefined })} maxWidth={400}>
        <EuiModalHeader>
          <EuiModalHeaderTitle>
            {i18n.translate('dashboard.section.rename.title', { defaultMessage: 'Rename section' })}
          </EuiModalHeaderTitle>
        </EuiModalHeader>
        <EuiModalBody>
          <EuiFieldText
            value={renameDraft}
            data-test-subj="dashboardSectionRenameInput"
            autoFocus
            onChange={(e) => this.setState({ renameDraft: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') this.commitRename();
            }}
          />
        </EuiModalBody>
        <EuiModalFooter>
          <EuiButtonEmpty onClick={() => this.setState({ renamingSectionId: undefined })}>
            {i18n.translate('dashboard.section.rename.cancel', { defaultMessage: 'Cancel' })}
          </EuiButtonEmpty>
          <EuiButton
            fill
            data-test-subj="dashboardSectionRenameConfirm"
            disabled={!renameDraft.trim()}
            onClick={this.commitRename}
          >
            {i18n.translate('dashboard.section.rename.save', { defaultMessage: 'Save' })}
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    );
  }

  /**
   * Panels not claimed by an explicit section render in a read-only virtual
   * section. This section is derived at render time and is never persisted.
   */
  private renderVirtualSection() {
    const { container, PanelComponent } = this.props;
    const { useMargins, expandedPanelId } = this.state;
    const unclaimed = computeUnclaimedPanels(this.getSections(), this.state.panels);
    if (unclaimed.length === 0) return null;

    const members = computeUngroupedLayout(unclaimed).map((member) => ({
      panel: this.state.panels[member.idRef],
      member,
    }));
    const containsExpanded =
      expandedPanelId !== undefined &&
      unclaimed.some((panel) => panel.explicitInput.id === expandedPanelId);
    const hide = expandedPanelId !== undefined && !containsExpanded;

    const sectionClasses = classNames(
      'dshSectionLayout__section',
      'dshSectionLayout__section--virtual',
      {
        'dshSectionLayout__section--hidden': hide,
        'dshSectionLayout__section--maximized': containsExpanded,
      }
    );

    return (
      <div className={sectionClasses} data-test-subj="dashboardSectionUngrouped">
        <div className="dshSectionLayout__sectionHeader">
          <EuiTitle size="xxs" className="dshSectionLayout__sectionTitle">
            <h3 data-test-subj="dashboardSectionUngroupedTitle">
              {i18n.translate('dashboard.section.ungroupedTitle', {
                defaultMessage: 'Ungrouped',
              })}
            </h3>
          </EuiTitle>
        </div>
        <DashboardSectionGrid
          container={container}
          PanelComponent={PanelComponent}
          sectionId="__ungrouped__"
          members={members}
          isViewMode
          useMargins={useMargins}
          collapsed={false}
          expandedPanelId={expandedPanelId}
          onMembersLayoutChange={() => undefined}
        />
      </div>
    );
  }

  public render() {
    const { container, PanelComponent } = this.props;
    const { viewMode, useMargins, expandedPanelId } = this.state;
    const isViewMode = viewMode === ViewMode.VIEW;
    const sections = this.getSections();

    const owningSectionId =
      expandedPanelId !== undefined
        ? sections.find((section) => section.members.some((m) => m.idRef === expandedPanelId))?.id
        : undefined;

    return (
      <div className="dshSectionLayout" data-test-subj="dashboardSectionLayout">
        <EuiDragDropContext onDragEnd={this.onSectionDragEnd}>
          <EuiDroppable droppableId="dashboardSectionsDroppable" spacing="none">
            {sections.map((section, index) => {
              const members = this.resolveMembers(section);
              const hideSection = expandedPanelId !== undefined && section.id !== owningSectionId;
              const ownsMaximized = expandedPanelId !== undefined && section.id === owningSectionId;
              const sectionClasses = classNames('dshSectionLayout__section', {
                'dshSectionLayout__section--editing': !isViewMode,
                'dshSectionLayout__section--hidden': hideSection,
                'dshSectionLayout__section--collapsed': section.collapsed,
                'dshSectionLayout__section--maximized': ownsMaximized,
              });
              return (
                <EuiDraggable
                  key={section.id}
                  index={index}
                  draggableId={section.id}
                  customDragHandle
                  isDragDisabled={isViewMode}
                  spacing="l"
                >
                  {(provided) => (
                    <div
                      className={sectionClasses}
                      data-test-subj={`dashboardSection-${section.id}`}
                    >
                      <div
                        className="dshSectionLayout__sectionHeader"
                        {...(!isViewMode ? provided.dragHandleProps : {})}
                      >
                        <EuiButtonIcon
                          iconType="arrowDown"
                          color="text"
                          className={classNames('dshSectionLayout__collapseButton', {
                            'dshSectionLayout__collapseButton--collapsed': section.collapsed,
                          })}
                          onClick={() => this.toggleCollapsed(section.id)}
                          data-test-subj={`dashboardSectionToggle-${section.id}`}
                          aria-label={
                            section.collapsed
                              ? i18n.translate('dashboard.section.expandAriaLabel', {
                                  defaultMessage: 'Expand section {name}',
                                  values: { name: section.name },
                                })
                              : i18n.translate('dashboard.section.collapseAriaLabel', {
                                  defaultMessage: 'Collapse section {name}',
                                  values: { name: section.name },
                                })
                          }
                        />
                        <EuiTitle size="xxs" className="dshSectionLayout__sectionTitle">
                          <h3 data-test-subj={`dashboardSectionTitle-${section.id}`}>
                            {section.name}
                          </h3>
                        </EuiTitle>
                        {!isViewMode && (
                          <div className="dshSectionLayout__sectionMenu">
                            {this.renderSectionKebab(section)}
                          </div>
                        )}
                      </div>
                      <DashboardSectionGrid
                        container={container}
                        PanelComponent={PanelComponent}
                        sectionId={section.id}
                        members={members}
                        isViewMode={isViewMode}
                        useMargins={useMargins}
                        collapsed={section.collapsed}
                        expandedPanelId={expandedPanelId}
                        onMembersLayoutChange={(sectionId, updated: SectionLayoutMember[]) =>
                          this.updateSections(
                            this.getSections().map((s) =>
                              s.id === sectionId ? { ...s, members: updated } : s
                            )
                          )
                        }
                        onAddPanel={!isViewMode ? () => this.openAddPanel(section.id) : undefined}
                        onCreateNewPanel={
                          !isViewMode ? () => this.createNewVisualization(section.id) : undefined
                        }
                      />
                    </div>
                  )}
                </EuiDraggable>
              );
            })}
          </EuiDroppable>
        </EuiDragDropContext>
        {this.renderVirtualSection()}
        {this.renderRenameModal()}
      </div>
    );
  }
}

export const SectionLayoutContainer = withOpenSearchDashboards(SectionLayoutContainerUi);
