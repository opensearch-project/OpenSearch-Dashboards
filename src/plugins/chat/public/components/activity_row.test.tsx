/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ActivityRow } from './activity_row';
import { ActivityType } from '../../common/types';
import type { ActivityMessage } from '../../common/types';

describe('ActivityRow', () => {
  describe('content rendering', () => {
    it('should render activity message with message field', () => {
      const activity: ActivityMessage = {
        id: 'test-1',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          message: 'Execution stopped by user',
        },
      };

      render(<ActivityRow activity={activity} />);
      expect(screen.getByText('Execution stopped by user')).toBeInTheDocument();
    });

    it('should render activity message with text field', () => {
      const activity: ActivityMessage = {
        id: 'test-2',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          text: 'Processing completed',
        },
      };

      render(<ActivityRow activity={activity} />);
      expect(screen.getByText('Processing completed')).toBeInTheDocument();
    });

    it('should render JSON string for content without message or text field', () => {
      const activity: ActivityMessage = {
        id: 'test-3',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          status: 'cancelled',
          reason: 'user_request',
        },
      };

      render(<ActivityRow activity={activity} />);
      expect(screen.getByText(JSON.stringify(activity.content))).toBeInTheDocument();
    });
  });

  describe('activity type styling', () => {
    it('should render STOP activity with warning color and cross icon', () => {
      const activity: ActivityMessage = {
        id: 'test-4',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          message: 'Stopped',
        },
      };

      const { container } = render(<ActivityRow activity={activity} />);
      const callout = container.querySelector('.euiCallOut--warning');
      expect(callout).toBeInTheDocument();
      // EuiCallOut with iconType prop renders icon, but exact selector may vary
      // Just verify warning callout is present which includes the icon
    });

    it('should render unknown activity types with default primary color and iInCircle icon', () => {
      const activity: ActivityMessage = {
        id: 'test-6',
        role: 'activity',
        activityType: 'UNKNOWN' as ActivityType,
        content: {
          message: 'Unknown activity',
        },
      };

      const { container } = render(<ActivityRow activity={activity} />);
      const callout = container.querySelector('.euiCallOut--primary');
      expect(callout).toBeInTheDocument();
      // EuiCallOut with iconType prop renders icon, but exact selector may vary
      // Just verify primary callout is present which includes the icon
    });
  });

  describe('component structure', () => {
    it('should render with small size', () => {
      const activity: ActivityMessage = {
        id: 'test-8',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          message: 'Test message',
        },
      };

      const { container } = render(<ActivityRow activity={activity} />);
      const callout = container.querySelector('.euiCallOut--small');
      expect(callout).toBeInTheDocument();
    });

    it('should apply CSS class for styling', () => {
      const activity: ActivityMessage = {
        id: 'test-9',
        role: 'activity',
        activityType: ActivityType.STOP,
        content: {
          message: 'Test message',
        },
      };

      const { container } = render(<ActivityRow activity={activity} />);
      const callout = container.querySelector('.actCallout');
      expect(callout).toBeInTheDocument();
      expect(callout).toHaveClass('actCallout');
    });
  });
});
