param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("up", "down", "logs", "ps")]
  [string] $Command,

  [string] $Service = "postgres"
)

$docker = Get-Command docker -ErrorAction SilentlyContinue

if (-not $docker) {
  $dockerDesktopCli = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
  if (Test-Path -LiteralPath $dockerDesktopCli) {
    $docker = [pscustomobject]@{ Source = $dockerDesktopCli }
  }
}

if (-not $docker) {
  throw "Docker CLI was not found on PATH or in the Docker Desktop default install location."
}

switch ($Command) {
  "up" {
    & $docker.Source compose up -d $Service
  }
  "down" {
    & $docker.Source compose down
  }
  "logs" {
    & $docker.Source compose logs -f $Service
  }
  "ps" {
    & $docker.Source compose ps $Service
  }
}
