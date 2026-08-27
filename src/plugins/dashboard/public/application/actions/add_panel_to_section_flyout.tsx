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

// Section support (Option 1): a dashboard-scoped "add existing panel to a
// section" flyout. The generic embeddable add-panel flyout adds panels at the
// top level with no section awareness, so this small flyout reuses the same
// SavedObjectFinder but, on choose, adds the embeddable and then relocates it
// INTO the target section (relocatePanelToSection edits the section's
// explicitInput.members). Modeled on ReplacePanelFlyout.

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFlyoutBody, EuiFlyoutHeader, EuiTitle } from '@elastic/eui';
import { NotificationsStart, OverlayStart, Toast } from 'src/core/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { DashboardContainer } from '../embeddable';
import { EmbeddableStart, SavedObjectEmbeddableInput } from '../../../../embeddable/public';
import { relocatePanelToSection } from './move_panel_to_section_action';

interface Props {
  container: DashboardContainer;
  sectionId: string;
  savedObjectsFinder: React.ComponentType<any>;
  onClose: () => void;
  notifications: NotificationsStart;
  getEmbeddableFactories: EmbeddableStart['getEmbeddableFactories'];
}

class AddPanelToSectionFlyout extends React.Component<Props> {
  private lastToast: Toast = { id: 'addPanelToSectionToast' };

  private showToast = (name: string) => {
    if (this.lastToast) {
      this.props.notifications.toasts.remove(this.lastToast);
    }
    this.lastToast = this.props.notifications.toasts.addSuccess({
      title: i18n.translate('dashboard.section.addPanel.addedToSectionSuccess', {
        defaultMessage: '{name} was added to the section',
        values: { name },
      }),
      'data-test-subj': 'addObjectToSectionSuccess',
    });
  };

  private onAddPanel = async (savedObjectId: string, type: string, name: string) => {
    const { container, sectionId } = this.props;
    // The new panel is created at the top level, then relocated into the
    // section (added to the section's explicitInput.members at an open
    // section-relative slot). Its own gridData stays its absolute home.
    const { id } = await container.addNewEmbeddable<SavedObjectEmbeddableInput>(type, {
      savedObjectId,
    });
    const newPanels = relocatePanelToSection(id, sectionId, container.getInput().panels);
    container.updateInput({ panels: newPanels });
    this.showToast(name);
    this.props.onClose();
  };

  public render() {
    const SavedObjectFinder = this.props.savedObjectsFinder;
    return (
      <>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>
              {i18n.translate('dashboard.section.addPanel.flyoutTitle', {
                defaultMessage: 'Add panel to section',
              })}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <SavedObjectFinder
            noItemsMessage={i18n.translate('dashboard.addPanel.noMatchingObjectsMessage', {
              defaultMessage: 'No matching objects found.',
            })}
            savedObjectMetaData={[...this.props.getEmbeddableFactories()]
              .filter(
                (embeddableFactory) =>
                  Boolean(embeddableFactory.savedObjectMetaData) &&
                  !embeddableFactory.isContainerType
              )
              .map(({ savedObjectMetaData }) => savedObjectMetaData as any)}
            showFilter={true}
            onChoose={this.onAddPanel}
          />
        </EuiFlyoutBody>
      </>
    );
  }
}

export function openAddPanelToSectionFlyout(options: {
  overlays: OverlayStart;
  notifications: NotificationsStart;
  container: DashboardContainer;
  sectionId: string;
  savedObjectFinder: React.ComponentType<any>;
  getEmbeddableFactories: EmbeddableStart['getEmbeddableFactories'];
}) {
  const {
    overlays,
    notifications,
    container,
    sectionId,
    savedObjectFinder,
    getEmbeddableFactories,
  } = options;
  const flyoutSession = overlays.openFlyout(
    toMountPoint(
      <AddPanelToSectionFlyout
        container={container}
        sectionId={sectionId}
        savedObjectsFinder={savedObjectFinder}
        notifications={notifications}
        getEmbeddableFactories={getEmbeddableFactories}
        onClose={() => flyoutSession.close()}
      />
    ),
    { 'data-test-subj': 'dashboardAddPanelToSection', ownFocus: true }
  );
}
