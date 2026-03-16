/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatProvider, useChatContext } from './chat_context';
import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action/suggested_actions_service';
import { ConfirmationService } from '../services/confirmation_service';

// Mock services
jest.mock('../services/chat_service');
jest.mock('../services/suggested_action/suggested_actions_service');
jest.mock('../services/confirmation_service');

describe('ChatContext', () => {
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: jest.Mocked<SuggestedActionsService>;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;

  beforeEach(() => {
    mockChatService = {
      sendMessage: jest.fn(),
      sendToolResult: jest.fn(),
      abort: jest.fn(),
      newThread: jest.fn(),
      availableTools: [],
      events$: null,
    } as any;

    mockSuggestedActionsService = {
      registerProvider: jest.fn(),
      unregisterProvider: jest.fn(),
      getCustomSuggestions: jest.fn(),
      buildChatContext: jest.fn(),
      getProviderCount: jest.fn(),
      getProviderIds: jest.fn(),
    } as any;

    mockConfirmationService = {
      getPendingConfirmations$: jest.fn(),
      requestConfirmation: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      cancel: jest.fn(),
      getPendingConfirmations: jest.fn(),
      hasPendingConfirmations: jest.fn(),
    } as any;
  });

  describe('ChatProvider', () => {
    it('should provide chat service to children', () => {
      const TestComponent = () => {
        const { chatService } = useChatContext();
        return (
          <div data-test-subj="chat-service">
            {chatService ? 'Service Available' : 'No Service'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-service')).toHaveTextContent('Service Available');
    });

    it('should provide suggested actions service to children', () => {
      const TestComponent = () => {
        const { suggestedActionsService } = useChatContext();
        return (
          <div data-test-subj="suggested-actions-service">
            {suggestedActionsService ? 'Service Available' : 'No Service'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('suggested-actions-service')).toHaveTextContent(
        'Service Available'
      );
    });

    it('should provide confirmation service to children', () => {
      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        return (
          <div data-test-subj="confirmation-service">
            {confirmationService ? 'Service Available' : 'No Service'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('confirmation-service')).toHaveTextContent('Service Available');
    });

    it('should accept confirmationService prop', () => {
      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        return (
          <div data-test-subj="confirmation-service-instance">
            {confirmationService === mockConfirmationService
              ? 'Correct Instance'
              : 'Wrong Instance'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('confirmation-service-instance')).toHaveTextContent(
        'Correct Instance'
      );
    });

    it('should render children correctly', () => {
      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <div data-test-subj="child">Child Component</div>
        </ChatProvider>
      );

      expect(screen.getByTestId('child')).toHaveTextContent('Child Component');
    });
  });

  describe('useChatContext', () => {
    it('should return chat service when used within provider', () => {
      const TestComponent = () => {
        const { chatService } = useChatContext();
        return (
          <div data-test-subj="service-test">
            {chatService === mockChatService ? 'Correct Service' : 'Wrong Service'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-test')).toHaveTextContent('Correct Service');
    });

    it('should return confirmationService when used within provider', () => {
      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        return (
          <div data-test-subj="confirmation-test">
            {confirmationService === mockConfirmationService ? 'Correct Service' : 'Wrong Service'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('confirmation-test')).toHaveTextContent('Correct Service');
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useChatContext();
        return <div>Should not render</div>;
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useChatContext must be used within a ChatProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('context value', () => {
    it('should provide the correct context shape with all services', () => {
      const TestComponent = () => {
        const context = useChatContext();
        return (
          <div>
            <div data-test-subj="has-chat-service">{context.chatService ? 'true' : 'false'}</div>
            <div data-test-subj="has-suggested-actions-service">
              {context.suggestedActionsService ? 'true' : 'false'}
            </div>
            <div data-test-subj="has-confirmation-service">
              {context.confirmationService ? 'true' : 'false'}
            </div>
            <div data-test-subj="context-keys">{Object.keys(context).sort().join(',')}</div>
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('has-chat-service')).toHaveTextContent('true');
      expect(screen.getByTestId('has-suggested-actions-service')).toHaveTextContent('true');
      expect(screen.getByTestId('has-confirmation-service')).toHaveTextContent('true');
      expect(screen.getByTestId('context-keys')).toHaveTextContent(
        'chatService,confirmationService,suggestedActionsService'
      );
    });
  });

  describe('provider updates', () => {
    it('should handle chat service updates', () => {
      const TestComponent = () => {
        const { chatService } = useChatContext();
        return <div data-test-subj="service-id">{(chatService as any).id || 'no-id'}</div>;
      };

      const service1 = { ...mockChatService, id: 'service-1' } as any;
      const service2 = { ...mockChatService, id: 'service-2' } as any;

      const { rerender } = render(
        <ChatProvider
          chatService={service1}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('service-1');

      rerender(
        <ChatProvider
          chatService={service2}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('service-2');
    });

    it('should handle confirmation service updates', () => {
      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        return <div data-test-subj="service-id">{(confirmationService as any).id || 'no-id'}</div>;
      };

      const confirmationService1 = { ...mockConfirmationService, id: 'confirmation-1' } as any;
      const confirmationService2 = { ...mockConfirmationService, id: 'confirmation-2' } as any;

      const { rerender } = render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={confirmationService1}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('confirmation-1');

      rerender(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={confirmationService2}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('confirmation-2');
    });
  });

  describe('multiple consumers', () => {
    it('should provide same context to multiple consumers', () => {
      const Consumer1 = () => {
        const { chatService } = useChatContext();
        return <div data-test-subj="consumer-1">{chatService ? 'has-service' : 'no-service'}</div>;
      };

      const Consumer2 = () => {
        const { chatService } = useChatContext();
        return <div data-test-subj="consumer-2">{chatService ? 'has-service' : 'no-service'}</div>;
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <Consumer1 />
          <Consumer2 />
        </ChatProvider>
      );

      expect(screen.getByTestId('consumer-1')).toHaveTextContent('has-service');
      expect(screen.getByTestId('consumer-2')).toHaveTextContent('has-service');
    });

    it('should provide same confirmation service to multiple consumers', () => {
      const Consumer1 = () => {
        const { confirmationService } = useChatContext();
        return (
          <div data-test-subj="consumer-1">
            {confirmationService ? 'has-confirmation' : 'no-confirmation'}
          </div>
        );
      };

      const Consumer2 = () => {
        const { confirmationService } = useChatContext();
        return (
          <div data-test-subj="consumer-2">
            {confirmationService ? 'has-confirmation' : 'no-confirmation'}
          </div>
        );
      };

      render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <Consumer1 />
          <Consumer2 />
        </ChatProvider>
      );

      expect(screen.getByTestId('consumer-1')).toHaveTextContent('has-confirmation');
      expect(screen.getByTestId('consumer-2')).toHaveTextContent('has-confirmation');
    });
  });

  describe('confirmationService instance persistence', () => {
    it('should persist confirmationService instance across re-renders', () => {
      let renderCount = 0;
      const capturedInstances: any[] = [];

      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        renderCount++;
        capturedInstances.push(confirmationService);
        return <div data-test-subj="render-count">{renderCount}</div>;
      };

      const { rerender } = render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('1');

      // Force re-render by updating a different prop
      const newChatService = { ...mockChatService, id: 'new-service' } as any;
      rerender(
        <ChatProvider
          chatService={newChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('render-count')).toHaveTextContent('2');

      // Verify the confirmationService instance is the same across re-renders
      expect(capturedInstances.length).toBe(2);
      expect(capturedInstances[0]).toBe(capturedInstances[1]);
      expect(capturedInstances[0]).toBe(mockConfirmationService);
    });

    it('should maintain referential equality for confirmationService across multiple re-renders', () => {
      const instances: any[] = [];

      const TestComponent = () => {
        const { confirmationService } = useChatContext();
        instances.push(confirmationService);
        return <div data-test-subj="test">Test</div>;
      };

      const { rerender } = render(
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          <TestComponent />
        </ChatProvider>
      );

      // Trigger multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <ChatProvider
            chatService={mockChatService}
            suggestedActionsService={mockSuggestedActionsService}
            confirmationService={mockConfirmationService}
          >
            <TestComponent />
          </ChatProvider>
        );
      }

      // Verify all instances are the same
      expect(instances.length).toBe(6); // Initial render + 5 re-renders
      const firstInstance = instances[0];
      instances.forEach((instance) => {
        expect(instance).toBe(firstInstance);
        expect(instance).toBe(mockConfirmationService);
      });
    });
  });
});
