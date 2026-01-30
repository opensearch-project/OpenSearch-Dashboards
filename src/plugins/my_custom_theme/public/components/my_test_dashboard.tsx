/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { spacing } from '../theme/custom_theme';
import { Button } from './button';
import { Card } from './card';
import { Header } from './header';
import { Input } from './input';
import { Sidebar } from './sidebar';

export const MyTestDashboard = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar>
        <Button>Dashboard</Button>
        <Button>Settings</Button>
        <Button>Profile</Button>
      </Sidebar>

      {/* Main content */}
      <main style={{ flex: 1, padding: spacing.m, backgroundColor: '#F5F5F5' }}>
        <Header>Custom Dashboard Preview</Header>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
          <Card style={{ flex: '1 1 calc(33% - 16px)' }}>
            <h3>Card 1</h3>
            <Input placeholder="Enter value..." />
            <Button>Submit</Button>
          </Card>

          <Card style={{ flex: '1 1 calc(33% - 16px)' }}>
            <h3>Card 2</h3>
            <Input placeholder="Another input..." />
            <Button>Save</Button>
          </Card>

          <Card style={{ flex: '1 1 calc(33% - 16px)' }}>
            <h3>Card 3</h3>
            <Input placeholder="More input..." />
            <Button>Go</Button>
          </Card>
        </div>
      </main>
    </div>
  );
};
