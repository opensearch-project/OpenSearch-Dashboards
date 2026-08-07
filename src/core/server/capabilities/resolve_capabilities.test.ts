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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Capabilities } from './types';
import { resolveCapabilities } from './resolve_capabilities';
import { OpenSearchDashboardsRequest } from '../http';
import { httpServerMock } from '../http/http_server.mocks';

describe('resolveCapabilities', () => {
  let defaultCaps: Capabilities;
  let request: OpenSearchDashboardsRequest;

  beforeEach(() => {
    defaultCaps = {
      navLinks: {},
      catalogue: {},
      management: {},
      workspaces: {},
    };
    request = httpServerMock.createOpenSearchDashboardsRequest();
  });

  it('returns the initial capabilities if no switcher are used', async () => {
    const result = await resolveCapabilities(defaultCaps, [], request, []);
    expect(result).toEqual(defaultCaps);
  });

  it('applies the switcher to the capabilities ', async () => {
    const caps = {
      ...defaultCaps,
      catalogue: {
        A: true,
        B: true,
      },
    };
    const switcher = (req: OpenSearchDashboardsRequest, capabilities: Capabilities) => ({
      ...capabilities,
      catalogue: {
        ...capabilities.catalogue,
        A: false,
      },
    });
    const result = await resolveCapabilities(caps, [switcher], request, []);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "catalogue": Object {
          "A": false,
          "B": true,
        },
        "management": Object {},
        "navLinks": Object {},
        "workspaces": Object {},
      }
    `);
  });

  it('does not mutate the input capabilities', async () => {
    const caps = {
      ...defaultCaps,
      catalogue: {
        A: true,
        B: true,
      },
    };
    const switcher = (req: OpenSearchDashboardsRequest, capabilities: Capabilities) => ({
      ...capabilities,
      catalogue: {
        ...capabilities.catalogue,
        A: false,
      },
    });
    await resolveCapabilities(caps, [switcher], request, []);
    expect(caps.catalogue).toEqual({
      A: true,
      B: true,
    });
  });

  it('ignores any added capability from the switcher', async () => {
    const caps = {
      ...defaultCaps,
      catalogue: {
        A: true,
        B: true,
      },
    };
    const switcher = (req: OpenSearchDashboardsRequest, capabilities: Capabilities) => ({
      ...capabilities,
      catalogue: {
        ...capabilities.catalogue,
        C: false,
      },
    });
    const result = await resolveCapabilities(caps, [switcher], request, []);
    expect(result.catalogue).toEqual({
      A: true,
      B: true,
    });
  });

  it('ignores any removed capability from the switcher', async () => {
    const caps = {
      ...defaultCaps,
      catalogue: {
        A: true,
        B: true,
        C: true,
      },
    };
    const switcher = (req: OpenSearchDashboardsRequest, capabilities: Capabilities) => ({
      ...capabilities,
      catalogue: Object.entries(capabilities.catalogue)
        .filter(([key]) => key !== 'B')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    });
    const result = await resolveCapabilities(caps, [switcher], request, []);
    expect(result.catalogue).toEqual({
      A: true,
      B: true,
      C: true,
    });
  });

  it('ignores any capability type mutation from the switcher', async () => {
    const caps = {
      ...defaultCaps,
      section: {
        boolean: true,
        record: {
          entry: true,
        },
      },
    };
    const switcher = (req: OpenSearchDashboardsRequest, capabilities: Capabilities) => ({
      section: {
        boolean: {
          entry: false,
        },
        record: false,
      },
    });
    const result = await resolveCapabilities(caps, [switcher], request, []);
    expect(result.section).toEqual({
      boolean: true,
      record: {
        entry: true,
      },
    });
  });

  describe('applications merge into navLinks', () => {
    it('adds each application id to navLinks as true', async () => {
      const result = await resolveCapabilities(defaultCaps, [], request, ['app_a', 'app_b']);
      expect(result.navLinks).toEqual({
        app_a: true,
        app_b: true,
      });
    });

    it('preserves existing navLinks entries not listed in applications', async () => {
      const caps = {
        ...defaultCaps,
        navLinks: {
          existing_app: false,
        },
      };
      const result = await resolveCapabilities(caps, [], request, ['new_app']);
      expect(result.navLinks).toEqual({
        existing_app: false,
        new_app: true,
      });
    });

    it('overwrites an existing navLinks entry when the application id is listed', async () => {
      const caps = {
        ...defaultCaps,
        navLinks: {
          app_a: false,
        },
      };
      const result = await resolveCapabilities(caps, [], request, ['app_a']);
      expect(result.navLinks).toEqual({
        app_a: true,
      });
    });

    it('does not mutate the caller-provided navLinks when applications are supplied', async () => {
      const originalNavLinks = { existing: false };
      const caps = {
        ...defaultCaps,
        navLinks: originalNavLinks,
      };
      await resolveCapabilities(caps, [], request, ['app_a']);
      expect(originalNavLinks).toEqual({ existing: false });
    });

    it('is tolerant of an empty applications array', async () => {
      const caps = {
        ...defaultCaps,
        navLinks: { kept: true },
      };
      const result = await resolveCapabilities(caps, [], request, []);
      expect(result.navLinks).toEqual({ kept: true });
    });

    it('resolves in reasonable time for the maximum allowed input', async () => {
      const applications = Array.from({ length: 1000 }, (_, i) => `app_${i}`);
      const switchers = Array.from(
        { length: 10 },
        () => (_req: OpenSearchDashboardsRequest, caps: Capabilities) => caps
      );
      const start = Date.now();
      const result = await resolveCapabilities(defaultCaps, switchers, request, applications);
      expect(Date.now() - start).toBeLessThan(1000);
      expect(Object.keys(result.navLinks)).toHaveLength(1000);
    });
  });
});
