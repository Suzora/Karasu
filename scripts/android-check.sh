#!/usr/bin/env bash
# Cargo-checks the tree for Android from Linux with the NDK toolchain exported; the twin of android-check.ps1.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
sdk="${ANDROID_HOME:-/opt/android-sdk}"
ndk="${NDK_HOME:-$(ls -d "$sdk"/ndk/* 2> /dev/null | sort -V | tail -1)}"
if [ -z "$ndk" ] || [ ! -d "$ndk" ]; then
    echo "android-check: no NDK under $sdk/ndk; set NDK_HOME or install one with sdkmanager" >&2
    exit 1
fi

bin="$ndk/toolchains/llvm/prebuilt/linux-x86_64/bin"
# API 24 matches the generated project's minSdk.
export CC_aarch64_linux_android="$bin/aarch64-linux-android24-clang"
export CXX_aarch64_linux_android="$bin/aarch64-linux-android24-clang++"
export AR_aarch64_linux_android="$bin/llvm-ar"
export RANLIB_aarch64_linux_android="$bin/llvm-ranlib"
export CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER="$CC_aarch64_linux_android"
# Its own target dir, so the cross-check does not evict the desktop build's artifacts.
export CARGO_TARGET_DIR="$repo/src-tauri/target/android-check"

cd "$repo/src-tauri"
cargo check --target aarch64-linux-android "$@"
