/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageRow } from './message_row';
import { Message } from '../../common/types';

// Mock the Markdown component
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  Markdown: ({ markdown }: { markdown: string }) => <div data-testid="markdown">{markdown}</div>,
}));

describe('MessageRow', () => {
  describe('string content rendering', () => {
    it('should render simple text message', () => {
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, world!',
      };

      render(<MessageRow message={message} />);

      expect(screen.getByText('Hello, world!')).toBeInTheDocument();
    });

    it('should render empty content gracefully', () => {
      const message: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: '',
      };

      const { container } = render(<MessageRow message={message} />);

      // Just check that the component renders without errors
      expect(container.querySelector('.messageRow')).toBeInTheDocument();
    });
  });

  describe('multimodal content rendering', () => {
    it('should render image from binary content', () => {
      const message: Message = {
        id: 'msg-3',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'base64encodedimagedata',
          },
        ],
      };

      render(<MessageRow message={message} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,base64encodedimagedata');
      expect(img).toHaveAttribute('alt', 'Visualization');
    });

    it('should render image with custom filename', () => {
      const message: Message = {
        id: 'msg-4',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/png',
            data: 'imagedata',
            filename: 'chart.png',
          },
        ],
      };

      render(<MessageRow message={message} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'chart.png');
    });

    it('should render text block from array content', () => {
      const message: Message = {
        id: 'msg-5',
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this data',
          },
        ],
      };

      render(<MessageRow message={message} />);

      expect(screen.getByText('Analyze this data')).toBeInTheDocument();
    });

    it('should render both image and text in correct order', () => {
      const message: Message = {
        id: 'msg-6',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'imagedata',
          },
          {
            type: 'text',
            text: 'What is in this image?',
          },
        ],
      };

      const { container } = render(<MessageRow message={message} />);

      // Check both image and text are rendered
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(screen.getByText('What is in this image?')).toBeInTheDocument();

      // Verify order: image should come before text
      const messageContent = container.querySelector('.messageRow__markdown');
      const children = Array.from(messageContent?.children || []);
      expect(children[0].tagName).toBe('IMG');
    });

    it('should render multiple images', () => {
      const message: Message = {
        id: 'msg-7',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/png',
            data: 'firstimage',
          },
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'secondimage',
          },
        ],
      };

      render(<MessageRow message={message} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,firstimage');
      expect(images[1]).toHaveAttribute('src', 'data:image/jpeg;base64,secondimage');
    });

    it('should handle mixed content with backward compatibility', () => {
      const message: Message = {
        id: 'msg-8',
        role: 'user',
        content: [
          {
            type: 'binary',
            mimeType: 'image/jpeg',
            data: 'imagedata',
          },
          {
            type: 'text',
            text: 'Plain text block',
          },
        ],
      };

      render(<MessageRow message={message} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByText('Plain text block')).toBeInTheDocument();
    });
  });

  describe('role-based styling', () => {
    it('should apply user styling for user messages', () => {
      const message: Message = {
        id: 'msg-11',
        role: 'user',
        content: 'User message',
      };

      const { container } = render(<MessageRow message={message} />);

      const messageRow = container.querySelector('.messageRow');
      expect(messageRow).toHaveClass('messageRow--user');
    });

    it('should not apply user styling for assistant messages', () => {
      const message: Message = {
        id: 'msg-12',
        role: 'assistant',
        content: 'Assistant message',
      };

      const { container } = render(<MessageRow message={message} />);

      const messageRow = container.querySelector('.messageRow');
      expect(messageRow).not.toHaveClass('messageRow--user');
    });
  });

  describe('streaming indicator', () => {
    it('should show cursor when streaming', () => {
      const message: Message = {
        id: 'msg-13',
        role: 'assistant',
        content: 'Streaming...',
      };

      const { container } = render(<MessageRow message={message} isStreaming={true} />);

      const cursor = container.querySelector('.messageRow__cursor');
      expect(cursor).toBeInTheDocument();
      expect(cursor).toHaveTextContent('|');
    });

    it('should not show cursor when not streaming', () => {
      const message: Message = {
        id: 'msg-14',
        role: 'assistant',
        content: 'Complete message',
      };

      const { container } = render(<MessageRow message={message} isStreaming={false} />);

      const cursor = container.querySelector('.messageRow__cursor');
      expect(cursor).not.toBeInTheDocument();
    });
  });
});
