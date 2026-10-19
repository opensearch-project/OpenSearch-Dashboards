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

import { isEqual } from 'lodash';
import {
  convertSavedDashboardPanelToPanelState,
  convertPanelStateToSavedDashboardPanel,
  normalizeSavedDashboardPanel,
} from './embeddable_saved_object_converters';
import { SavedDashboardPanel } from '../../types';
import { DashboardPanelState } from '../embeddable';
import { EmbeddableInput } from '../../../../embeddable/public';

test('convertSavedDashboardPanelToPanelState', () => {
  const savedDashboardPanel: SavedDashboardPanel = {
    type: 'search',
    embeddableConfig: {
      something: 'hi!',
    },
    id: 'savedObjectId',
    panelIndex: '123',
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    version: '7.0.0',
  };

  expect(convertSavedDashboardPanelToPanelState(savedDashboardPanel)).toEqual({
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    explicitInput: {
      something: 'hi!',
      id: '123',
      savedObjectId: 'savedObjectId',
    },
    type: 'search',
  });
});

test('convertSavedDashboardPanelToPanelState does not include undefined id', () => {
  const savedDashboardPanel: SavedDashboardPanel = {
    type: 'search',
    embeddableConfig: {
      something: 'hi!',
    },
    panelIndex: '123',
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    version: '7.0.0',
  };

  const converted = convertSavedDashboardPanelToPanelState(savedDashboardPanel);
  expect(converted.hasOwnProperty('savedObjectId')).toBe(false);
});

test('convertPanelStateToSavedDashboardPanel', () => {
  const dashboardPanel: DashboardPanelState = {
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    explicitInput: {
      something: 'hi!',
      id: '123',
      savedObjectId: 'savedObjectId',
    } as EmbeddableInput,
    type: 'search',
  };

  expect(convertPanelStateToSavedDashboardPanel(dashboardPanel, '6.3.0')).toEqual({
    type: 'search',
    embeddableConfig: {
      something: 'hi!',
    },
    id: 'savedObjectId',
    panelIndex: '123',
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    version: '6.3.0',
  });
});

test('convertPanelStateToSavedDashboardPanel will not add an undefined id when not needed', () => {
  const dashboardPanel: DashboardPanelState = {
    gridData: {
      x: 0,
      y: 0,
      h: 15,
      w: 15,
      i: '123',
    },
    explicitInput: {
      id: '123',
      something: 'hi!',
    } as EmbeddableInput,
    type: 'search',
  };

  const converted = convertPanelStateToSavedDashboardPanel(dashboardPanel, '8.0.0');
  expect(converted.hasOwnProperty('id')).toBe(false);
});

test('normalizeSavedDashboardPanel fills in a missing embeddableConfig only', () => {
  const panel = {
    type: 'explore',
    id: 'abc',
    panelIndex: '1',
    gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
    version: '3.0.0',
  } as any;
  // A panel another app saved without one matches what the dashboard writes for it.
  expect(normalizeSavedDashboardPanel(panel)).toEqual({ ...panel, embeddableConfig: {} });
  const withConfig = { ...panel, embeddableConfig: { title: 'x' } };
  expect(normalizeSavedDashboardPanel(withConfig)).toBe(withConfig);
  expect(normalizeSavedDashboardPanel(undefined)).toBeUndefined();
});

test('a panel saved without embeddableConfig reads as unchanged after a load, as the dashboard checks it', () => {
  // What Explore's "Save and Add to Dashboard" used to save.
  const saved = {
    version: '3.0.0',
    id: 'abc',
    type: 'explore',
    panelIndex: '1',
    gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
  } as any;
  const roundTripped = convertPanelStateToSavedDashboardPanel(
    convertSavedDashboardPanelToPanelState(saved),
    '3.0.0'
  );
  // The dashboard compares the panel it shows with the saved one; a plain compare flags it.
  expect(isEqual(roundTripped, saved)).toBe(false);
  expect(isEqual(roundTripped, normalizeSavedDashboardPanel(saved))).toBe(true);
});
