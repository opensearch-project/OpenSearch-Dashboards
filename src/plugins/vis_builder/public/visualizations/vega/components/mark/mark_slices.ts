/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builds a mark configuration for Vega using slices data.
 *
 * @param {string[]} levels - The array of hierarchy levels.
 * @param {boolean} hasSplit - Indicates whether we have split data.
 * @returns {Object} An object containing a single group mark configuration.
 */
export const buildSlicesMarkForVega = (levels: string[], hasSplit: boolean, addTooltip) => {
  return {
    type: 'group',
    // If we have splits, use the 'splits' data, otherwise no specific data source
    from: hasSplit ? { data: 'splits' } : null,
    encode: {
      enter: {
        // Set width based on whether we have splits or not
        width: { signal: hasSplit ? 'chartWidth' : 'width' },
        height: { signal: 'chartHeight' },
      },
    },
    // Define signals for facet dimensions
    signals: [
      { name: 'facetWidth', update: hasSplit ? 'chartWidth' : 'width' },
      { name: 'facetHeight', update: 'height' },
    ],
    // Add a title if have splits
    title: hasSplit
      ? {
          text: { signal: 'parent.split' },
          frame: 'group',
          baseline: 'bottom', // Align the text to the bottom
          orient: 'bottom', // Position the title at the bottom
          offset: 20,
          limit: { signal: 'chartWidth' }, // This limits the title width
          ellipsis: '...', // Add ellipsis for truncated text
        }
      : null,
    // Build the data for each level of the pie
    data: buildPieMarks(levels, hasSplit),
    // Build the arc marks for each level of the pie
    marks: buildArcMarks(levels, addTooltip),
  };
};

/**
 * Builds the data transformations for each level of the pie chart.
 *
 * @param {string[]} levels - The array of hierarchy levels.
 * @param {boolean} hasSplit - Indicates whether we have split data.
 * @returns {Object[]} An array of data transformation configurations for each level.
 */
export const buildPieMarks = (levels: string[], hasSplit: boolean) => {
  return levels.map((level, index) => ({
    name: `facet_${level}`,
    source: 'table',
    transform: [
      // Filter data if we have splits
      {
        type: 'filter',
        expr: hasSplit ? `datum.split === parent.split` : 'true',
      },
      // Aggregate data for this level
      {
        type: 'aggregate',
        groupby: levels.slice(0, index + 1),
        fields: ['value'],
        ops: ['sum'],
        as: ['sum_value'],
      },
      // Create pie layout
      { type: 'pie', field: 'sum_value' },
    ],
  }));
};

/**
 * Builds the arc marks for each level of the pie chart.
 *
 * @param {string[]} levels - The array of hierarchy levels.
 * @returns {Object[]} An array of arc mark configurations for each level.
 */
export const buildArcMarks = (levels: string[], addTooltip) => {
  return levels.map((level, index) => ({
    type: 'arc',
    from: { data: `facet_${level}` },
    encode: {
      enter: {
        // Set fill color based on the current level
        fill: { scale: 'color', field: level },
        // Center the arc
        x: { signal: 'facetWidth / 2' },
        y: { signal: 'facetHeight / 2' },
      },
      update: {
        // Set arc angles and dimensions
        startAngle: { field: 'startAngle' },
        endAngle: { field: 'endAngle' },
        padAngle: { value: 0.01 },
        innerRadius: { signal: `innerRadius + thickness * ${index}` },
        outerRadius: { signal: `innerRadius + thickness * (${index} + 1)` },
        stroke: { value: 'white' },
        strokeWidth: { value: 2 },
        // Create tooltip with all relevant level data
        ...(addTooltip
          ? {
              tooltip: {
                signal: `{${levels
                  .slice(0, index + 1)
                  .map((l) => `'${l}': datum.${l}`)
                  .join(', ')}, 'Value': datum.sum_value}`,
              },
            }
          : {}),
      },
    },
  }));
};
