/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { getFlavorFromAppId, getCurrentAppId, getCurrentFlavor } from './get_flavor_from_app_id';
import { ExploreFlavor } from '../../common';
import { ExploreServices } from '../types';

const createMockServices = (): ExploreServices =>
  ({
    core: {
      application: {
        currentAppId$: of('explore/discover'),
      },
    },
  } as ExploreServices);

describe('getFlavorFromAppId', () => {
  it('should extract flavor from valid app ID', () => {
    expect(getFlavorFromAppId('explore/discover')).toBe('discover');
    expect(getFlavorFromAppId('explore/visualize')).toBe('visualize');
    expect(getFlavorFromAppId('explore/dashboards')).toBe('dashboards');
  });

  it('should return null for invalid app ID formats', () => {
    expect(getFlavorFromAppId('invalid')).toBeNull();
    expect(getFlavorFromAppId('explore')).toBeNull();
    expect(getFlavorFromAppId('other/flavor')).toBe('flavor');
  });

  it('should return null for empty or undefined inputs', () => {
    expect(getFlavorFromAppId(undefined)).toBeNull();
    expect(getFlavorFromAppId('')).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(getFlavorFromAppId('explore/')).toBeNull();
    expect(getFlavorFromAppId('explore/flavor/extra')).toBe('flavor');
  });
});

describe('getCurrentAppId', () => {
  it('should return current app ID from services', async () => {
    const services = createMockServices();
    const appId = await getCurrentAppId(services);
    expect(appId).toBe('explore/discover');
  });

  it('should handle different app IDs', async () => {
    const services = {
      core: {
        application: {
          currentAppId$: of('explore/visualize'),
        },
      },
    } as ExploreServices;

    const appId = await getCurrentAppId(services);
    expect(appId).toBe('explore/visualize');
  });
});

describe('getCurrentFlavor', () => {
  it('should return current flavor from app ID', async () => {
    const services = createMockServices();
    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBe('discover' as ExploreFlavor);
  });

  it('should return null for invalid app ID', async () => {
    const services = {
      core: {
        application: {
          currentAppId$: of('invalid'),
        },
      },
    } as ExploreServices;

    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBeNull();
  });

  it('should return null for undefined app ID', async () => {
    const services = {
      core: {
        application: {
          currentAppId$: of(undefined),
        },
      },
    } as ExploreServices;

    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBeNull();
  });
});
