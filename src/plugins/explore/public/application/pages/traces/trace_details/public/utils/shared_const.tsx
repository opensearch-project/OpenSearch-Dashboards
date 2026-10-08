/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { euiThemeVars } from '@osd/ui-shared-deps/theme';

export const TRACE_ANALYTICS_DATE_FORMAT = 'MM/DD/YYYY HH:mm:ss.SSS';

// Service palette: the OUI categorical vis palette (the same source the
// agent_traces gantt uses via euiThemeVars), theme-aware for light/dark, and
// ordered to lead with calmer hues — the loud pink (vis2) is pushed late so a
// dominant service doesn't shout.
export const defaultColors = [
  euiThemeVars.euiColorVis1, // blue
  euiThemeVars.euiColorVis3, // purple
  euiThemeVars.euiColorVis0, // green
  euiThemeVars.euiColorVis4, // muted rose
  euiThemeVars.euiColorVis8, // brown
  euiThemeVars.euiColorVis5, // gold
  euiThemeVars.euiColorVis6, // tan
  euiThemeVars.euiColorVis7, // orange
  euiThemeVars.euiColorVis2, // pink (de-prioritized)
  euiThemeVars.euiColorVis9, // red-orange
];
