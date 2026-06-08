[CmdletBinding()]
param(
    [string] $Owner = "azadian2b",
    [string] $Repo = "supplysgt"
)

$ErrorActionPreference = "Stop"

function Convert-SecureStringToPlainText {
    param([securestring] $SecureString)

    $tokenPtr = [IntPtr]::Zero
    try {
        $tokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
        [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPtr)
    }
    finally {
        if ($tokenPtr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPtr)
        }
    }
}

function Invoke-GitHubGet {
    param(
        [string] $Path,
        [string] $Token
    )

    $headers = @{
        Authorization = "Bearer $Token"
        Accept = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
        "User-Agent" = "SupplySGT-Amplify-Preflight"
    }

    try {
        $response = Invoke-WebRequest `
            -Uri "https://api.github.com$Path" `
            -Headers $headers `
            -UseBasicParsing `
            -Method Get

        [pscustomobject]@{
            Path = $Path
            StatusCode = $response.StatusCode
            Success = $true
            Message = "OK"
            Headers = $response.Headers
            Body = $response.Content
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        [pscustomobject]@{
            Path = $Path
            StatusCode = $statusCode
            Success = $false
            Message = $_.Exception.Message
            Headers = $_.Exception.Response.Headers
            Body = $null
        }
    }
}

Write-Host "Paste the same GitHub PAT you plan to use for Amplify. The token will not be printed."
$secureToken = Read-Host "GitHub PAT" -AsSecureString
$token = (Convert-SecureStringToPlainText -SecureString $secureToken).Trim()

try {
    $userResult = Invoke-GitHubGet -Path "/user" -Token $token
    $repoResult = Invoke-GitHubGet -Path "/repos/$Owner/$Repo" -Token $token
    $hookResult = Invoke-GitHubGet -Path "/repos/$Owner/$Repo/hooks" -Token $token

    Write-Host ""
    Write-Host "GitHub user access:  $($userResult.StatusCode) $($userResult.Message)"
    Write-Host "GitHub repo access:  $($repoResult.StatusCode) $($repoResult.Message)"
    Write-Host "GitHub hook access:  $($hookResult.StatusCode) $($hookResult.Message)"

    if ($userResult.Success -and $userResult.Body) {
        $user = $userResult.Body | ConvertFrom-Json
        Write-Host "Token user:          $($user.login)"
    }

    if ($repoResult.Success -and $repoResult.Body) {
        $repoInfo = $repoResult.Body | ConvertFrom-Json
        if ($repoInfo.permissions) {
            Write-Host "Repo permissions:    admin=$($repoInfo.permissions.admin) maintain=$($repoInfo.permissions.maintain) push=$($repoInfo.permissions.push) pull=$($repoInfo.permissions.pull)"
        }
    }

    $scopes = $userResult.Headers["X-OAuth-Scopes"]
    if (-not $scopes) {
        $scopes = $hookResult.Headers["X-OAuth-Scopes"]
    }
    if (-not $scopes) {
        $scopes = $repoResult.Headers["X-OAuth-Scopes"]
    }

    if ($scopes) {
        Write-Host "Token scopes seen:   $scopes"
    }

    if ($repoResult.Success -and $hookResult.Success) {
        Write-Host "Preflight passed. This token can see the repo and list repository hooks."
        exit 0
    }

    Write-Host "Preflight failed. Amplify will likely fail until GitHub App access or PAT scopes are fixed."
    exit 1
}
finally {
    Remove-Variable token -ErrorAction SilentlyContinue
    Remove-Variable secureToken -ErrorAction SilentlyContinue
}
