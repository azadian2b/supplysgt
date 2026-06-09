import type { Backend } from '../../backend';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
  CfnTable,
} from 'aws-cdk-lib/aws-dynamodb';
import { CfnResource } from 'aws-cdk-lib';

export function defineStorageDynamo4062985a(backend: Backend) {
  const storageDynamo4062985aStack = backend.createStack(
    'storagedynamo4062985a'
  );
  const dynamo4062985a = new Table(storageDynamo4062985aStack, 'dynamo4062985a', {
    partitionKey: { name: 'testdatabase', type: AttributeType.STRING },
    billingMode: BillingMode.PROVISIONED,
    readCapacity: 5,
    writeCapacity: 5,
    stream: StreamViewType.NEW_IMAGE,
  });
  for (const cfnResource of storageDynamo4062985aStack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        c.cfnResourceType === 'AWS::DynamoDB::Table'
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }

  return dynamo4062985a;
}

export function postRefactor(dynamo4062985a: Table) {
  (dynamo4062985a.node.defaultChild as CfnTable).tableName =
    'dynamo4062985a-dev';
}
