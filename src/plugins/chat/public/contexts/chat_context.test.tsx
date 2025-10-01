/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatProvider, useChatContext } from './chat_context';
import { ChatService } from '../services/chat_service';

// Mock ChatService
jest.mock('../services/chat_service');

describe('ChatContext', () => {
  let mockChatService: jest.Mocked<ChatService>;

  beforeEach(() => {
    mockChatService = {
      sendMessage: jest.fn(),
      sendToolResult: jest.fn(),
      abort: jest.fn(),
      newThread: jest.fn(),
      availableTools: [],
      events$: null,
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
        <ChatProvider chatService={mockChatService}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('chat-service')).toHaveTextContent('Service Available');
    });

    it('should render children correctly', () => {
      render(
        <ChatProvider chatService={mockChatService}>
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
        <ChatProvider chatService={mockChatService}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-test')).toHaveTextContent('Correct Service');
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
    it('should provide the correct context shape', () => {
      const TestComponent = () => {
        const context = useChatContext();
        return (
          <div>
            <div data-test-subj="has-chat-service">{context.chatService ? 'true' : 'false'}</div>
            <div data-test-subj="context-keys">{Object.keys(context).join(',')}</div>
          </div>
        );
      };

      render(
        <ChatProvider chatService={mockChatService}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('has-chat-service')).toHaveTextContent('true');
      expect(screen.getByTestId('context-keys')).toHaveTextContent('chatService');
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
        <ChatProvider chatService={service1}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('service-1');

      rerender(
        <ChatProvider chatService={service2}>
          <TestComponent />
        </ChatProvider>
      );

      expect(screen.getByTestId('service-id')).toHaveTextContent('service-2');
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
        <ChatProvider chatService={mockChatService}>
          <Consumer1 />
          <Consumer2 />
        </ChatProvider>
      );

      expect(screen.getByTestId('consumer-1')).toHaveTextContent('has-service');
      expect(screen.getByTestId('consumer-2')).toHaveTextContent('has-service');
    });
  });
});
