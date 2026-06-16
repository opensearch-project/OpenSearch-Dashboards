/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegendPanelProps {
  onClose: () => void;
  /** Show SLI/SLO entries. Default: false */
  showSliSlo?: boolean;
}
