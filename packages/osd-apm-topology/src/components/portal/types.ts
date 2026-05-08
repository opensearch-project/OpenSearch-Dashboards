/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Position {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface PortalProps {
  position: Position;
}
