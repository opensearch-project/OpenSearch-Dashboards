/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const mockVisualizationBuilderInstance = {
  renderVisualization: jest.fn(),
  handleData: jest.fn(),
  init: jest.fn(),
};

jest.mock('../../../../explore/public', () => ({
  VisualizationBuilder: jest.fn(() => mockVisualizationBuilderInstance),
}));

const mockServices = {
  osdUrlStateStorage: { set: jest.fn(), get: jest.fn() },
  expressions: { run: jest.fn() },
};

jest.mock('../../services/services', () => ({
  getServices: jest.fn(() => mockServices),
}));

describe('getVisualizationBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the module-level singleton between tests
    jest.resetModules();
  });

  it('should create a new instance on first call', async () => {
    const { getVisualizationBuilder } = await import('./visualization_builder_singleton');
    const { VisualizationBuilder } = await import('../../../../explore/public');

    const builder = getVisualizationBuilder();

    expect(VisualizationBuilder).toHaveBeenCalledTimes(1);
    expect(builder).toBeDefined();
  });

  it('should return the same instance on subsequent calls', async () => {
    const { getVisualizationBuilder } = await import('./visualization_builder_singleton');

    const first = getVisualizationBuilder();
    const second = getVisualizationBuilder();

    expect(first).toBe(second);
  });

  it('should pass lazy service accessors to the constructor', async () => {
    const { getVisualizationBuilder } = await import('./visualization_builder_singleton');
    const { VisualizationBuilder } = await import('../../../../explore/public');

    getVisualizationBuilder();

    const constructorArgs = (VisualizationBuilder as jest.Mock).mock.calls[0][0];
    expect(typeof constructorArgs.getUrlStateStorage).toBe('function');
    expect(typeof constructorArgs.getExpressions).toBe('function');
  });

  it('should resolve services lazily through accessors', async () => {
    const { getVisualizationBuilder } = await import('./visualization_builder_singleton');
    const { VisualizationBuilder } = await import('../../../../explore/public');
    const { getServices } = await import('../../services/services');

    getVisualizationBuilder();

    // Services should not have been called yet (only at accessor invocation)
    const constructorArgs = (VisualizationBuilder as jest.Mock).mock.calls[0][0];

    // Now invoke the lazy accessors
    const urlStorage = constructorArgs.getUrlStateStorage();
    const expressions = constructorArgs.getExpressions();

    expect(getServices).toHaveBeenCalled();
    expect(urlStorage).toBe(mockServices.osdUrlStateStorage);
    expect(expressions).toBe(mockServices.expressions);
  });
});
