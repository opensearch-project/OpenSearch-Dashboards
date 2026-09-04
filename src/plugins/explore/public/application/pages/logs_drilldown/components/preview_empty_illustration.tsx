/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { euiThemeVars } from '@osd/ui-shared-deps/theme';

/**
 * A lightweight, on-brand SVG for the "nothing selected yet" preview state. It depicts the
 * payoff of the flow — a card with a histogram + a few log lines — so the empty state teaches
 * rather than showing a blank box. Colors come from the OUI theme vars so it adapts to
 * light/dark mode. Purely decorative (aria-hidden); the surrounding copy conveys the meaning.
 */
export const PreviewEmptyIllustration: React.FC = () => {
  const primary = euiThemeVars.euiColorPrimary;
  const accent = euiThemeVars.euiColorAccent;
  const success = euiThemeVars.euiColorSuccess;
  const panel = euiThemeVars.euiColorEmptyShade;
  const line = euiThemeVars.euiColorLightShade;
  const subdued = euiThemeVars.euiColorMediumShade;

  return (
    <svg
      className="logsExplorePreview__illustration"
      viewBox="0 0 320 180"
      width="320"
      height="180"
      role="img"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="lxpBars" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={primary} stopOpacity="0.5" />
          <stop offset="100%" stopColor={primary} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id="lxpGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} stopOpacity="0.08" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* soft brand glow behind the card */}
      <rect x="8" y="8" width="304" height="164" rx="16" fill="url(#lxpGlow)" />

      {/* preview card */}
      <rect
        x="40"
        y="26"
        width="240"
        height="128"
        rx="10"
        fill={panel}
        stroke={line}
        strokeWidth="1.5"
      />

      {/* card header: index name pill + a small "time-based" chip */}
      <rect x="56" y="42" width="92" height="10" rx="5" fill={subdued} opacity="0.5" />
      <rect x="212" y="40" width="52" height="14" rx="7" fill={success} opacity="0.25" />
      <circle cx="222" cy="47" r="3" fill={success} />

      {/* mini histogram */}
      <g>
        <rect x="56" y="92" width="12" height="18" rx="2" fill="url(#lxpBars)" />
        <rect x="74" y="84" width="12" height="26" rx="2" fill="url(#lxpBars)" />
        <rect x="92" y="72" width="12" height="38" rx="2" fill="url(#lxpBars)" />
        <rect x="110" y="80" width="12" height="30" rx="2" fill="url(#lxpBars)" />
        <rect x="128" y="66" width="12" height="44" rx="2" fill="url(#lxpBars)" />
        <rect x="146" y="88" width="12" height="22" rx="2" fill="url(#lxpBars)" />
        {/* baseline */}
        <rect x="54" y="112" width="120" height="1.5" rx="1" fill={line} />
      </g>

      {/* a few log lines to the right of the chart */}
      <g fill={subdued} opacity="0.55">
        <rect x="188" y="72" width="76" height="6" rx="3" />
        <rect x="188" y="86" width="60" height="6" rx="3" />
        <rect x="188" y="100" width="70" height="6" rx="3" />
      </g>

      {/* log rows under the chart */}
      <g fill={subdued} opacity="0.4">
        <rect x="56" y="126" width="208" height="6" rx="3" />
        <rect x="56" y="138" width="150" height="6" rx="3" />
      </g>

      {/* accent search/compass dot to tie it to the "explore" motif */}
      <circle cx="278" cy="30" r="10" fill={primary} opacity="0.12" />
      <circle cx="278" cy="30" r="3.5" fill={primary} />
    </svg>
  );
};
