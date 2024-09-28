/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlyout } from '@elastic/eui';
import React from 'react';

export interface SaveQueryFlyoutProps {
  onClose: () => void;
}

export function SaveQueryFlyout({ onClose }: SaveQueryFlyoutProps) {
  return <EuiFlyout onClose={onClose} />;
}
