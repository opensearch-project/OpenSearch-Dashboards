/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { ChatHeaderButton } from './chat_header_button';
import { coreMock } from '../../../../core/public/mocks';

// Mock dependencies

jest.mock('@osd/i18n/react', () => ({
  ...jest.requireActual('@osd/i18n/react'),
  FormattedMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

jest.mock('./chat_window', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ChatWindow: ActualReact.forwardRef((props: any, ref: any) => {
      ActualReact.useImperativeHandle(ref, () => ({
        startNewChat: jest.fn(),
        sendMessage: jest.fn().mockResolvedValue(undefined),
      }));
      return null;
    }),
  };
});

describe('ChatHeaderButton', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();

    // Make chat available by default
    mockCore.chat.isAvailable.mockReturnValue(true);
    mockCore.chat.isWindowOpen.mockReturnValue(false);
    mockCore.chat.openWindow.mockResolvedValue(undefined);
    mockCore.chat.closeWindow.mockResolvedValue(undefined);

    // Mock capabilities with agentic features enabled by default
    mockCore.application.capabilities = {
      investigation: {
        agenticFeaturesEnabled: true,
      },
    } as any;
  });

  describe('rendering', () => {
    it('should render button when chat is available', () => {
      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });

    it('should not render when chat is not available', () => {
      mockCore.chat.isAvailable.mockReturnValue(false);

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('button interaction', () => {
    it('should call openWindow when button is clicked and window is closed', () => {
      mockCore.chat.isWindowOpen.mockReturnValue(false);

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(mockCore.chat.openWindow).toHaveBeenCalled();
    });

    it('should call closeWindow when button is clicked and window is open', () => {
      mockCore.chat.isWindowOpen.mockReturnValue(true);

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(mockCore.chat.closeWindow).toHaveBeenCalled();
    });
  });

  describe('feature flag visibility', () => {
    it('should render when agenticFeaturesEnabled is true', () => {
      mockCore.application.capabilities = {
        investigation: {
          agenticFeaturesEnabled: true,
        },
      } as any;

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });

    it('should not render when chat is not available', () => {
      mockCore.chat.isAvailable.mockReturnValue(false);

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when agenticFeaturesEnabled is undefined (open source environment)', () => {
      mockCore.application.capabilities = {
        investigation: {
          agenticFeaturesEnabled: undefined,
        },
      } as any;

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });

    it('should render when investigation capabilities are missing (open source environment)', () => {
      mockCore.application.capabilities = {} as any;

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });

    it('should render when capabilities are missing entirely (open source environment)', () => {
      mockCore.application.capabilities = undefined as any;

      const { container } = render(<ChatHeaderButton core={mockCore} />);

      const button = container.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });
  });
});
