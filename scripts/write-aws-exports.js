const fs = require('fs');
const path = require('path');

const required = [
  'AWS_PROJECT_REGION',
  'AWS_COGNITO_IDENTITY_POOL_ID',
  'AWS_COGNITO_REGION',
  'AWS_USER_POOLS_ID',
  'AWS_USER_POOLS_WEB_CLIENT_ID',
  'AWS_APPSYNC_GRAPHQL_ENDPOINT',
  'AWS_APPSYNC_REGION',
  'AWS_APPSYNC_AUTHENTICATION_TYPE',
  'AWS_USER_FILES_S3_BUCKET',
  'AWS_USER_FILES_S3_BUCKET_REGION',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing aws-exports environment variables: ${missing.join(', ')}`);
}

const dynamoTableName = process.env.AWS_DYNAMODB_TABLE_NAME;

const awsmobile = {
  aws_project_region: process.env.AWS_PROJECT_REGION,
  aws_cognito_identity_pool_id: process.env.AWS_COGNITO_IDENTITY_POOL_ID,
  aws_cognito_region: process.env.AWS_COGNITO_REGION,
  aws_user_pools_id: process.env.AWS_USER_POOLS_ID,
  aws_user_pools_web_client_id: process.env.AWS_USER_POOLS_WEB_CLIENT_ID,
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
  aws_appsync_graphqlEndpoint: process.env.AWS_APPSYNC_GRAPHQL_ENDPOINT,
  aws_appsync_region: process.env.AWS_APPSYNC_REGION,
  aws_appsync_authenticationType: process.env.AWS_APPSYNC_AUTHENTICATION_TYPE,
  aws_dynamodb_all_tables_region: process.env.AWS_DYNAMODB_ALL_TABLES_REGION || process.env.AWS_PROJECT_REGION,
  aws_dynamodb_table_schemas: dynamoTableName
    ? [
        {
          tableName: dynamoTableName,
          region: process.env.AWS_DYNAMODB_TABLE_REGION || process.env.AWS_PROJECT_REGION,
        },
      ]
    : [],
  aws_user_files_s3_bucket: process.env.AWS_USER_FILES_S3_BUCKET,
  aws_user_files_s3_bucket_region: process.env.AWS_USER_FILES_S3_BUCKET_REGION,
};

const outputPath = path.join(__dirname, '..', 'src', 'aws-exports.js');
const output = `/* eslint-disable */
// WARNING: This file is generated during CI by scripts/write-aws-exports.js.

const awsmobile = ${JSON.stringify(awsmobile, null, 4)};

export default awsmobile;
`;

fs.writeFileSync(outputPath, output);
console.log(`Wrote ${outputPath}`);
