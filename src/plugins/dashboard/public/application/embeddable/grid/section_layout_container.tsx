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

// SectionLayout renderer (v2 data model).
//
// When a dashboard's `layout.type === 'SectionLayout'` the dashboard is NOT a
// single react-grid-layout. Instead this component renders `layout.items`
// (sections) in array order as a plain vertical stack. Each section has a
// bespoke header (collapse chevron + name + an edit-mode kebab) followed by its
// own inner react-grid-layout (DashboardSectionGrid) containing that section's
// member panels at their SECTION-RELATIVE coordinates.
//
// Sections are no longer embeddable panels; membership + inner layout live in
// the top-level `layout` attribute. Member panels still live in the container's
// `panels` map (their own gridData is dormant in this mode) and are rendered by
// id via EmbeddableChildPanel inside each section's inner grid.

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
  EuiIcon,
  EuiDragDropContext,
  EuiDroppable,
  EuiDraggable,
  euiDragDropReorder,
  DropResult,
} from '@elastic/eui';
import { ViewMode, EmbeddableStart, EmbeddableInput } from '../../../../../embeddable/public';
import { withOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DashboardLayout, SectionLayout, SectionLayoutMember } from '../../../../common';
import {
  DashboardContainer,
  DashboardContainerInput,
  DashboardReactContextValue,
} from '../dashboard_container';
import { DashboardPanelState } from '../types';
import { DashboardSectionGrid } from './dashboard_section_grid';
import { openAddPanelToSectionFlyout } from '../../actions/add_panel_to_section_flyout';
import {
  computeUnclaimedPanels,
  computeUngroupedLayout,
  flattenSectionsToPanels,
  getClaimedMemberIds,
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
  /** Section whose kebab menu is currently open. */
  openKebabSectionId?: string;
  /** Section currently being renamed (drives the rename modal). */
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

  private getSections = (): SectionLayout[] => this.state.layout?.items ?? [];

  /** Write an updated section list back to the container as a SectionLayout. */
  private updateSections = (items: SectionLayout[]) => {
    this.props.container.updateInput({ layout: { type: 'SectionLayout', items } });
  };

  private toggleCollapsed = (sectionId: string) => {
    const section = this.getSections().find((s) => s.id === sectionId);
    if (!section) return;
    this.updateSections(setSectionCollapsed(this.getSections(), sectionId, !section.collapsed));
  };

  /** Reorder sections via drag-and-drop of the section header handle. */
  private onSectionDragEnd = ({ source, destination }: DropResult) => {
    if (!destination || source.index === destination.index) return;
    this.updateSections(euiDragDropReorder(this.getSections(), source.index, destination.index));
  };

  private startRename = (section: SectionLayout) => {
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
    openAddPanelToSectionFlyout({
      overlays: services.overlays,
      notifications: services.notifications,
      container: this.props.container,
      sectionId,
      savedObjectFinder: services.SavedObjectFinder,
      getEmbeddableFactories: services.embeddable.getEmbeddableFactories,
    });
  };

  /**
   * Create a brand-new visualization for a specific section. This navigates to
   * the Visualize editor; on "Save and return" the new panel returns via the
   * incoming-embeddable path. We stash the target section id first so that
   * return path can claim the panel into THIS section instead of leaving it
   * unclaimed in the "Ungrouped" virtual section (see section_create_target).
   */
  private createNewVisualization = async (sectionId: string) => {
    const services = this.props.opensearchDashboards.services;
    this.setState({ openKebabSectionId: undefined });
    const factory = services.embeddable?.getEmbeddableFactory?.('visualization');
    if (factory) {
      // Record the target section so it round-trips to the editor via the
      // container's getStateTransferContainerInfoData() (containerInfo.containerData)
      // and the returning panel is claimed back into this section.
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
    // Auto-revert to GridLayout when the last section is deleted.
    const layout: DashboardLayout = items.length
      ? { type: 'SectionLayout', items }
      : { type: 'GridLayout', items: [] };
    this.props.container.updateInput({ panels, layout });
  };

  /**
   * Ungroup ALL sections: flatten every section back into a single grid. Each
   * member's section-relative coordinates are stacked top-to-bottom into
   * absolute panel gridData, then the layout reverts to GridLayout. Offered on
   * every section's kebab (it's a dashboard-wide action); guarded by a confirm
   * modal since it discards the section structure. (Previously lived in the
   * top-nav add-panel popover.)
   */
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
    // Every section member re-parents from its section grid back to the flat
    // grid (a component swap), so recreate them via the container's natural
    // remove/add lifecycle. Revert to GridLayout (empty items); on save this
    // normalizes to no layoutJSON at all (see update_saved_dashboard).
    const reparentedIds = [...getClaimedMemberIds(items)];
    this.props.container.reparentPanels(reparentedIds, { type: 'GridLayout', items: [] }, panels);
  };

  /** Resolve a section's members to { panel, member } pairs, skipping stale refs. */
  private resolveMembers = (section: SectionLayout) => {
    const { panels } = this.state;
    return section.members
      .map((member) => ({ panel: panels[member.idRef], member }))
      .filter((entry) => Boolean(entry.panel));
  };

  private renderSectionKebab = (section: SectionLayout) => {
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
        icon="plusInCircle"
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
          defaultMessage: 'Add existing visualization',
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
   * Trailing read-only "Ungrouped" virtual section. It is NEVER stored in
   * layoutJSON -- it is computed each render from the panels that no explicit
   * section claims (see computeUnclaimedPanels). This keeps the render
   * invariant `rendered = section members + unclaimed panels`, so panels added
   * by callers that only write panelsJSON (Explore / agent_traces
   * "add to dashboard", incoming "Save and return", top-nav "Create new" /
   * "Add from library") still appear instead of vanishing. Rendered read-only
   * (no drag/resize, no layout write-back) with no chevron/kebab; per-panel
   * "Move to section" promotes a panel into a real section. Only shown while at
   * least one explicit section exists (zero sections === GridLayout).
   */
  private renderVirtualSection() {
    const { container, PanelComponent } = this.props;
    const { useMargins, expandedPanelId } = this.state;
    const unclaimed = computeUnclaimedPanels(this.getSections(), this.state.panels);
    if (unclaimed.length === 0) return null;

    // Flow the unclaimed panels by their array order (using each panel's own
    // w/h), ignoring their stored x/y -- see computeUngroupedLayout.
    const members = computeUngroupedLayout(unclaimed).map((member) => ({
      panel: this.state.panels[member.idRef],
      member,
    }));
    const containsExpanded =
      expandedPanelId !== undefined &&
      unclaimed.some((panel) => panel.explicitInput.id === expandedPanelId);
    // Hide this group only when a panel in ANOTHER section is maximized; when one
    // of our own panels is maximized, keep it visible (its grid maximizes it).
    const hide = expandedPanelId !== undefined && !containsExpanded;

    const sectionClasses = classNames(
      'dshSectionLayout__section',
      'dshSectionLayout__section--virtual',
      {
        'dshSectionLayout__section--hidden': hide,
        // When one of our own panels is maximized, break out to fill the
        // viewport just like a real section (otherwise the inner grid's
        // height:100% collapses to 0 -- same fix as real sections).
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
          isViewMode // read-only: no drag/resize; layout is never written back
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

    // Two-level maximize: when a member is maximized, hide every OTHER section
    // (the owning section's inner grid expands that member and hides siblings).
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
              // The section that owns the maximized member breaks out to fill
              // the dashboard viewport (see SCSS) so the member maximizes like
              // the classic grid rather than being clipped to the section box.
              const ownsMaximized = expandedPanelId !== undefined && section.id === owningSectionId;
              const sectionClasses = classNames('dshSectionLayout__section', {
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
                      <div className="dshSectionLayout__sectionHeader">
                        {!isViewMode && (
                          // Drag handle: only this initiates a section reorder, so
                          // dragging panels inside the section's grid is unaffected.
                          <div
                            className="dshSectionLayout__dragHandle"
                            data-test-subj={`dashboardSectionDragHandle-${section.id}`}
                            aria-label={i18n.translate('dashboard.section.dragToReorder', {
                              defaultMessage: 'Drag to reorder section {name}',
                              values: { name: section.name },
                            })}
                            {...provided.dragHandleProps}
                          >
                            <EuiIcon type="grab" size="m" color="subdued" />
                          </div>
                        )}
                        <EuiButtonIcon
                          iconType={section.collapsed ? 'arrowRight' : 'arrowDown'}
                          color="text"
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
                        hideCollapsedHint
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
