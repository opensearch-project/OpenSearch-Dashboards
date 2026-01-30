/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, componentTokens, spacing, typography } from '../theme/custom_theme';

const { header: colors } = componentTokens;

export const Header = styled.header`
  background-color: ${colors.background};
  color: ${colors.text};
  font-family: ${typography.fontFamily};
  font-size: ${typography.fontSize.l};
  padding: ${spacing.m};
  border-radius: ${borderRadius.s};
`;
