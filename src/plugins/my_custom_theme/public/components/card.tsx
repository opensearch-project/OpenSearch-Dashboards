/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, colors, spacing, typography } from '../theme/custom_theme';

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.s};
  background-color: ${colors.card.background};
  padding: ${spacing.m};
  border-radius: ${borderRadius.m};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: ${typography.fontFamily};
`;
