param(
  [int]$IntervalSeconds = 15,
  [switch]$Once
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repo

function Write-Info($m){ Write-Host $m -ForegroundColor Gray }
function Write-Good($m){ Write-Host $m -ForegroundColor Green }
function Write-Warn2($m){ Write-Host $m -ForegroundColor Yellow }
function Write-Bad($m){ Write-Host $m -ForegroundColor Red }

function Invoke-Git([string[]]$GitArgs){
  if(-not $GitArgs -or $GitArgs.Count -eq 0){ throw 'AUTO-SYNC internal error: empty git arguments' }
  $out = & git @GitArgs 2>&1
  if($LASTEXITCODE -ne 0){ throw ($out -join [Environment]::NewLine) }
  return $out
}

function Test-Dirty {
  $status = & git status --porcelain=v1 --untracked-files=normal
  return [bool]($status | Where-Object { $_ -and ($_ -notmatch '^!!') })
}

function Sync-Once {
  try {
    $branch = (& git rev-parse --abbrev-ref HEAD).Trim()
    if($branch -ne 'main'){
      Write-Warn2 "AUTO-SYNC beklemede: aktif branch '$branch'. main branch'e gecince devam eder."
      return
    }

    Invoke-Git -GitArgs @('fetch','origin','main') | Out-Null

    $head = (& git rev-parse HEAD).Trim()
    $remote = (& git rev-parse origin/main).Trim()
    if($head -eq $remote){
      return
    }

    $behind = [int]((& git rev-list --count HEAD..origin/main).Trim())
    $ahead  = [int]((& git rev-list --count origin/main..HEAD).Trim())

    if($behind -eq 0){
      if($ahead -gt 0){ Write-Warn2 "Local main origin/main'den $ahead commit ileride; otomatik pull yapilmadi." }
      return
    }

    Write-Host ""
    Write-Warn2 "Yeni SIDE:II surumu bulundu..."
    Write-Info "GitHub main: $behind yeni commit"

    $stashMade = $false
    $stashName = "sideii-autosync-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

    if(Test-Dirty){
      Write-Info "Yerel degisiklikler guvenli stash'e aliniyor..."
      $stashOut = & git stash push -u -m $stashName 2>&1
      if($LASTEXITCODE -ne 0){ throw ($stashOut -join [Environment]::NewLine) }
      $stashMade = ($stashOut -notmatch 'No local changes')
    }

    $oldHead = $head
    $pullOut = & git pull --rebase origin main 2>&1
    if($LASTEXITCODE -ne 0){
      Write-Bad "Git guncellemesi basarisiz."
      Write-Host ($pullOut -join [Environment]::NewLine)
      if($stashMade){ Write-Warn2 "Yerel degisiklikler stash'te guvende: $stashName" }
      return
    }

    $newHead = (& git rev-parse HEAD).Trim()
    Write-Good "GitHub main guncellendi: $($oldHead.Substring(0,7)) -> $($newHead.Substring(0,7))"

    $depsChanged = $false
    $changed = & git diff --name-only $oldHead $newHead
    if($changed -contains 'package.json' -or $changed -contains 'package-lock.json'){
      $depsChanged = $true
    }

    if($depsChanged){
      Write-Info "Dependency degisikligi algilandi; npm install calistiriliyor..."
      & npm install
      if($LASTEXITCODE -ne 0){
        Write-Bad "npm install basarisiz. Git guncellendi fakat dependency kurulumu kontrol edilmeli."
      } else {
        Write-Good "npm install tamamlandi."
      }
    }

    if($stashMade){
      Write-Info "Yerel degisiklikler geri yukleniyor..."
      $popOut = & git stash pop 2>&1
      if($LASTEXITCODE -ne 0){
        Write-Bad "Stash otomatik geri uygulanirken conflict olustu."
        Write-Warn2 "Degisiklik kaybolmadi; stash kaydi korunuyor. 'git status' ile conflictleri kontrol et."
        Write-Host ($popOut -join [Environment]::NewLine)
        return
      }
      Write-Good "Yerel degisiklikler geri yuklendi."
    }

    Write-Good "Otomatik guncelleme tamamlandi."
  }
  catch {
    Write-Bad "AUTO-SYNC hata: $($_.Exception.Message)"
  }
}

Write-Good "SIDE:II AUTO-SYNC v2 aktif."
Write-Info "GitHub main $IntervalSeconds saniyede bir kontrol ediliyor."
Write-Info "Dirty working tree: stash -> pull/rebase -> npm install gerekirse -> stash restore."

do {
  Sync-Once
  if($Once){ break }
  Start-Sleep -Seconds ([Math]::Max(5,$IntervalSeconds))
} while($true)
