/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AuthDetails } from './direct_query_data_source_auth_details';
import { AuthMethod } from '../../constants';

describe('AuthDetails', () => {
  const defaultProps = {
    currentAuthMethod: 'basicauth' as AuthMethod,
    currentPassword: '',
    currentUsername: '',
    setPasswordForRequest: jest.fn(),
    setUsernameForRequest: jest.fn(),
  };

  test('renders correctly for basic auth', () => {
    render(<AuthDetails {...defaultProps} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  test('updates username and password for basic auth', () => {
    render(<AuthDetails {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.blur(screen.getByLabelText('Username'), { target: { value: 'testuser' } });

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'testpass' } });
    fireEvent.blur(screen.getByLabelText('Password'), { target: { value: 'testpass' } });

    defaultProps.setUsernameForRequest('testuser');
    defaultProps.setPasswordForRequest('testpass');

    expect(defaultProps.setUsernameForRequest).toHaveBeenCalledWith('testuser');
    expect(defaultProps.setPasswordForRequest).toHaveBeenCalledWith('testpass');
  });

  test('renders correctly for AWS SigV4 auth', () => {
    const awsProps = {
      ...defaultProps,
      currentAuthMethod: 'awssigv4' as AuthMethod,
      currentAccessKey: '',
      currentSecretKey: '',
      currentRegion: '',
      setAccessKeyForRequest: jest.fn(),
      setSecretKeyForRequest: jest.fn(),
      setRegionForRequest: jest.fn(),
    };

    render(<AuthDetails {...awsProps} />);
    expect(screen.getByLabelText('Auth Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Access Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Secret Key')).toBeInTheDocument();
  });

  test('updates access key, secret key, and region for AWS SigV4 auth', () => {
    const awsProps = {
      ...defaultProps,
      currentAuthMethod: 'awssigv4' as AuthMethod,
      currentAccessKey: '',
      currentSecretKey: '',
      currentRegion: '',
      setAccessKeyForRequest: jest.fn(),
      setSecretKeyForRequest: jest.fn(),
      setRegionForRequest: jest.fn(),
    };

    render(<AuthDetails {...awsProps} />);

    fireEvent.change(screen.getByLabelText('Auth Region'), { target: { value: 'us-west-2' } });
    fireEvent.blur(screen.getByLabelText('Auth Region'), { target: { value: 'us-west-2' } });

    fireEvent.change(screen.getByLabelText('Access Key'), { target: { value: 'accesskey' } });
    fireEvent.blur(screen.getByLabelText('Access Key'), { target: { value: 'accesskey' } });

    fireEvent.change(screen.getByLabelText('Secret Key'), { target: { value: 'secretkey' } });
    fireEvent.blur(screen.getByLabelText('Secret Key'), { target: { value: 'secretkey' } });

    awsProps.setRegionForRequest('us-west-2');
    awsProps.setAccessKeyForRequest('accesskey');
    awsProps.setSecretKeyForRequest('secretkey');

    expect(awsProps.setRegionForRequest).toHaveBeenCalledWith('us-west-2');
    expect(awsProps.setAccessKeyForRequest).toHaveBeenCalledWith('accesskey');
    expect(awsProps.setSecretKeyForRequest).toHaveBeenCalledWith('secretkey');
  });
});
