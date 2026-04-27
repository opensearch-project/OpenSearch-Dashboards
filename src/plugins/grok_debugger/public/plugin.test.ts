/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GrokDebuggerPlugin } from './plugin';
import { coreMock } from '../../../core/public/mocks';

const mockRegister = jest.fn();
const mockDevTools = { register: mockRegister };

describe('GrokDebuggerPlugin', () => {
  it('registers a dev tool with the correct id and title', () => {
    const plugin = new GrokDebuggerPlugin();
    plugin.setup(coreMock.createSetup(), { devTools: mockDevTools });

    expect(mockRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'grok_debugger',
        title: 'Grok Debugger',
        enableRouting: false,
      })
    );
  });

  it('mount renders GrokDebugger and returns unmount function', async () => {
    const mockUnmount = jest.fn();
    const mockRoot = { render: jest.fn(), unmount: mockUnmount };
    jest.mock('react-dom/client', () => ({ createRoot: () => mockRoot }), { virtual: true });

    const plugin = new GrokDebuggerPlugin();
    plugin.setup(coreMock.createSetup(), { devTools: mockDevTools });

    const { mount } = mockRegister.mock.calls[0][0];
    const element = document.createElement('div');
    const unmount = await mount({ element });

    expect(typeof unmount).toBe('function');
    unmount();
    expect(mockRoot.unmount).toHaveBeenCalled();
  });

  it('start does not throw', () => {
    const plugin = new GrokDebuggerPlugin();
    expect(() => plugin.start()).not.toThrow();
  });
});
