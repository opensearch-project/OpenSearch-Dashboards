/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistryService } from './visualization_registry_service';
import { VisualizationRegistry } from '../components/visualizations/visualization_registry';
import { VisualizationType } from '../components/visualizations/utils/use_visualization_types';

describe('VisualizationRegistryService', () => {
  let service: VisualizationRegistryService;
  let mockRegisterVisualization: jest.SpyInstance;
  let mockGetVisualization: jest.SpyInstance;

  const createMockVisualization = (type: string): VisualizationType<any> =>
    (({
      type,
      name: `${type} chart`,
      getRules: jest.fn().mockReturnValue([]),
      ui: { style: { defaults: {}, render: jest.fn() } },
    } as unknown) as VisualizationType<any>);

  beforeEach(() => {
    mockRegisterVisualization = jest
      .spyOn(VisualizationRegistry.prototype, 'registerVisualization')
      .mockImplementation(jest.fn());
    mockGetVisualization = jest
      .spyOn(VisualizationRegistry.prototype, 'getVisualization')
      .mockImplementation(jest.fn());

    service = new VisualizationRegistryService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a service with a VisualizationRegistry instance', () => {
      const registry = service.getRegistry();
      expect(registry).toBeInstanceOf(VisualizationRegistry);
    });
  });

  describe('setup', () => {
    it('should return an object with registerVisualization method', () => {
      const setup = service.setup();

      expect(setup).toHaveProperty('registerVisualization');
      expect(typeof setup.registerVisualization).toBe('function');
    });

    it('should delegate registerVisualization to the registry', () => {
      const setup = service.setup();
      const mockVis = createMockVisualization('bar');

      setup.registerVisualization(mockVis);

      expect(mockRegisterVisualization).toHaveBeenCalledTimes(2);
      expect(mockRegisterVisualization).toHaveBeenCalledWith(mockVis);
    });

    it('should delegate registerVisualization with an array to the registry', () => {
      const setup = service.setup();
      const mockVisualizations = [createMockVisualization('bar'), createMockVisualization('line')];

      setup.registerVisualization(mockVisualizations);

      expect(mockRegisterVisualization).toHaveBeenCalledTimes(2);
      expect(mockRegisterVisualization).toHaveBeenCalledWith(mockVisualizations);
    });
  });

  describe('start', () => {
    it('should return an object with registerVisualization and getVisualization methods', () => {
      const start = service.start();

      expect(start).toHaveProperty('registerVisualization');
      expect(start).toHaveProperty('getVisualization');
      expect(typeof start.registerVisualization).toBe('function');
      expect(typeof start.getVisualization).toBe('function');
    });

    it('should delegate registerVisualization to the registry', () => {
      const start = service.start();
      const mockVis = createMockVisualization('pie');

      start.registerVisualization(mockVis);

      expect(mockRegisterVisualization).toHaveBeenCalledTimes(2);
      expect(mockRegisterVisualization).toHaveBeenCalledWith(mockVis);
    });

    it('should delegate getVisualization to the registry', () => {
      const start = service.start();
      const mockVis = createMockVisualization('scatter');
      mockGetVisualization.mockReturnValueOnce(mockVis);

      const result = start.getVisualization('scatter');

      expect(mockGetVisualization).toHaveBeenCalledTimes(1);
      expect(mockGetVisualization).toHaveBeenCalledWith('scatter');
      expect(result).toEqual(mockVis);
    });

    it('should return undefined for unregistered visualization type', () => {
      const start = service.start();
      mockGetVisualization.mockReturnValueOnce(undefined);

      const result = start.getVisualization('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getRegistry', () => {
    it('should return a VisualizationRegistry instance', () => {
      const registry = service.getRegistry();
      expect(registry).toBeInstanceOf(VisualizationRegistry);
    });
  });
});
