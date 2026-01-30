/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import styled from 'styled-components';
import {
  borderRadius,
  componentTokens,
  elevation,
  spacing,
  typography,
} from '../theme/custom_theme';

const { card: colors } = componentTokens;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${colors.background};
  border-radius: ${borderRadius.m};
  box-shadow: ${elevation.m};
  font-family: ${typography.fontFamily};
  overflow: hidden;
`;

export const CardHeader = styled.div`
  padding: ${spacing.m};
  background-color: ${colors.header.background};
  color: ${colors.header.text};
  font-size: ${typography.fontSize.l};
  font-weight: bold;
`;

export const CardBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${spacing.s};
  padding: ${spacing.m};

  p {
    font-size: ${typography.fontSize.m};
    line-height: ${typography.lineHeight.tight};
    color: ${colors.body.text};
    margin: 0;
  }
`;

export const CardFooter = styled.div`
  border-top: 1px solid ${colors.border};
  padding: ${spacing.m};
  text-align: right;
`;
