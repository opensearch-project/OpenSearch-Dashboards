/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, componentTokens, spacing, typography } from '../theme/custom_theme';

const { button: colors } = componentTokens;

export const Button = styled.button`
  background: ${colors.primary.background.idle};
  border-radius: ${borderRadius.s};
  padding: ${spacing.s} ${spacing.m};
  color: ${colors.primary.text};
  font-size: ${typography.fontSize.m};
  border: none;
  cursor: pointer;

  transition: 0.3s ease-in-out;

  &:hover {
    background: ${colors.primary.background.hover};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary.outline};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
