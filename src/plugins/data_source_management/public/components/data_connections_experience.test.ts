/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataConnectionsExperience,
  isDataConnectionsExperienceEnabled,
} from './data_connections_experience';

describe('isDataConnectionsExperienceEnabled', () => {
  const capabilities = { exampleFlags: { connectionsTable: true } } as any;

  it("asks the registered experience, with the session's capabilities", () => {
    const isEnabled = jest.fn(() => true);
    expect(isDataConnectionsExperienceEnabled({ isEnabled }, capabilities)).toBe(true);
    expect(isEnabled).toHaveBeenCalledWith(capabilities);
  });

  it('is off without a registered experience', () => {
    expect(isDataConnectionsExperienceEnabled(undefined, capabilities)).toBe(false);
  });

  it('is off without capabilities', () => {
    const isEnabled = jest.fn(() => true);
    expect(isDataConnectionsExperienceEnabled({ isEnabled }, undefined)).toBe(false);
    expect(isEnabled).not.toHaveBeenCalled();
  });

  it.each([
    ['false', false],
    ['a non-boolean value', 'true'],
    ['undefined', undefined],
  ])('fails closed when isEnabled answers %s', (_, answer) => {
    const experience = { isEnabled: () => answer } as unknown as DataConnectionsExperience;
    expect(isDataConnectionsExperienceEnabled(experience, capabilities)).toBe(false);
  });

  it('fails closed, and logs, when isEnabled throws', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const experience = {
      isEnabled: () => {
        throw new Error('broken');
      },
    };
    expect(isDataConnectionsExperienceEnabled(experience, capabilities)).toBe(false);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
