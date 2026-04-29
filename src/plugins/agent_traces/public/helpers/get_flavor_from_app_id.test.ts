/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { getFlavorFromAppId, getCurrentAppId, getCurrentFlavor } from './get_flavor_from_app_id';
import {
  AgentTracesFlavor,
  PLUGIN_ID,
  AGENT_TRACES_NAV_ID,
  AGENT_SPANS_NAV_ID,
} from '../../common';
import { AgentTracesServices } from '../types';

const createMockServices = (appId: string = PLUGIN_ID): AgentTracesServices =>
  ({
    core: {
      application: {
        currentAppId$: of(appId),
      },
    },
  } as AgentTracesServices);

describe('getFlavorFromAppId', () => {
  it('returns Traces for the base plugin ID', () => {
    expect(getFlavorFromAppId(PLUGIN_ID)).toBe(AgentTracesFlavor.Traces);
  });

  it('returns Traces for the agent traces nav ID', () => {
    expect(getFlavorFromAppId(AGENT_TRACES_NAV_ID)).toBe(AgentTracesFlavor.Traces);
  });

  it('returns Traces for the agent spans nav ID', () => {
    expect(getFlavorFromAppId(AGENT_SPANS_NAV_ID)).toBe(AgentTracesFlavor.Traces);
  });

  it('extracts flavor from slash-separated app ID', () => {
    expect(getFlavorFromAppId('agentTraces/traces')).toBe(AgentTracesFlavor.Traces);
  });

  it('returns null for undefined', () => {
    expect(getFlavorFromAppId(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getFlavorFromAppId('')).toBeNull();
  });

  it('returns null for unrecognized app ID without slash', () => {
    expect(getFlavorFromAppId('someOtherPlugin')).toBeNull();
  });

  it('extracts flavor substring for unknown slash app IDs', () => {
    expect(getFlavorFromAppId('other/flavor')).toBe('flavor');
  });

  it('returns null when slash suffix is empty', () => {
    expect(getFlavorFromAppId('agentTraces/')).toBeNull();
  });
});

describe('getCurrentAppId', () => {
  it('returns current app ID from services', async () => {
    const services = createMockServices();
    const appId = await getCurrentAppId(services);
    expect(appId).toBe(PLUGIN_ID);
  });
});

describe('getCurrentFlavor', () => {
  it('returns Traces flavor for the base plugin ID', async () => {
    const services = createMockServices(PLUGIN_ID);
    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBe(AgentTracesFlavor.Traces);
  });

  it('returns Traces flavor for agent spans nav ID', async () => {
    const services = createMockServices(AGENT_SPANS_NAV_ID);
    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBe(AgentTracesFlavor.Traces);
  });

  it('returns null for unrecognized app ID', async () => {
    const services = createMockServices('invalid');
    const flavor = await getCurrentFlavor(services);
    expect(flavor).toBeNull();
  });

  it('returns null for undefined app ID', async () => {
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
