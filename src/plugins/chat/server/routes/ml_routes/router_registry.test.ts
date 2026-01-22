/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities } from '../../../../../core/server';
import { MLAgentRouterRegistry } from './router_registry';
import { MLAgentRouterFactory } from './ml_agent_router';
import { GenericMLRouter } from './generic_ml_router';

// Mock the dependencies
jest.mock('./ml_agent_router', () => ({
  MLAgentRouterFactory: {
    registerRouter: jest.fn(),
    clearRouters: jest.fn(),
  },
}));

jest.mock('./generic_ml_router', () => ({
  GenericMLRouter: jest.fn().mockImplementation(() => ({
    forward: jest.fn(),
    getRouterName: jest.fn().mockReturnValue('GenericMLRouter'),
  })),
}));

jest.mock('../../../common/chat_capabilities', () => ({
  hasInvestigationCapabilities: jest.fn(),
}));

import { hasInvestigationCapabilities } from '../../../common/chat_capabilities';

describe('MLAgentRouterRegistry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MLAgentRouterRegistry.reset();
  });

  describe('initialize', () => {
    it('should register GenericMLRouter when investigation capabilities are enabled', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      const mockCapabilities: Capabilities = {
        investigation: {
          agenticFeaturesEnabled: true,
        },
      } as any;

      MLAgentRouterRegistry.initialize(mockCapabilities);

      expect(hasInvestigationCapabilities).toHaveBeenCalledWith(mockCapabilities);
      expect(GenericMLRouter).toHaveBeenCalled();
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalled();
    });

    it('should register GenericMLRouter when observabilityAgentId is provided', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(false);

      MLAgentRouterRegistry.initialize(undefined, 'observability-agent-123');

      expect(GenericMLRouter).toHaveBeenCalled();
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalled();
    });

    it('should register router when both capabilities and agentId are provided', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      const mockCapabilities: Capabilities = {
        investigation: {
          agenticFeaturesEnabled: true,
        },
      } as any;

      MLAgentRouterRegistry.initialize(mockCapabilities, 'observability-agent-123');

      expect(GenericMLRouter).toHaveBeenCalledTimes(1);
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalledTimes(1);
    });

    it('should not register router when neither capabilities nor agentId are provided', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(false);

      MLAgentRouterRegistry.initialize();

      expect(GenericMLRouter).not.toHaveBeenCalled();
      expect(MLAgentRouterFactory.registerRouter).not.toHaveBeenCalled();
    });

    it('should not register router when capabilities are disabled and no agentId', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(false);

      const mockCapabilities: Capabilities = {
        investigation: {
          agenticFeaturesEnabled: false,
        },
      } as any;

      MLAgentRouterRegistry.initialize(mockCapabilities);

      expect(GenericMLRouter).not.toHaveBeenCalled();
      expect(MLAgentRouterFactory.registerRouter).not.toHaveBeenCalled();
    });

    it('should only initialize once (singleton behavior)', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      const mockCapabilities: Capabilities = {} as any;

      MLAgentRouterRegistry.initialize(mockCapabilities);
      MLAgentRouterRegistry.initialize(mockCapabilities);
      MLAgentRouterRegistry.initialize(mockCapabilities);

      expect(GenericMLRouter).toHaveBeenCalledTimes(1);
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalledTimes(1);
    });

    it('should pass capabilities to hasInvestigationCapabilities', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(false);

      const mockCapabilities: Capabilities = {
        someFeature: { enabled: true },
      } as any;

      MLAgentRouterRegistry.initialize(mockCapabilities);

      expect(hasInvestigationCapabilities).toHaveBeenCalledWith(mockCapabilities);
    });
  });

  describe('reset', () => {
    it('should clear routers and allow re-initialization', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      const mockCapabilities: Capabilities = {} as any;

      MLAgentRouterRegistry.initialize(mockCapabilities);
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalledTimes(1);

      MLAgentRouterRegistry.reset();
      expect(MLAgentRouterFactory.clearRouters).toHaveBeenCalled();

      MLAgentRouterRegistry.initialize(mockCapabilities);
      expect(MLAgentRouterFactory.registerRouter).toHaveBeenCalledTimes(2);
    });

    it('should reset initialized flag', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      MLAgentRouterRegistry.initialize({} as any);
      expect(MLAgentRouterRegistry.isInitialized()).toBe(true);

      MLAgentRouterRegistry.reset();
      expect(MLAgentRouterRegistry.isInitialized()).toBe(false);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(MLAgentRouterRegistry.isInitialized()).toBe(false);
    });

    it('should return true after initialization with router registered', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(true);

      MLAgentRouterRegistry.initialize({} as any);

      expect(MLAgentRouterRegistry.isInitialized()).toBe(true);
    });

    it('should return true after initialization even without router', () => {
      (hasInvestigationCapabilities as jest.Mock).mockReturnValue(false);

      MLAgentRouterRegistry.initialize();

      expect(MLAgentRouterRegistry.isInitialized()).toBe(true);
    });
  });
});
