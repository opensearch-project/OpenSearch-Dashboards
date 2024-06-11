/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCard } from '@elastic/eui';
import React from 'react';

export interface OverviewCardProps {
  id: string;
  title: string;
  description: string;
  onClick: () => void;
}

export function OverviewCard(props: OverviewCardProps) {
  const { id, title, description, onClick } = props;

  return (
    <EuiCard
      layout="horizontal"
      titleSize="xs"
      title={title}
      description={description}
      onClick={onClick}
      data-test-subj={`link-${id.toLowerCase()}`}
      titleElement="h3"
    />
  );
}
