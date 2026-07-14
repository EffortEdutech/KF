Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

corepack pnpm lint
corepack pnpm test
corepack pnpm build
