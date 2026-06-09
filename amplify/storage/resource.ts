import { defineStorage } from '@aws-amplify/backend';
import { CfnResource } from 'aws-cdk-lib';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
const branchBucketSuffix = branchName
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '-')
  .slice(0, 32);

export const storage = defineStorage({
  name: `supplysgt-mtoe-${branchBucketSuffix}`,
  access: (allow) => ({
    'public/*': [allow.authenticated.to(['write', 'read', 'delete'])],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
  }),
});

export function postRefactor(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
  s3Bucket.bucketName = 'supplysgtapp143c061359bc4407bdefc8dd9b6c476ea792b-dev';
}

export function applyEscapeHatches(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
  s3Bucket.bucketEncryption = {
    serverSideEncryptionConfiguration: [
      {
        serverSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: false,
      },
    ],
  };
  for (const cfnResource of backend.storage.stack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
          c.cfnResourceType
        )
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
}
