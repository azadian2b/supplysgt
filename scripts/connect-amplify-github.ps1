[CmdletBinding()]
param(
    [string] $AppId = "d14zgqyeayi7ji",
    [string] $Region = "us-east-1",
    [string] $Repository = "https://github.com/azadian2b/supplysgt",
    [string] $BranchName = "main",
    [string] $BackendEnvironmentArn = "arn:aws:amplify:us-east-1:147830331682:apps/d14zgqyeayi7ji/backendenvironments/dev",
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

Write-Host "Connect Amplify app $AppId to $Repository."
Write-Host "Install the AWS Amplify GitHub App for us-east-1 first and grant it access to azadian2b/supplysgt."
Write-Host "Use a GitHub classic PAT with admin:repo_hook scope. The token is passed to AWS once and is not stored by Amplify."

$secureToken = Read-Host "GitHub PAT" -AsSecureString
$tokenPtr = [IntPtr]::Zero

try {
    $tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)

    Invoke-AwsCli amplify update-app `
        --app-id $AppId `
        --region $Region `
        --repository $Repository `
        --access-token $token `
        --iam-service-role-arn $ServiceRoleArn `
        --enable-branch-auto-build | Out-Null
}
finally {
    if ($tokenPtr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
    }
    Remove-Variable token -ErrorAction SilentlyContinue
    Remove-Variable secureToken -ErrorAction SilentlyContinue
}

& $AwsCli amplify get-branch `
    --app-id $AppId `
    --region $Region `
    --branch-name $BranchName `
    --output json *> $null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating existing Amplify branch $BranchName."
    Invoke-AwsCli amplify update-branch `
        --app-id $AppId `
        --region $Region `
        --branch-name $BranchName `
        --stage PRODUCTION `
        --framework React `
        --enable-auto-build `
        --backend-environment-arn $BackendEnvironmentArn | Out-Null
}
else {
    Write-Host "Creating Amplify branch $BranchName."
    Invoke-AwsCli amplify create-branch `
        --app-id $AppId `
        --region $Region `
        --branch-name $BranchName `
        --stage PRODUCTION `
        --framework React `
        --enable-auto-build `
        --backend-environment-arn $BackendEnvironmentArn | Out-Null
}

if ($StartBuild) {
    Write-Host "Starting Amplify release job for $BranchName."
    Invoke-AwsCli amplify start-job `
        --app-id $AppId `
        --region $Region `
        --branch-name $BranchName `
        --job-type RELEASE | Out-Null
}

Write-Host "Done. Verify the first build before moving supplysgt.net from dev to main."
