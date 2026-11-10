<# Starts the built Windows exe in portable mode and fails when it does not stay up or its log holds a panic. #>

param(
    [int]$Seconds = 20
)

$ErrorActionPreference = "Stop"

# Two levels: scripts/release/ -> scripts/ -> repo root.
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $repoRoot "package.json"))) {
    throw "Repo root resolved to '$repoRoot', which holds no package.json -- did this script move?"
}
$exe = Join-Path $repoRoot "src-tauri/target/release/karasu.exe"
if (-not (Test-Path $exe)) {
    throw "No karasu.exe found at $exe"
}

# The marker keeps the database, the log and the token beside the exe, so the run touches nothing else on the machine.
$dir = Split-Path -Parent $exe
$marker = Join-Path $dir "karasu.portable"
$data = Join-Path $dir "data"
New-Item -ItemType File -Path $marker -Force | Out-Null

$failure = $null
$process = Start-Process -FilePath $exe -PassThru
try {
    Start-Sleep -Seconds $Seconds
    $process.Refresh()
    if ($process.HasExited) {
        $failure = "karasu.exe ended by itself within $Seconds s, exit code $($process.ExitCode)"
    }
    $log = Join-Path $data "karasu.log"
    if (Test-Path $log) {
        $panics = @(Select-String -Path $log -Pattern "ERROR\s+panic" | ForEach-Object { $_.Line })
        if ($panics.Count -gt 0) {
            $failure = "karasu.log holds $($panics.Count) panic(s):`n" + ($panics -join "`n")
        }
        Write-Host "--- the last lines of karasu.log ---"
        Get-Content $log -Tail 15 | Write-Host
    } elseif (-not $failure) {
        $failure = "karasu.exe stayed up but wrote no karasu.log under $data"
    }
} finally {
    if (-not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
        $process.WaitForExit(10000) | Out-Null
    }
    Remove-Item $marker -Force -ErrorAction SilentlyContinue
    Remove-Item $data -Recurse -Force -ErrorAction SilentlyContinue
}

if ($failure) {
    Write-Host "SMOKE FAIL: $failure"
    exit 1
}
Write-Host "smoke-windows: karasu.exe stayed up for $Seconds s and logged no panic"
