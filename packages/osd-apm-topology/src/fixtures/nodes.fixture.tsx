/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

import type { GetServiceMapOutput } from '../shared/types/sdk.types';

export const fixture: GetServiceMapOutput = {
  StartTime: new Date(1743044400),
  EndTime: new Date(1743134401),
  Nodes: [
    {
      NodeId: 'PetClinic-xxxxxxx',
      Name: 'PetClinic',
      Type: 'AWS::ApplicationSignal::Application',
      AttributeMaps: [{ ApplicationIdentifiType: 'Application' }, { ApplicationName: 'PetClinic' }],
      KeyAttributes: {
        ApplicationIdentifiType: 'Application',
        ApplicationName: 'PetClinic',
      },
      StatisticReferences: { MetricReferences: [] },
    },
    {
      NodeId: 'service/name=pet-clinic-fe|environment=ec2%3Adefault',
      Name: 'pet-clinic-fe',
      Type: 'AWS::CloudWatch::Service',
      AttributeMaps: [
        { Environment: 'ec2:default' },
        { Name: 'pet-clinic-fe' },
        { Type: 'Service' },
      ],
      KeyAttributes: {
        Environment: 'ec2:default',
        Name: 'pet-clinic-fe',
        Type: 'Service',
      },
      StatisticReferences: { MetricReferences: [] },
    },
    {
      NodeId: 'DynamoDBTable-899',
      Name: 'AWS::DynamoDB',
      Type: 'AWS::Resource',
      AggregatedNodeId: 'System::AWS::DynamoDB',
      AttributeMaps: [{ ResourceType: 'DynamoDB' }],
      KeyAttributes: { ResourceType: 'DynamoDB' },
      StatisticReferences: { MetricReferences: [] },
    },
    {
      NodeId: 'MyPet-xxxxxxx',
      Name: 'MyPet',
      Type: 'AWS::ApplicationSignal::Application',
      AttributeMaps: [{ ApplicationIdentifiType: 'Application' }, { ApplicationName: 'MyPet' }],
      KeyAttributes: {
        ApplicationIdentifiType: 'Application',
        ApplicationName: 'MyPet',
      },
      StatisticReferences: { MetricReferences: [] },
    },
  ],
  Edges: [
    {
      EdgeId: '12345678910111213141516',
      SourceNodeId: 'service/name=pet-clinic-fe|environment=ec2%3Adefault',
      DestinationNodeId: 'DynamoDBTable-899',
      StatisticReferences: { MetricReferences: [] },
    },
    {
      EdgeId: '012345678910111213141517',
      SourceNodeId: 'MyPet-xxxxxxx',
      DestinationNodeId: 'service/name=pet-clinic-fe|environment=ec2%3Adefault',
      StatisticReferences: { MetricReferences: [] },
    },
  ],
  AggregatedNodes: [
    {
      Id: 'System::AWS::DynamoDB',
      StatisticReferences: { MetricReferences: [] },
    },
  ],
  AwsAccountId: '12345678910',
};
