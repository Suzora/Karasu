<# Fills the from-source Flatpak: the git source at a tag or HEAD, the vendored cargo and npm sources, the release. #>

param(
    [string]$Tag = "",
    [switch]$Local,
    [string]$Commit = "",
    [string]$SourceUrl = "",
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

# Two levels: scripts/release/ -> scripts/ -> repo root.
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$src = Join-Path $repoRoot "packaging/flatpak"
if (-not $OutDir) { $OutDir = Join-Path $src "out" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
# Absolute from here on: .NET and `git -C` would resolve a relative one against another folder than this shell's.
$OutDir = (Resolve-Path -LiteralPath $OutDir).ProviderPath
$id = "io.github.Suzora.Karasu"

# The generators and the shared modules, each pinned so the same tag always yields the same manifest.
$toolsCommit = "74697c75b630d7330e77250fc13cb5ea688d9479"
$sharedCommit = "cb9ec602a1ece1c76d5a4f8aa1d87c4a6bf99c3e"

if (-not $Tag -and -not $Local) { throw "Pass -Tag vX.Y.Z for a release, or -Local for this clone's HEAD." }

# A native tool's stderr is progress until it fails, and then it is the reason, so it is kept and shown only then.
function Invoke-Quiet([scriptblock]$Command) {
    $saved = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { $out = & $Command 2>&1 | ForEach-Object { "$_" } } finally { $ErrorActionPreference = $saved }
    if ($LASTEXITCODE -ne 0) {
        $what = $ExecutionContext.InvokeCommand.ExpandString($Command.ToString()).Trim()
        throw "failed (exit $LASTEXITCODE): $what`n$($out -join "`n")"
    }
}

# A Windows path as WSL mounts it, for the parts that must run on Linux.
function ConvertTo-WslPath([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path)
    if ($full -match '^([A-Za-z]):\\(.*)$') { return "/mnt/" + $Matches[1].ToLower() + "/" + ($Matches[2] -replace '\\', '/') }
    return $full
}

# A clone at one commit, fetched only when it is not already there.
function Get-Pinned([string]$Url, [string]$Dir, [string]$Commit) {
    if (-not (Test-Path $Dir)) { Invoke-Quiet { git clone --quiet $Url $Dir } }
    $saved = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $have = git -C $Dir cat-file -t $Commit 2>$null
    $ErrorActionPreference = $saved
    if ($have -ne "commit") { Invoke-Quiet { git -C $Dir fetch --quiet origin } }
    Invoke-Quiet { git -C $Dir checkout --quiet --detach $Commit }
}

if ($Local) {
    # A commit other than HEAD, such as one `git stash create` made of the working tree, must sit on a branch to be fetched.
    $commit = if ($Commit) { $Commit } else { (git -C $repoRoot rev-parse HEAD).Trim() }
    if (-not $SourceUrl) {
        # flatpak-builder runs on Linux, so a Windows clone is named the way WSL mounts it.
        $SourceUrl = "file://" + (ConvertTo-WslPath (Resolve-Path $repoRoot).Path)
    }
    $refLines = "        commit: $commit"
    $version = (Get-Content (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json).version
    $date = (git -C $repoRoot show -s --format=%cs $commit).Trim()
    $releaseTag = "v$version"
} else {
    Invoke-Quiet { git -C $repoRoot fetch --quiet origin "refs/tags/${Tag}:refs/tags/${Tag}" }
    $commit = (git -C $repoRoot rev-list -n 1 $Tag).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $commit) { throw "Tag $Tag is not in this clone." }
    if (-not $SourceUrl) { $SourceUrl = "https://github.com/Suzora/Karasu.git" }
    $refLines = "        tag: $Tag`n        commit: $commit"
    $version = ($Tag -replace "^v", "")
    # The tag's own date rather than today's, so a manifest regenerated later still says when the release was.
    $published = (gh release view $Tag --json publishedAt --jq .publishedAt)
    if ($LASTEXITCODE -ne 0) { throw "gh could not read release $Tag" }
    $date = ([DateTime]$published).ToString("yyyy-MM-dd")
    $releaseTag = $Tag
}

# A tag from before the source build has no desktop file to install, and would fail only after the whole compile.
$saved = $ErrorActionPreference
$ErrorActionPreference = "Continue"
git -C $repoRoot cat-file -e "${commit}:packaging/flatpak/$id.desktop" 2>$null
$hasDesktop = $LASTEXITCODE -eq 0
$ErrorActionPreference = $saved
if (-not $hasDesktop) { throw "$($commit.Substring(0, 7)) predates the from-source Flatpak: it has no packaging/flatpak/$id.desktop." }

# The lockfiles as that commit holds them, byte for byte, which a zip keeps and a text pipe would not.
$work = Join-Path $OutDir ".work"
if (Test-Path $work) { Remove-Item -Recurse -Force $work }
New-Item -ItemType Directory -Force -Path $work | Out-Null
$zip = Join-Path $work "locks.zip"
Invoke-Quiet { git -C $repoRoot archive --format=zip -o $zip $commit src-tauri/Cargo.lock package-lock.json }
Expand-Archive -Path $zip -DestinationPath $work -Force

$tools = Join-Path $OutDir ".tools/flatpak-builder-tools"
Get-Pinned "https://github.com/flatpak/flatpak-builder-tools.git" $tools $toolsCommit
Get-Pinned "https://github.com/flathub/shared-modules.git" (Join-Path $OutDir "shared-modules") $sharedCommit

$cargoGen = Join-Path $tools "cargo/flatpak-cargo-generator.py"
$cargoOut = Join-Path $OutDir "cargo-sources.json"
Invoke-Quiet { uv run --quiet --no-project --with "aiohttp>=3.9.5,<4" --with "PyYAML>=6.0.2,<7" --with "tomlkit>=0.13.3,<1" python $cargoGen (Join-Path $work "src-tauri/Cargo.lock") -o $cargoOut }
$nodeOut = Join-Path $OutDir "node-sources.json"
$nodeLock = Join-Path $work "package-lock.json"
if ($env:OS -eq "Windows_NT") {
    # The npm generator joins its paths with the host's separator, so on Windows it runs inside WSL instead.
    $venv = "~/.cache/karasu-flatpak-node"
    $bash = "set -e; python3 -m venv $venv; $venv/bin/pip install --quiet '$(ConvertTo-WslPath (Join-Path $tools "node"))'; " +
        "$venv/bin/flatpak-node-generator npm '$(ConvertTo-WslPath $nodeLock)' -o '$(ConvertTo-WslPath $nodeOut)'"
    Invoke-Quiet { wsl.exe -e bash -c $bash }
} else {
    Invoke-Quiet { uv tool run --quiet --from (Join-Path $tools "node") flatpak-node-generator npm $nodeLock -o $nodeOut }
}

# UTF-8 said outright: Windows PowerShell reads a file without a BOM in the ANSI codepage, which breaks every dash.
$source = "      - type: git`n        url: $SourceUrl`n$refLines"
$manifest = Get-Content (Join-Path $src "$id.yml") -Raw -Encoding UTF8
$manifest = $manifest.Replace("      - SOURCE_TO_FILL", $source)
[IO.File]::WriteAllText((Join-Path $OutDir "$id.yml"), $manifest, [Text.UTF8Encoding]::new($false))

$meta = Get-Content (Join-Path $src "$id.metainfo.xml") -Raw -Encoding UTF8
$meta = $meta.Replace("RELEASE_TO_FILL", $version).Replace("DATE_TO_FILL", $date).Replace("TAG_TO_FILL", $releaseTag)
[IO.File]::WriteAllText((Join-Path $OutDir "$id.metainfo.xml"), $meta, [Text.UTF8Encoding]::new($false))
Copy-Item (Join-Path $src "flathub.json") (Join-Path $OutDir "flathub.json") -Force
Remove-Item -Recurse -Force $work

Write-Output "flatpak-manifest: $($commit.Substring(0, 7)) ($version) -> $OutDir"
