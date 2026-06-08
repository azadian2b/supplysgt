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
    SSGT_PROJECT_REGION = "us-east-1"
    SSGT_COGNITO_IDENTITY_POOL_ID = "us-east-1:412f871c-97a9-4e1f-95a5-2b362307a24e"
    SSGT_COGNITO_REGION = "us-east-1"
    SSGT_USER_POOLS_ID = "us-east-1_GzkyUvzWd"
    SSGT_USER_POOLS_WEB_CLIENT_ID = "6orvthkmh7hmusd7iao6it08eu"
    SSGT_APPSYNC_GRAPHQL_ENDPOINT = "https://6ckwzr4phzafpfscbcrlux77hu.appsync-api.us-east-1.amazonaws.com/graphql"
    SSGT_APPSYNC_REGION = "us-east-1"
    SSGT_APPSYNC_AUTHENTICATION_TYPE = "AMAZON_COGNITO_USER_POOLS"
    SSGT_DYNAMODB_ALL_TABLES_REGION = "us-east-1"
    SSGT_DYNAMODB_TABLE_NAME = "dynamo4062985a-dev"
    SSGT_DYNAMODB_TABLE_REGION = "us-east-1"
    SSGT_USER_FILES_S3_BUCKET = "supplysgtapp143c061359bc4407bdefc8dd9b6c476ea792b-dev"
    SSGT_USER_FILES_S3_BUCKET_REGION = "us-east-1"
} | ConvertTo-Json -Compress

$buildSpecFile = New-TemporaryFile
$environmentVariablesFile = New-TemporaryFile
Set-Content -LiteralPath $buildSpecFile.FullName -Value $buildSpec -NoNewline
Set-Content -LiteralPath $environmentVariablesFile.FullName -Value $environmentVariables -NoNewline

$buildSpecFileUri = "file://$($buildSpecFile.FullName -replace '\\', '/')"
$environmentVariablesFileUri = "file://$($environmentVariablesFile.FullName -replace '\\', '/')"

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
        --environment-variables $environmentVariablesFileUri `
        --build-spec $buildSpecFileUri `
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
    Remove-Item -LiteralPath $buildSpecFile.FullName -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $environmentVariablesFile.FullName -Force -ErrorAction SilentlyContinue
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
