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

// Tests for openAddPanelToSectionFlyout and the internal AddPanelToSectionFlyout
// component. The component is not exported, so we capture the React element
// passed to overlays.openFlyout via a toMountPoint identity mock and enzyme-mount
// it directly.

import React from 'react';
import { mount } from 'enzyme';

jest.mock('../../../../opensearch_dashboards_react/public', () => {
  const actual = jest.requireActual('../../../../opensearch_dashboards_react/public');
  return {
    ...actual,
    toMountPoint: (el: any) => el,
  };
});

import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardContainer } from '../embeddable';
import { getSampleDashboardInput } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { openAddPanelToSectionFlyout } from './add_panel_to_section_flyout';

const { setup, doStart } = embeddablePluginMock.createInstance();
setup.registerEmbeddableFactory(
  CONTACT_CARD_EMBEDDABLE,
  new ContactCardEmbeddableFactory((() => null) as any, {} as any)
);
const start = doStart();

let container: DashboardContainer;
let coreStart: CoreStart;

const sectionLayout = {
  type: 'SectionLayout' as const,
  items: [{ id: 's1', type: 'section' as const, name: 'Section 1', collapsed: false, members: [] }],
};

function buildContainerOptions(core: CoreStart) {
  return {
    ExitFullScreenButton: () => null,
    SavedObjectFinder: () => null,
    application: {} as any,
    embeddable: start,
    chrome: {} as any,
    inspector: {} as any,
    notifications: core.notifications,
    overlays: core.overlays,
    savedObjectMetaData: {} as any,
    uiActions: {} as any,
  };
}

beforeEach(async () => {
  coreStart = coreMock.createStart();
  const input = getSampleDashboardInput({ panels: {}, layout: sectionLayout } as any);
  container = new DashboardContainer(input, buildContainerOptions(coreStart));
});

// ---------------------------------------------------------------------------
// (A) openAddPanelToSectionFlyout itself
// ---------------------------------------------------------------------------

describe('openAddPanelToSectionFlyout', () => {
  test('calls overlays.openFlyout once with the correct options', () => {
    const openFlyout = jest.fn().mockReturnValue({ close: jest.fn() });
    const overlays = { ...coreStart.overlays, openFlyout } as any;

    openAddPanelToSectionFlyout({
      overlays,
      notifications: coreStart.notifications,
      container,
      sectionId: 's1',
      savedObjectFinder: () => null,
      getEmbeddableFactories: jest.fn().mockReturnValue([]),
    });

    expect(openFlyout).toHaveBeenCalledTimes(1);
    // First arg: React element (truthy)
    expect(openFlyout.mock.calls[0][0]).toBeTruthy();
    // Second arg: flyout options
    expect(openFlyout.mock.calls[0][1]).toEqual({
      'data-test-subj': 'dashboardAddPanelToSection',
      ownFocus: true,
    });
  });
});

// ---------------------------------------------------------------------------
// (B) Internal AddPanelToSectionFlyout component (captured via identity mount)
// ---------------------------------------------------------------------------

describe('AddPanelToSectionFlyout (internal component)', () => {
  let capturedElement: React.ReactElement;
  let closeFn: jest.Mock;

  // Stub SavedObjectFinder: renders a button that fires onChoose when clicked.
  const StubSavedObjectFinder: React.FC<{
    onChoose: (id: string, type: string, name: string) => void;
    savedObjectMetaData: any[];
    [k: string]: any;
  }> = (props) => (
    <button
      data-test-subj="stubChoose"
      onClick={() => props.onChoose('so-id-1', CONTACT_CARD_EMBEDDABLE, 'My Saved Viz')}
    />
  );

  // Factory combos for testing the metadata filter:
  // Only factories with savedObjectMetaData truthy AND isContainerType falsy pass.
  const factoryWithMeta = {
    savedObjectMetaData: { name: 'Contact Card', type: CONTACT_CARD_EMBEDDABLE },
    isContainerType: false,
  };
  const factoryContainerType = {
    savedObjectMetaData: { name: 'Container', type: 'container_type' },
    isContainerType: true,
  };
  const factoryNoMeta = {
    savedObjectMetaData: null,
    isContainerType: false,
  };

  beforeEach(() => {
    closeFn = jest.fn();
    const openFlyout = jest.fn().mockReturnValue({ close: closeFn });
    const overlays = { ...coreStart.overlays, openFlyout } as any;

    openAddPanelToSectionFlyout({
      overlays,
      notifications: coreStart.notifications,
      container,
      sectionId: 's1',
      savedObjectFinder: StubSavedObjectFinder as any,
      getEmbeddableFactories: jest
        .fn()
        .mockReturnValue([factoryWithMeta, factoryContainerType, factoryNoMeta]),
    });

    // toMountPoint is identity, so first arg IS the React element.
    capturedElement = openFlyout.mock.calls[0][0];
  });

  test('renders the header title "Add panel to section"', () => {
    const wrapper = mount(capturedElement);
    const title = wrapper.find('h2');
    expect(title.text()).toBe('Add panel to section');
  });

  test('filters savedObjectMetaData correctly (truthy meta + not container)', () => {
    const wrapper = mount(capturedElement);
    const finderProps = wrapper.find(StubSavedObjectFinder).props();
    // Only factoryWithMeta should pass the filter.
    expect(finderProps.savedObjectMetaData).toHaveLength(1);
    expect(finderProps.savedObjectMetaData[0]).toEqual(factoryWithMeta.savedObjectMetaData);
  });

  test('choosing a panel adds it to the container and claims into section, shows toast, closes', async () => {
    const wrapper = mount(capturedElement);

    // Click the stub button to trigger onChoose.
    wrapper.find('[data-test-subj="stubChoose"]').simulate('click');

    // addNewEmbeddable is async; wait for it to settle.
    await new Promise((r) => setTimeout(r, 50));
    wrapper.update();

    // The new panel should exist in the container.
    const panels = container.getInput().panels;
    const panelIds = Object.keys(panels);
    expect(panelIds.length).toBeGreaterThanOrEqual(1);

    // Find the newly added panel (type === CONTACT_CARD_EMBEDDABLE with savedObjectId).
    const addedPanel = Object.values(panels).find(
      (p: any) => p.explicitInput?.savedObjectId === 'so-id-1'
    );
    expect(addedPanel).toBeDefined();

    // The panel should be claimed into section s1.
    const layout = container.getInput().layout as any;
    expect(layout.type).toBe('SectionLayout');
    const section = layout.items.find((item: any) => item.id === 's1');
    expect(section).toBeDefined();
    const memberRefs = section.members.map((m: any) => m.idRef);
    expect(memberRefs).toContain(addedPanel!.explicitInput.id);

    // Toast should have been shown.
    expect(coreStart.notifications.toasts.addSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        'data-test-subj': 'addObjectToSectionSuccess',
      })
    );

    // onClose should have been called (which calls flyoutSession.close()).
    expect(closeFn).toHaveBeenCalled();
  });
});
