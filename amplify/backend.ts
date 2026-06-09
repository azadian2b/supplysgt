import * as supplysgtapp2f24982cCustomMessage from './function/supplysgtapp2f24982cCustomMessage/resource';
import * as supplysgtapp2f24982cPreSignup from './function/supplysgtapp2f24982cPreSignup/resource';
import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storageDynamo4062985a from './storage/dynamo4062985a/resource';
import * as storage from './storage/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  supplysgtapp2f24982cCustomMessage: supplysgtapp2f24982cCustomMessage.supplysgtapp2f24982cCustomMessage,
  supplysgtapp2f24982cPreSignup: supplysgtapp2f24982cPreSignup.supplysgtapp2f24982cPreSignup,
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
});

export type Backend = typeof backend;

const dynamo4062985a = storageDynamo4062985a.defineStorageDynamo4062985a(backend);

supplysgtapp2f24982cCustomMessage.applyEscapeHatches(backend);
supplysgtapp2f24982cPreSignup.applyEscapeHatches(backend);
auth.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);

export function postRefactor() {
  storageDynamo4062985a.postRefactor(dynamo4062985a);
  storage.postRefactor(backend);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
