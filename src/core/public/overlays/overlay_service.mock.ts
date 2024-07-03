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

import type { PublicMethodsOf } from '@osd/utility-types';
import { OverlayService, OverlayStart } from './overlay_service';
import { overlayBannersServiceMock } from './banners/banners_service.mock';
import { overlayFlyoutServiceMock } from './flyout/flyout_service.mock';
import { overlayModalServiceMock } from './modal/modal_service.mock';
import { overlaySidecarServiceMock } from './sidecar/sidecar_service.mock';

const createStartContractMock = () => {
  const overlayModalStart = overlayModalServiceMock.createStartContract();
  const overlayFlyoutStart = overlayFlyoutServiceMock.createStartContract();
  const startContract: DeeplyMockedKeys<OverlayStart> = {
    openFlyout: overlayFlyoutStart.open,
    closeFlyout: overlayFlyoutStart.close,
    openModal: overlayModalStart.open,
    openConfirm: overlayModalStart.openConfirm,
    banners: overlayBannersServiceMock.createStartContract(),
    sidecar: overlaySidecarServiceMock.createStartContract(),
  };
  return startContract;
};

const createMock = () => {
  const mocked: jest.Mocked<PublicMethodsOf<OverlayService>> = {
    start: jest.fn(),
  };
  mocked.start.mockReturnValue(createStartContractMock());
  return mocked;
};

export const overlayServiceMock = {
  create: createMock,
  createStartContract: createStartContractMock,
};
