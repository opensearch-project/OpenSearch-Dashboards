/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { EnvironmentService } from './environment';
import { MlCardState } from '../../types';

describe('EnvironmentService', () => {
  describe('setup', () => {
    test('allows multiple update calls', () => {
      const setup = new EnvironmentService().setup();
      expect(() => {
        setup.update({ ml: () => MlCardState.ENABLED });
      }).not.toThrow();
    });
  });

  describe('getEnvironment', () => {
    test('returns default values', () => {
      const service = new EnvironmentService();
      expect(service.getEnvironment().ml()).toEqual(MlCardState.DISABLED);
    });

    test('returns last state of update calls', () => {
      let cardState = MlCardState.DISABLED;
      const service = new EnvironmentService();
      const setup = service.setup();
      setup.update({ ml: () => cardState });
      expect(service.getEnvironment().ml()).toEqual(MlCardState.DISABLED);
      cardState = MlCardState.ENABLED;
      expect(service.getEnvironment().ml()).toEqual(MlCardState.ENABLED);
    });
  });
});
