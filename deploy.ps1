param([string]$GhPath = 'gh')
$ErrorActionPreference = 'Stop'
$siteRoot = $PSScriptRoot

function Invoke-Gh {
    param([string[]]$Arguments)
    $result = & $GhPath @Arguments
    if ($LASTEXITCODE -ne 0) { throw "GitHub CLI failed: gh $($Arguments -join ' ')" }
    return $result
}
function Invoke-Git {
    param([string[]]$Arguments)
    $result = & git -C $siteRoot @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Git failed: git $($Arguments -join ' ')" }
    return $result
}

Get-Command $GhPath -ErrorAction Stop | Out-Null
Get-Command git,node -ErrorAction Stop | Out-Null
& $GhPath auth status
if ($LASTEXITCODE -ne 0) { throw 'Sign in first with gh auth login --web, then run this script again.' }
$account = (Invoke-Gh -Arguments @('api', 'user')) | ConvertFrom-Json
$login = $account.login
$repoName = "$($login.ToLowerInvariant()).github.io"
$fullName = "$login/$repoName"
$remoteUrl = "https://github.com/$fullName.git"
$siteUrl = "https://$repoName/"
$profilePath = Join-Path $siteRoot 'data/profile.json'
$profile = Get-Content -LiteralPath $profilePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($profile.email -ne '2686705997@bupt.edu.cn') {
    throw 'The email differs from the confirmed OpenReview address. Review it before publishing.'
}
$profile.githubUsername = $login
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($profilePath, ($profile | ConvertTo-Json -Depth 10) + [Environment]::NewLine, $utf8)
& node (Join-Path $siteRoot 'tools/build.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

# Work only in this website directory. Never stage an ancestor repository.
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot '.git'))) {
    Invoke-Git -Arguments @('init', '-b', 'main') | Out-Host
}
$top = (Invoke-Git -Arguments @('rev-parse', '--show-toplevel')).Trim()
if ([IO.Path]::GetFullPath($top) -ne [IO.Path]::GetFullPath($siteRoot)) { throw 'Unexpected repository root.' }
Invoke-Git -Arguments @('config', 'user.name', 'Yanzhou Wang') | Out-Null
Invoke-Git -Arguments @('config', 'user.email', "$($account.id)+$login@users.noreply.github.com") | Out-Null
Invoke-Gh -Arguments @('auth', 'setup-git') | Out-Host
$origin = & git -C $siteRoot remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    if ($origin.Trim() -notin @($remoteUrl, "https://github.com/$fullName", "git@github.com:$fullName.git")) {
        throw 'The existing origin is a different repository. Inspect it before publishing.'
    }
} else {
    $existing = & $GhPath api "repos/$fullName" 2>$null
    if ($LASTEXITCODE -eq 0) {
        throw "Repository $fullName already exists. Inspect it and set this checkout's origin before retrying; this script will not overwrite an existing site."
    }
}
Invoke-Git -Arguments @('add', 'index.html', 'styles.css', '.nojekyll', '.gitignore', 'robots.txt', 'sitemap.xml', 'data', 'tools', 'README.md', 'deploy.ps1') | Out-Null
& git -C $siteRoot diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
    Invoke-Git -Arguments @('commit', '-m', 'Publish academic homepage for Yanzhou Wang') | Out-Host
} elseif ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged changes.' }
if (-not $origin) {
    Invoke-Gh -Arguments @('repo', 'create', $fullName, '--public', '--description', 'Yanzhou Wang | Academic homepage | BUPT', '--source', $siteRoot, '--remote', 'origin', '--push') | Out-Host
} else {
    $visibility = (Invoke-Gh -Arguments @('api', "repos/$fullName", '--jq', '.visibility')).Trim()
    if ($visibility -ne 'public') { throw 'The existing repository must be public. Review its visibility in GitHub before publishing.' }
    Invoke-Git -Arguments @('push', '-u', 'origin', 'HEAD:main') | Out-Host
}

$pagesInfo = & $GhPath api "repos/$fullName/pages" 2>$null
if ($LASTEXITCODE -ne 0) {
    '{"build_type":"legacy","source":{"branch":"main","path":"/"}}' | & $GhPath api --method POST "repos/$fullName/pages" --input -
    if ($LASTEXITCODE -ne 0) { throw "Enable Pages manually at https://github.com/$fullName/settings/pages (Deploy from a branch: main / root)." }
} else {
    $pages = $pagesInfo | ConvertFrom-Json
    if ($pages.build_type -ne 'legacy' -or $pages.source.branch -ne 'main' -or $pages.source.path -ne '/') {
        throw 'An existing Pages configuration differs from main / root. Inspect it before changing it.'
    }
}
'{"https_enforced":true}' | & $GhPath api --method PUT "repos/$fullName/pages" --input -
if ($LASTEXITCODE -ne 0) { Write-Warning 'HTTPS enforcement is not ready yet. Check Settings > Pages after the certificate is issued.' }

Write-Host "Repository: https://github.com/$fullName"
Write-Host "Waiting for the public HTTPS site: $siteUrl"
$verified = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri $siteUrl -UseBasicParsing -TimeoutSec 15
        $body = $response.Content
        $expected = @('Yanzhou Wang', 'Beijing University of Posts and Telecommunications', $profile.email, 'Network Coding Enhanced Semantic Communications in Internet of Vehicles', 'Disturbance-Rejection Control Strategies and Algorithms for Autonomous Underwater Vehicles and Unmanned Aerial Vehicles: A Cross-Domain Survey')
        $missing = @($expected | Where-Object { -not $body.Contains($_) })
        if ($response.StatusCode -eq 200 -and $missing.Count -eq 0) {
            Write-Host "Verified public HTTPS homepage: $siteUrl"
            $verified = $true
            break
        }
    } catch { Write-Host "Build not ready yet (attempt $attempt/30)." }
    Start-Sleep -Seconds 10
}
if (-not $verified) { throw "Source is pushed and Pages is configured, but public content is not yet verified. Check https://github.com/$fullName/actions and retry $siteUrl later." }
