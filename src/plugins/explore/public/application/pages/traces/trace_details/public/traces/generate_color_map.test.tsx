/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateColorMap } from './generate_color_map';
import { defaultColors } from '../utils/shared_const';

describe('generateColorMap', () => {
  it('generates empty map for empty hits array', () => {
    const colorMap = generateColorMap([]);
    expect(colorMap).toEqual({});
  });

  it('generates color map for single service', () => {
    const hits = [
      {
        serviceName: 'serviceA',
      },
    ];
    const colorMap = generateColorMap(hits);
    expect(colorMap).toEqual({
      serviceA: defaultColors[0],
    });
  });

  it('generates consistent colors for multiple services', () => {
    const hits = [
      {
        serviceName: 'serviceB',
      },
      {
        serviceName: 'serviceA',
      },
      {
        serviceName: 'serviceB', // Duplicate service name
      },
    ];
    const colorMap = generateColorMap(hits);
    expect(colorMap).toEqual({
      serviceA: defaultColors[0], // First alphabetically
      serviceB: defaultColors[1], // Second alphabetically
    });
  });

  it('handles services count exceeding default colors length', () => {
    // Create services with names that will maintain numeric order after alphabetical sorting
    // by padding numbers with zeros
    const hits = Array.from({ length: defaultColors.length + 2 }, (_, i) => ({
      serviceName: `service${i.toString().padStart(3, '0')}`,
    }));
    const colorMap = generateColorMap(hits);

    // Check that colors wrap around
    expect(colorMap[`service${defaultColors.length.toString().padStart(3, '0')}`]).toBe(
      defaultColors[0]
    );
    expect(colorMap[`service${(defaultColors.length + 1).toString().padStart(3, '0')}`]).toBe(
      defaultColors[1]
    );
  });

  it('handles hits without serviceName', () => {
    const hits = [
      {
        serviceName: 'serviceA',
      },
      {
        // Missing serviceName
      },
    ];
    const colorMap = generateColorMap(hits);
    expect(colorMap).toEqual({
      serviceA: defaultColors[0],
    });
  });
});
