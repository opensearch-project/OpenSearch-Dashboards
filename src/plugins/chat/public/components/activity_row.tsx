/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut } from '@elastic/eui';
import { ActivityMessage, ActivityType } from '../../common/types';

interface ActivityRowProps {
  activity: ActivityMessage;
}

/**
 * Render activity message content based on AG-UI protocol
 * Content is a structured Record<string, any> payload
 */
const renderActivityContent = (content: Record<string, any>): React.ReactNode => {
  // Handle common content structure with 'message' field
  if (content.message && typeof content.message === 'string') {
    return content.message;
  }

  // Handle common content structure with 'text' field
  if (content.text && typeof content.text === 'string') {
    return content.text;
  }

  // Fallback: render JSON string for debugging
  return JSON.stringify(content);
};

/**
 * Determine callout color and icon based on activityType
 */
const getActivityStyle = (activityType: ActivityType) => {
  switch (activityType) {
    case ActivityType.STOP:
      return { color: 'warning' as const, iconType: 'cross' };
    default:
      return { color: 'primary' as const, iconType: 'iInCircle' };
  }
};

export const ActivityRow: React.FC<ActivityRowProps> = ({ activity }) => {
  const { color, iconType } = getActivityStyle(activity.activityType);

  return (
    <EuiCallOut
      size="s"
      color={color}
      iconType={iconType}
      style={{ marginTop: '8px', marginBottom: '8px' }}
    >
      {renderActivityContent(activity.content)}
    </EuiCallOut>
  );
};
