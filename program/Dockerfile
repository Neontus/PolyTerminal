# Use Rust 1.75.0 to match Solana 1.18.x Cargo version
FROM rust:1.75.0

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    build-essential \
    libudev-dev \
    libssl-dev \
    curl \
    wget \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Download and install Solana 1.18.26 for ARM64 Linux
RUN wget https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-release-aarch64-unknown-linux-gnu.tar.bz2 && \
    tar -xjf solana-release-aarch64-unknown-linux-gnu.tar.bz2 && \
    mkdir -p /root/.local/share/solana && \
    cp -r solana-release/* /root/.local/share/solana/ && \
    rm -rf solana-release* && \
    echo 'export PATH="/root/.local/share/solana/bin:$PATH"' >> ~/.bashrc

ENV PATH="/root/.local/share/solana/bin:$PATH"

# Verify Solana installation
RUN solana --version && cargo-build-bpf --version

# Install Anchor 0.29.0 (compatible with Solana 1.18.x and Rust 1.75.0)
RUN cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked

WORKDIR /workspace

# Copy program files
COPY . .

# Build command
CMD ["anchor", "build"]
