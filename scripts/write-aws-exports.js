const fs = require('fs');
const path = require('path');

const mappings = {
  projectRegion: ['SSGT_PROJECT_REGION', 'AWS_PROJECT_REGION'],
  cognitoIdentityPoolId: ['SSGT_COGNITO_IDENTITY_POOL_ID', 'AWS_COGNITO_IDENTITY_POOL_ID'],
  cognitoRegion: ['SSGT_COGNITO_REGION', 'AWS_COGNITO_REGION'],
  userPoolsId: ['SSGT_USER_POOLS_ID', 'AWS_USER_POOLS_ID'],
  userPoolsWebClientId: ['SSGT_USER_POOLS_WEB_CLIENT_ID', 'AWS_USER_POOLS_WEB_CLIENT_ID'],
  appsyncGraphqlEndpoint: ['SSGT_APPSYNC_GRAPHQL_ENDPOINT', 'AWS_APPSYNC_GRAPHQL_ENDPOINT'],
  appsyncRegion: ['SSGT_APPSYNC_REGION', 'AWS_APPSYNC_REGION'],
  appsyncAuthenticationType: ['SSGT_APPSYNC_AUTHENTICATION_TYPE', 'AWS_APPSYNC_AUTHENTICATION_TYPE'],
  userFilesS3Bucket: ['SSGT_USER_FILES_S3_BUCKET', 'AWS_USER_FILES_S3_BUCKET'],
  userFilesS3BucketRegion: ['SSGT_USER_FILES_S3_BUCKET_REGION', 'AWS_USER_FILES_S3_BUCKET_REGION'],
};

function envValue(names) {
  return names.map((name) => process.env[name]).find(Boolean);
}

const config = Object.fromEntries(
  Object.entries(mappings).map(([key, names]) => [key, envValue(names)])
);

const missing = Object.entries(mappings)
  .filter(([key]) => !config[key])
  .map(([, names]) => names[0]);

if (missing.length > 0) {
  throw new Error(`Missing aws-exports environment variables: ${missing.join(', ')}`);
}

const projectRegion = config.projectRegion;
const dynamoTableName = process.env.SSGT_DYNAMODB_TABLE_NAME || process.env.AWS_DYNAMODB_TABLE_NAME;
const dynamoTablesRegion =
  process.env.SSGT_DYNAMODB_ALL_TABLES_REGION || process.env.AWS_DYNAMODB_ALL_TABLES_REGION || projectRegion;
const dynamoTableRegion =
  process.env.SSGT_DYNAMODB_TABLE_REGION || process.env.AWS_DYNAMODB_TABLE_REGION || projectRegion;

const awsmobile = {
  aws_project_region: projectRegion,
  aws_cognito_identity_pool_id: config.cognitoIdentityPoolId,
  aws_cognito_region: config.cognitoRegion,
  aws_user_pools_id: config.userPoolsId,
  aws_user_pools_web_client_id: config.userPoolsWebClientId,
  oauth: {},
  aws_cognito_username_attributes: ['EMAIL'],
  aws_cognito_social_providers: [],
  aws_cognito_signup_attributes: ['EMAIL', 'NAME'],
  aws_cognito_mfa_configuration: 'OFF',
  aws_cognito_mfa_types: ['SMS'],
  aws_cognito_password_protection_settings: {
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
  },
  aws_cognito_verification_mechanisms: ['EMAIL'],
  aws_appsync_graphqlEndpoint: config.appsyncGraphqlEndpoint,
  aws_appsync_region: config.appsyncRegion,
  aws_appsync_authenticationType: config.appsyncAuthenticationType,
  aws_dynamodb_all_tables_region: dynamoTablesRegion,
  aws_dynamodb_table_schemas: dynamoTableName
    ? [
        {
          tableName: dynamoTableName,
          region: dynamoTableRegion,
        },
      ]
    : [],
  aws_user_files_s3_bucket: config.userFilesS3Bucket,
  aws_user_files_s3_bucket_region: config.userFilesS3BucketRegion,
};

const outputPath = path.join(__dirname, '..', 'src', 'aws-exports.js');
const output = `/* eslint-disable */
// WARNING: This file is generated during CI by scripts/write-aws-exports.js.

const awsmobile = ${JSON.stringify(awsmobile, null, 4)};

export default awsmobile;
`;

fs.writeFileSync(outputPath, output);
console.log(`Wrote ${outputPath}`);
