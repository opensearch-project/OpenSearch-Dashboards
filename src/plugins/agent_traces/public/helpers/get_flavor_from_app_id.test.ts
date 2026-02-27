/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { getFlavorFromAppId, getCurrentAppId, getCurrentFlavor } from './get_flavor_from_app_id';
import { AgentTracesFlavor } from '../../common';
import { AgentTracesServices } from '../types';

const createMockServices = (): AgentTracesServices =>
  ({
    core: {
      application: {
        currentAppId$: of('agentTraces/discover'),
      },
    },
  } as AgentTracesServices);

describe('getFlavorFromAppId', () => {
  it('should extract flavor from valid app ID', () => {
    expect(getFlavorFromAppId('agentTraces/discover')).toBe('discover');
    expect(getFlavorFromAppId('agentTraces/visualize')).toBe('visualize');
    expect(getFlavorFromAppId('agentTraces/dashboards')).toBe('dashboards');
  });

  it('should return null for invalid app ID formats', () => {
    expect(getFlavorFromAppId('invalid')).toBeNull();
    expect(getFlavorFromAppId('agentTraces')).toBe(AgentTracesFlavor.Traces);
    expect(getFlavorFromAppId('other/flavor')).toBe('flavor');
  });

  it('should return null for empty or undefined inputs', () => {
    expect(getFlavorFromAppId(undefined)).toBeNull();
    expect(getFlavorFromAppId('')).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(getFlavorFromAppId('agentTraces/')).toBeNull();
    expect(getFlavorFromAppId('agentTraces/flavor/extra')).toBe('flavor');
  });
});

describe('getCurrentAppId', () => {
  it('should return current app ID from services', async () => {
    const services = createMockServices();
    const appId = await getCurrentAppId(services);
    expect(appId).toBe('agentTraces/discover');
  });

  it('should handle different app IDs', async () => {
    const services = {
      core: {
        application: {
          currentAppId$: of('agentTraces/visualize'),
        },
      },
    } as AgentTracesServices;

    const appId = await getCurrentAppId(services);
    expect(appId).toBe('agentTraces/visualize');
  });
});

describe('getCurrentFlavor', () => {
  it('should return current flavor from app ID', async () => {
    const services = createMockServices();
    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBe('discover' as AgentTracesFlavor);
  });

  it('should return null for invalid app ID', async () => {
    const services = {
      core: {
        application: {
          currentAppId$: of('invalid'),
        },
      },
    } as AgentTracesServices;

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
    } as AgentTracesServices;

    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBeNull();
  });
});
