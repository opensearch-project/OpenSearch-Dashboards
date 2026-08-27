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

// Section support (Option 1): UngroupSectionAction removes a section (releasing
// its members to absolute space, same as "Delete from dashboard") behind a
// confirmation dialog.

import { ErrorEmbeddable, IContainer, ViewMode } from '../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddableInput,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardContainer, DashboardPanelState } from '../embeddable';
import { DASHBOARD_SECTION_EMBEDDABLE, SectionEmbeddable } from '../embeddable/section';
import { getSampleDashboardInput, getSampleDashboardPanel } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { UngroupSectionAction } from '.';

const { setup, doStart } = embeddablePluginMock.createInstance();
setup.registerEmbeddableFactory(
  CONTACT_CARD_EMBEDDABLE,
  new ContactCardEmbeddableFactory((() => null) as any, {} as any)
);
const start = doStart();

let container: DashboardContainer;
let coreStart: CoreStart;

beforeEach(() => {
  coreStart = coreMock.createStart();
  const options = {
    ExitFullScreenButton: () => null,
    SavedObjectFinder: () => null,
    application: {} as any,
    embeddable: start,
    chrome: {} as any,
    inspector: {} as any,
    notifications: {} as any,
    overlays: coreStart.overlays,
    savedObjectMetaData: {} as any,
    uiActions: {} as any,
  };
  const input = getSampleDashboardInput({
    panels: {
      '123': getSampleDashboardPanel<ContactCardEmbeddableInput>({
        explicitInput: { firstName: 'opensearchDashboards', id: '123' },
        type: CONTACT_CARD_EMBEDDABLE,
      }),
      section1: {
        gridData: { x: 0, y: 20, w: 48, h: 12, i: 'section1' },
        type: DASHBOARD_SECTION_EMBEDDABLE,
        explicitInput: {
          id: 'section1',
          title: 'Section 1',
          collapsed: false,
          // Section OWNS member '123' at section-relative (0,0).
          members: [{ id: '123', gridData: { x: 0, y: 0, w: 24, h: 8 } }],
        },
      } as unknown as DashboardPanelState,
    },
  });
  container = new DashboardContainer(input, options);
  container.updateInput({ viewMode: ViewMode.EDIT });
});

const makeSection = () =>
  new SectionEmbeddable(
    { id: 'section1', title: 'Section 1', collapsed: false, members: [] },
    container
  );

test('Ungroup section is incompatible with Error Embeddables', async () => {
  const action = new UngroupSectionAction(coreStart);
  const errorEmbeddable = new ErrorEmbeddable('an error', { id: '404' }, container as IContainer);
  expect(await action.isCompatible({ embeddable: errorEmbeddable })).toBe(false);
});

test('Ungroup section is compatible with a section panel in edit mode', async () => {
  const action = new UngroupSectionAction(coreStart);
  // container is in EDIT mode (beforeEach); the section inherits it.
  expect(await action.isCompatible({ embeddable: makeSection() })).toBe(true);
});

test('Ungroup section is NOT compatible with a section panel in view mode', async () => {
  const action = new UngroupSectionAction(coreStart);
  container.updateInput({ viewMode: ViewMode.VIEW });
  expect(await action.isCompatible({ embeddable: makeSection() })).toBe(false);
});

test('execute does nothing when the confirm dialog is cancelled', async () => {
  (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValue(false);
  const action = new UngroupSectionAction(coreStart);

  await action.execute({ embeddable: makeSection() });

  expect(coreStart.overlays.openConfirm).toHaveBeenCalledTimes(1);
  // Section still present, member untouched.
  expect(container.getInput().panels.section1).toBeDefined();
});

test('execute removes the section and releases its member to absolute space when confirmed', async () => {
  (coreStart.overlays.openConfirm as jest.Mock).mockResolvedValue(true);
  const action = new UngroupSectionAction(coreStart);

  await action.execute({ embeddable: makeSection() });

  const panels = container.getInput().panels;
  // Section gone.
  expect(panels.section1).toBeUndefined();
  // Member survives, repositioned to ABSOLUTE at the section's location:
  // sectionY(20) + SECTION_HEADER_ROWS(2) + memberY(0) = 22.
  expect(panels['123']).toBeDefined();
  expect(panels['123'].gridData).toMatchObject({ x: 0, y: 22, w: 24, h: 8 });
});
