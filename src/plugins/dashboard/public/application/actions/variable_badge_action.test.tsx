/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isErrorEmbeddable, ErrorEmbeddable, IContainer } from '../../../../embeddable/public';
import {
  CONTACT_CARD_EMBEDDABLE,
  ContactCardEmbeddableFactory,
  ContactCardEmbeddable,
  ContactCardEmbeddableInput,
  ContactCardEmbeddableOutput,
} from '../../../../embeddable/public/lib/test_samples';
import { embeddablePluginMock } from '../../../../embeddable/public/mocks';
import { DashboardContainer } from '../embeddable';
import { getSampleDashboardInput } from '../test_helpers';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart } from 'opensearch-dashboards/public';
import { VariableBadgeAction } from './variable_badge_action';
import { panelBadgeTrigger } from '../../../../embeddable/public';

const { setup, doStart } = embeddablePluginMock.createInstance();
setup.registerEmbeddableFactory(
  CONTACT_CARD_EMBEDDABLE,
  new ContactCardEmbeddableFactory((() => null) as any, {} as any)
);
const start = doStart();

let container: DashboardContainer;
let embeddable: ContactCardEmbeddable;
let coreStart: CoreStart;

beforeEach(async () => {
  coreStart = coreMock.createStart();

  const containerOptions = {
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

  container = new DashboardContainer(getSampleDashboardInput(), containerOptions);

  const contactCardEmbeddable = await container.addNewEmbeddable<
    ContactCardEmbeddableInput,
    ContactCardEmbeddableOutput,
    ContactCardEmbeddable
  >(CONTACT_CARD_EMBEDDABLE, {
    firstName: 'opensearchDashboards',
  });

  if (isErrorEmbeddable(contactCardEmbeddable)) {
    throw new Error('Failed to create embeddable');
  }
  embeddable = contactCardEmbeddable;
});

describe('VariableBadgeAction', () => {
  test('is incompatible with Error Embeddables', async () => {
    const action = new VariableBadgeAction();
    const errorEmbeddable = new ErrorEmbeddable(
      'Error',
      { id: '404' },
      embeddable.getRoot() as IContainer
    );
    expect(
      await action.isCompatible({ embeddable: errorEmbeddable, trigger: panelBadgeTrigger })
    ).toBe(false);
  });

  test('is incompatible when embeddable has no query', async () => {
    const action = new VariableBadgeAction();
    expect(await action.isCompatible({ embeddable, trigger: panelBadgeTrigger })).toBe(false);
  });

  test('is incompatible when query has no variables', async () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      getInput: () => ({
        query: {
          query: 'source=logs | fields host, message',
          language: 'PPL',
        },
      }),
    };
    expect(
      await action.isCompatible({
        embeddable: embeddableWithQuery as any,
        trigger: panelBadgeTrigger,
      })
    ).toBe(false);
  });

  test('is compatible when embeddable has query with ${varName} syntax', async () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      getInput: () => ({
        query: {
          query: 'source=logs | where region=${region}',
          language: 'PPL',
        },
      }),
    };
    expect(
      await action.isCompatible({
        embeddable: embeddableWithQuery as any,
        trigger: panelBadgeTrigger,
      })
    ).toBe(true);
  });

  test('is compatible when embeddable has query with $varName syntax', async () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      getInput: () => ({
        query: {
          query: 'source=logs | where region=$region',
          language: 'PPL',
        },
      }),
    };
    expect(
      await action.isCompatible({
        embeddable: embeddableWithQuery as any,
        trigger: panelBadgeTrigger,
      })
    ).toBe(true);
  });

  test('is compatible when embeddable has originalQuery with variables', async () => {
    const action = new VariableBadgeAction();
    const embeddableWithOriginalQuery = {
      ...embeddable,
      originalQuery: 'source=logs | where host=$host and region=${region}',
    };
    expect(
      await action.isCompatible({
        embeddable: embeddableWithOriginalQuery as any,
        trigger: panelBadgeTrigger,
      })
    ).toBe(true);
  });

  test('getDisplayName returns comma-separated variable names', () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      getInput: () => ({
        query: {
          query: 'source=logs | where region=$region and host=${host}',
          language: 'PPL',
        },
      }),
    };
    const displayName = action.getDisplayName({
      embeddable: embeddableWithQuery as any,
      trigger: panelBadgeTrigger,
    });
    expect(displayName).toBe('region, host');
  });

  test('getDisplayName returns empty string when no variables', () => {
    const action = new VariableBadgeAction();
    const displayName = action.getDisplayName({
      embeddable,
      trigger: panelBadgeTrigger,
    });
    expect(displayName).toBe('');
  });

  test('getIconType returns bolt icon', () => {
    const action = new VariableBadgeAction();
    const iconType = action.getIconType({
      embeddable,
      trigger: panelBadgeTrigger,
    });
    expect(iconType).toBe('bolt');
  });

  test('execute does not throw when compatible', async () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      originalQuery: 'source=logs | where host=$host',
      getInput: () => embeddable.getInput(),
    };
    await expect(
      action.execute({
        embeddable: embeddableWithQuery as any,
        trigger: panelBadgeTrigger,
      })
    ).resolves.toBeUndefined();
  });

  test('execute throws IncompatibleActionError when incompatible', async () => {
    const action = new VariableBadgeAction();
    await expect(
      action.execute({
        embeddable,
        trigger: panelBadgeTrigger,
      })
    ).rejects.toThrow('Action is incompatible');
  });

  test('extracts multiple variables correctly', () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      originalQuery: 'source=logs | where host=$host and region=${region} and env=$environment',
    };
    const displayName = action.getDisplayName({
      embeddable: embeddableWithQuery as any,
      trigger: panelBadgeTrigger,
    });
    expect(displayName).toContain('host');
    expect(displayName).toContain('region');
    expect(displayName).toContain('environment');
  });

  test('handles duplicate variable references', () => {
    const action = new VariableBadgeAction();
    const embeddableWithQuery = {
      ...embeddable,
      originalQuery: 'source=logs | where host=$host or hostname=$host',
    };
    const displayName = action.getDisplayName({
      embeddable: embeddableWithQuery as any,
      trigger: panelBadgeTrigger,
    });
    // Should only show 'host' once
    expect(displayName).toBe('host');
  });

  test('MenuItem component exists', () => {
    const action = new VariableBadgeAction();
    expect(action.MenuItem).toBeDefined();
  });
});
