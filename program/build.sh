#!/bin/bash
# Build script that handles Cargo.lock v4 issue

export PATH="$HOME/.local/share/solana/bin:$HOME/.cargo/bin:$PATH"

echo "Using Anchor version:"
anchor --version

echo "Fixing Cargo.lock version..."
if [ -f "Cargo.lock" ]; then
    sed -i.bak 's/^version = 4$/version = 3/' Cargo.lock
    echo "Downgraded Cargo.lock to version 3"
fi

echo "Building program..."
anchor build "$@"
