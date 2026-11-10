#!/usr/bin/env bash
# Type-checks the whole crate for Windows from Linux, on the GNU target, whose C side MinGW can build without MSVC.
#
#   scripts/windows-check.sh                    first: apt install mingw-w64, rustup target add x86_64-pc-windows-gnu
#   scripts/windows-check.sh --tests            the test targets too
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo/src-tauri"

if ! command -v x86_64-w64-mingw32-gcc > /dev/null; then
    echo "windows-check: MinGW is missing; run 'apt install mingw-w64' first" >&2
    exit 1
fi
if ! rustup target list --installed | grep -qx x86_64-pc-windows-gnu; then
    echo "windows-check: run 'rustup target add x86_64-pc-windows-gnu' in src-tauri first" >&2
    exit 1
fi

# Its own target dir, so the cross-check does not evict the desktop build's artifacts.
export CARGO_TARGET_DIR="$repo/src-tauri/target/windows-check"
cargo check --target x86_64-pc-windows-gnu "$@"
