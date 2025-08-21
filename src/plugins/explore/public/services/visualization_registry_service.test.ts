/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistryService } from './visualization_registry_service';
import { VisualizationRegistry } from '../components/visualizations/visualization_registry';
import { VisualizationRule } from '../components/visualizations/types';

describe('VisualizationRegistryService', () => {
  let service: VisualizationRegistryService;
  let mockRegisterRule: jest.Mock;
  let mockRegisterRules: jest.Mock;
  let mockGetRules: jest.Mock;

  beforeEach(() => {
    // Create mock functions
    mockRegisterRule = jest.fn();
    mockRegisterRules = jest.fn();
    mockGetRules = jest.fn().mockReturnValue([]);

    // Mock the VisualizationRegistry constructor and its methods
    jest
      .spyOn(VisualizationRegistry.prototype, 'registerRule')
      .mockImplementation(mockRegisterRule);
    jest
      .spyOn(VisualizationRegistry.prototype, 'registerRules')
      .mockImplementation(mockRegisterRules);
    jest.spyOn(VisualizationRegistry.prototype, 'getRules').mockImplementation(mockGetRules);

    // Create a new instance of the service
    service = new VisualizationRegistryService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a new VisualizationRegistry instance', () => {
      // Instead of checking if the constructor was called, we verify that
      // the service has a registry property that is an instance of VisualizationRegistry
      const registry = service.getRegistry();
      expect(registry).toBeInstanceOf(VisualizationRegistry);
    });
  });

  describe('setup', () => {
    it('should return an object with registerRule and registerRules methods', () => {
      const setup = service.setup();

      expect(setup).toHaveProperty('registerRule');
      expect(setup).toHaveProperty('registerRules');
      expect(typeof setup.registerRule).toBe('function');
      expect(typeof setup.registerRules).toBe('function');
    });

    it('should delegate registerRule to the registry', () => {
      const setup = service.setup();
      const mockRule: VisualizationRule = {
        id: 'test-rule',
        name: 'Test Rule',
        matches: jest.fn(),
        chartTypes: [],
      };

      setup.registerRule(mockRule);

      expect(mockRegisterRule).toHaveBeenCalledTimes(1);
      expect(mockRegisterRule).toHaveBeenCalledWith(mockRule);
    });

    it('should delegate registerRules to the registry', () => {
      const setup = service.setup();
      const mockRules: VisualizationRule[] = [
        {
          id: 'test-rule-1',
          name: 'Test Rule 1',
          matches: jest.fn(),
          chartTypes: [],
        },
        {
          id: 'test-rule-2',
          name: 'Test Rule 2',
          matches: jest.fn(),
          chartTypes: [],
        },
      ];

      setup.registerRules(mockRules);

      expect(mockRegisterRules).toHaveBeenCalledTimes(1);
      expect(mockRegisterRules).toHaveBeenCalledWith(mockRules);
    });
  });

  describe('start', () => {
    it('should return an object with registerRule, registerRules, and getRules methods', () => {
      const start = service.start();

      expect(start).toHaveProperty('registerRule');
      expect(start).toHaveProperty('registerRules');
      expect(start).toHaveProperty('getRules');
      expect(typeof start.registerRule).toBe('function');
      expect(typeof start.registerRules).toBe('function');
      expect(typeof start.getRules).toBe('function');
    });

    it('should delegate registerRule to the registry', () => {
      const start = service.start();
      const mockRule: VisualizationRule = {
        id: 'test-rule',
        name: 'Test Rule',
        matches: jest.fn(),
        chartTypes: [],
      };

      start.registerRule(mockRule);

      expect(mockRegisterRule).toHaveBeenCalledTimes(1);
      expect(mockRegisterRule).toHaveBeenCalledWith(mockRule);
    });

    it('should delegate registerRules to the registry', () => {
      const start = service.start();
      const mockRules: VisualizationRule[] = [
        {
          id: 'test-rule-1',
          name: 'Test Rule 1',
          matches: jest.fn(),
          chartTypes: [],
        },
        {
          id: 'test-rule-2',
          name: 'Test Rule 2',
          matches: jest.fn(),
          chartTypes: [],
        },
      ];

      start.registerRules(mockRules);

      expect(mockRegisterRules).toHaveBeenCalledTimes(1);
      expect(mockRegisterRules).toHaveBeenCalledWith(mockRules);
    });

    it('should delegate getRules to the registry', () => {
      const start = service.start();
      const mockRules: VisualizationRule[] = [
        {
          id: 'test-rule-1',
          name: 'Test Rule 1',
          matches: jest.fn(),
          chartTypes: [],
        },
      ];

      // Setup the mock to return specific rules
      mockGetRules.mockReturnValueOnce(mockRules);

      const result = start.getRules();

      expect(mockGetRules).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRules);
    });
  });

  describe('getRegistry', () => {
    it('should return a visualization registry instance', () => {
      const registry = service.getRegistry();

      expect(registry).toBeInstanceOf(VisualizationRegistry);
    });
  });
});
