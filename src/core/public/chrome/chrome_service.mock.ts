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

import { BehaviorSubject } from 'rxjs';
import type { PublicMethodsOf } from '@osd/utility-types';
import { ChromeBadge, ChromeBreadcrumb, ChromeService, InternalChromeStart } from './';
import { getLogosMock } from '../../common/mocks';

const createSetupContractMock = () => {
  return {
    registerCollapsibleNavHeader: jest.fn(),
    navGroup: {
      addNavLinksToGroup: jest.fn(),
      getNavGroupEnabled: jest.fn(),
      registerNavGroupUpdater: jest.fn(),
    },
    globalSearch: {
      registerSearchCommand: jest.fn(),
    },
  };
};

const createStartContractMock = () => {
  const startContract: DeeplyMockedKeys<InternalChromeStart> = {
    getHeaderComponent: jest.fn(),
    navLinks: {
      getNavLinks$: jest.fn(),
      has: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      showOnly: jest.fn(),
      update: jest.fn(),
      enableForcedAppSwitcherNavigation: jest.fn(),
      getForceAppSwitcherNavigation$: jest.fn(),
    },
    recentlyAccessed: {
      add: jest.fn(),
      get: jest.fn(),
      get$: jest.fn(),
    },
    docTitle: {
      change: jest.fn(),
      reset: jest.fn(),
    },
    logos: getLogosMock.default,
    navControls: {
      registerLeft: jest.fn(),
      registerCenter: jest.fn(),
      registerRight: jest.fn(),
      registerLeftBottom: jest.fn(),
      registerPrimaryHeaderRight: jest.fn(),
      getLeft$: jest.fn(),
      getCenter$: jest.fn(),
      getRight$: jest.fn(),
      getLeftBottom$: jest.fn(),
      getPrimaryHeaderRight$: jest.fn(),
    },
    navGroup: {
      getNavGroupsMap$: jest.fn(() => new BehaviorSubject({})),
      getNavGroupEnabled: jest.fn(),
      getCurrentNavGroup$: jest.fn(() => new BehaviorSubject(undefined)),
      setCurrentNavGroup: jest.fn(),
    },
    globalSearch: {
      getAllSearchCommands: jest.fn(() => []),
      unregisterSearchCommand: jest.fn(),
    },
    setAppTitle: jest.fn(),
    setIsVisible: jest.fn(),
    getIsVisible$: jest.fn(),
    setHeaderVariant: jest.fn(),
    getHeaderVariant$: jest.fn(),
    addApplicationClass: jest.fn(),
    removeApplicationClass: jest.fn(),
    getApplicationClasses$: jest.fn(),
    getBadge$: jest.fn(),
    setBadge: jest.fn(),
    getBreadcrumbs$: jest.fn(),
    setBreadcrumbs: jest.fn(),
    getBreadcrumbsEnricher$: jest.fn(),
    setBreadcrumbsEnricher: jest.fn(),
    getHelpExtension$: jest.fn(),
    setHelpExtension: jest.fn(),
    setHelpSupportUrl: jest.fn(),
    getIsNavDrawerLocked$: jest.fn(),
    getCustomNavLink$: jest.fn(),
    setCustomNavLink: jest.fn(),
  };
  startContract.navLinks.getAll.mockReturnValue([]);
  startContract.getIsVisible$.mockReturnValue(new BehaviorSubject(false));
  startContract.getHeaderVariant$.mockReturnValue(new BehaviorSubject(undefined));
  startContract.getApplicationClasses$.mockReturnValue(new BehaviorSubject(['class-name']));
  startContract.getBadge$.mockReturnValue(new BehaviorSubject({} as ChromeBadge));
  startContract.getBreadcrumbs$.mockReturnValue(new BehaviorSubject([{} as ChromeBreadcrumb]));
  startContract.getCustomNavLink$.mockReturnValue(new BehaviorSubject(undefined));
  startContract.getHelpExtension$.mockReturnValue(new BehaviorSubject(undefined));
  startContract.getIsNavDrawerLocked$.mockReturnValue(new BehaviorSubject(false));
  return startContract;
};

type ChromeServiceContract = PublicMethodsOf<ChromeService>;
const createMock = () => {
  const mocked: jest.Mocked<ChromeServiceContract> = {
    setup: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  };
  mocked.start.mockResolvedValue(createStartContractMock());
  return mocked;
};

export const chromeServiceMock = {
  create: createMock,
  createStartContract: createStartContractMock,
  createSetupContract: createSetupContractMock,
};
