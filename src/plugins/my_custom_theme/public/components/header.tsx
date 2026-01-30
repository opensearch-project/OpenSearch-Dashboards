/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import { borderRadius, colors, spacing, typography } from '../theme/custom_theme';

export const Header = styled.header`
  background-color: ${colors.header.background};
  color: ${colors.header.text};
  font-family: ${typography.fontFamily};
  font-size: ${typography.headerSize};
  padding: ${spacing.m};
  border-radius: ${borderRadius.s};
`;
