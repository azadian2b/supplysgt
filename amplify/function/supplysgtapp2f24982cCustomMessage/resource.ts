import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const supplysgtapp2f24982cCustomMessage = defineFunction({
  entry: './index.js',
  name: `supplysgtapp2f24982cCustomMessage-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    EMAILSUBJECT: 'Roger, Big Sarge',
    MODULES: 'verification-link',
    REDIRECTURL: 'supplysgt.net',
    RESOURCENAME: 'supplysgtapp2f24982cCustomMessage',
    ENV: `${branchName}`,
    EMAILMESSAGE:
      'Thank you for registering for SupplySGT.net. Your Company Commander thanks you already. Promote ahead of peers.',
    REGION: 'us-east-1',
  },
  runtime: 18,
});

export function applyEscapeHatches(backend: Backend) {
  backend.supplysgtapp2f24982cCustomMessage.resources.cfnResources.cfnFunction.functionName = `supplysgtapp2f24982cCustomMessage-${branchName}`;
}
