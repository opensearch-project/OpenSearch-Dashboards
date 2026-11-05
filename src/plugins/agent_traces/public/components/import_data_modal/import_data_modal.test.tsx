/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { ImportDataModal } from './import_data_modal';
import { AgentTracesServices } from '../../types';

const mockRequestClose = jest.fn();

jest.mock('../../../../data_importer/public', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  return {
    DataImporterPluginApp: forwardRef((_props: unknown, ref: unknown) => {
      useImperativeHandle(ref, () => ({ requestClose: mockRequestClose }));
      return <div data-test-subj="dataImporterApp" />;
    }),
  };
});

describe('ImportDataModal', () => {
  const services = {
    notifications: { toasts: { addDanger: jest.fn() } },
  } as unknown as AgentTracesServices;

  const renderModal = async () => {
    const onClose = jest.fn();
    render(<ImportDataModal services={services} isVisible={true} onClose={onClose} />);
    await screen.findByTestId('dataImporterApp');
    return onClose;
  };

  beforeEach(() => mockRequestClose.mockReset());

  it('routes Done through the importer guard instead of closing directly', async () => {
    const onClose = await renderModal();
    fireEvent.click(screen.getByTestId('importDataModalDoneButton'));
    expect(mockRequestClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('routes the modal X through the importer guard', async () => {
    const onClose = await renderModal();
    fireEvent.click(screen.getByLabelText('Closes this modal window'));
    expect(mockRequestClose).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders Done as a secondary (unfilled) action', async () => {
    await renderModal();
    expect(screen.getByTestId('importDataModalDoneButton')).not.toHaveClass('euiButton--fill');
  });
});
