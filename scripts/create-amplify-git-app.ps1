[CmdletBinding()]
param(
    [string] $Name = "supplysgtapp-prod-git",
    [string] $Region = "us-east-1",
    [string] $Repository = "https://github.com/azadian2b/supplysgt",
    [string] $BranchName = "main",
    [string] $ServiceRoleArn = "arn:aws:iam::147830331682:role/AmplifyConsoleServiceRole-AmplifyRole",
    [string] $AwsCli = "C:\Program Files\Amazon\AWSCLIV2\aws.exe",
    [switch] $StartBuild
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $AwsCli)) {
    $AwsCli = "aws"
}

function Invoke-AwsCli {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]] $Arguments
    )

    & $AwsCli @Arguments
    if ($LASTEXITCODE -ne 0) {
        $safeArguments = for ($index = 0; $index -lt $Arguments.Count; $index++) {
            if ($Arguments[$index] -in @("--access-token", "--oauth-token")) {
                $index++
                "<redacted>"
            }
            else {
                $Arguments[$index]
            }
        }

        throw "aws $($safeArguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

$buildSpec = Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot "..\amplify.yml")
$environmentVariables = @{
    GENERATE_AWS_EXPORTS = "true"
    SKIP_AMPLIFY_PUSH = "true"
    AWS_PROJECT_REGION = "us-east-1"
    AWS_COGNITO_IDENTITY_POOL_ID = "us-east-1:412f871c-97a9-4e1f-95a5-2b362307a24e"
    AWS_COGNITO_REGION = "us-east-1"
    AWS_USER_POOLS_ID = "us-east-1_GzkyUvzWd"
    AWS_USER_POOLS_WEB_CLIENT_ID = "6orvthkmh7hmusd7iao6it08eu"
    AWS_APPSYNC_GRAPHQL_ENDPOINT = "https://6ckwzr4phzafpfscbcrlux77hu.appsync-api.us-east-1.amazonaws.com/graphql"
    AWS_APPSYNC_REGION = "us-east-1"
    AWS_APPSYNC_AUTHENTICATION_TYPE = "AMAZON_COGNITO_USER_POOLS"
    AWS_DYNAMODB_ALL_TABLES_REGION = "us-east-1"
    AWS_DYNAMODB_TABLE_NAME = "dynamo4062985a-dev"
    AWS_DYNAMODB_TABLE_REGION = "us-east-1"
    AWS_USER_FILES_S3_BUCKET = "supplysgtapp143c061359bc4407bdefc8dd9b6c476ea792b-dev"
    AWS_USER_FILES_S3_BUCKET_REGION = "us-east-1"
} | ConvertTo-Json -Compress

Write-Host "Create a new Git-connected Amplify app for $Repository."
Write-Host "Use a fresh GitHub classic PAT with admin:repo_hook scope. Do not reuse a token that appeared in chat or terminal logs."

$secureToken = Read-Host "GitHub PAT" -AsSecureString
$tokenPtr = [IntPtr]::Zero

try {
    $tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)

    $appJson = & $AwsCli amplify create-app `
        --name $Name `
        --region $Region `
        --repository $Repository `
        --platform WEB `
        --access-token $token `
        --iam-service-role-arn $ServiceRoleArn `
        --enable-branch-auto-build `
        --environment-variables $environmentVariables `
        --build-spec $buildSpec `
        --output json

    if ($LASTEXITCODE -ne 0) {
        throw "aws amplify create-app --access-token <redacted> failed with exit code $LASTEXITCODE"
    }
}
finally {
    if ($tokenPtr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
    }
    Remove-Variable token -ErrorAction SilentlyContinue
    Remove-Variable secureToken -ErrorAction SilentlyContinue
}

$app = ($appJson | ConvertFrom-Json).app
$appId = $app.appId

Write-Host "Created Amplify app $appId."
Invoke-AwsCli amplify create-branch `
    --app-id $appId `
    --region $Region `
    --branch-name $BranchName `
    --stage PRODUCTION `
    --framework React `
    --enable-auto-build | Out-Null

if ($StartBuild) {
    Write-Host "Starting Amplify release job for $BranchName."
    Invoke-AwsCli amplify start-job `
        --app-id $appId `
        --region $Region `
        --branch-name $BranchName `
        --job-type RELEASE | Out-Null
}

Write-Host "Done. Validate https://$BranchName.$appId.amplifyapp.com before moving supplysgt.net."
