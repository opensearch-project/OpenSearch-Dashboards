/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { spacing } from '../theme/custom_theme';
import { Button } from './button';
import { Card, CardBody, CardFooter, CardHeader } from './card';
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
            <CardHeader>
              <h3>Card 1</h3>
            </CardHeader>

            <CardBody>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
              <Input placeholder="Enter value..." />
            </CardBody>

            <CardFooter>
              <Button>Submit</Button>
            </CardFooter>
          </Card>

          <Card style={{ flex: '1 1 calc(33% - 16px)' }}>
            <CardHeader>
              <h3>Card 2</h3>
            </CardHeader>

            <CardBody>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
              <Input placeholder="Another input..." />
            </CardBody>

            <CardFooter>
              <Button>Save</Button>
            </CardFooter>
          </Card>

          <Card style={{ flex: '1 1 calc(33% - 16px)' }}>
            <CardHeader>
              <h3>Card 3</h3>
            </CardHeader>

            <CardBody>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
              <Input placeholder="More input..." />
            </CardBody>

            <CardFooter>
              <Button>Go</Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};
