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

import { TelemetryServiceSetup, TelemetryServiceStart, PluginTelemetryRecorder } from './types';

const createPluginRecorderMock = (): jest.Mocked<PluginTelemetryRecorder> => ({
  recordEvent: jest.fn(),
  recordMetric: jest.fn(),
  recordError: jest.fn(),
});

const createSetupContractMock = (): jest.Mocked<TelemetryServiceSetup> => ({
  registerProvider: jest.fn(),
});

const createStartContractMock = (): jest.Mocked<TelemetryServiceStart> => ({
  isEnabled: jest.fn().mockReturnValue(false),
  getPluginRecorder: jest.fn().mockReturnValue(createPluginRecorderMock()),
});

export const coreTelemetryServiceMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
  createPluginRecorder: createPluginRecorderMock,
};
