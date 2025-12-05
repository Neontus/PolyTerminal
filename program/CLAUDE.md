# Anchor Program

Solana smart contract for Prediction Copilot built with Anchor.

## Structure

```
programs/
└── prediction-copilot/
    └── src/
        ├── lib.rs           # Program entrypoint & instruction routing
        ├── instructions/    # Instruction logic (one file per instruction)
        ├── state/           # Account structs & PDA definitions
        └── errors.rs        # Custom error codes
tests/                       # TypeScript integration tests
Anchor.toml                  # Configuration
```

## Development

### Commands

```bash
anchor build                           # Compile program
anchor test                            # Run integration tests
anchor deploy --provider.cluster devnet # Deploy to devnet
```

### Key Concepts

#### PDAs (Program Derived Addresses)
- **AnalystProfile**: `["analyst", analyst_pubkey]`
- **Signal**: `["signal", analyst_pubkey, signal_id_bytes]`
- **SignalAccess**: `["access", signal_pda, consumer_pubkey]`
- **ProgramConfig**: `["config"]`

#### Instructions
- `init_analyst`: Initialize a new analyst profile.
- `publish_signal`: Publish a prediction signal (requires Pyth price).
- `purchase_signal`: Buy access to a signal (transfers USDC).
- `resolve_signal`: Settle a signal based on outcome.

## Testing

Run `anchor test` to execute the test suite in `tests/`.
Tests should cover:
- Happy paths for all instructions.
- Error cases (unauthorized access, invalid params).
- PDA derivation verification.
- Bankrun tests for faster execution (optional but recommended).

## Deployment

1. `anchor build`
2. `solana address -k target/deploy/prediction_copilot-keypair.json` -> Update `declare_id!` in `lib.rs` and `Anchor.toml`.
3. `anchor build` (again to bake in new ID).
4. `anchor deploy`
