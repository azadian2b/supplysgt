import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const supplysgtapp2f24982cPreSignup = defineFunction({
  entry: './index.js',
  name: `supplysgtapp2f24982cPreSignup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    MODULES: 'email-filter-allowlist',
    DOMAINALLOWLIST: 'army.mil, gmail.com',
    DOMAINBLACKLIST: '',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 18,
});

export function applyEscapeHatches(backend: Backend) {
  backend.supplysgtapp2f24982cPreSignup.resources.cfnResources.cfnFunction.functionName = `supplysgtapp2f24982cPreSignup-${branchName}`;
}
