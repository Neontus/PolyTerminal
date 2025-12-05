# Generated Anchor Files

This directory contains auto-generated files from the Anchor program build.

## Files

- `idl.json` - Interface Definition Language file from `program/target/idl/prediction_copilot.json`
- `types.ts` - TypeScript types generated from the IDL

## Generation Process

These files are automatically copied when you run:

```bash
pnpm run sync-idl
```

This script:
1. Builds the Anchor program (`cd program && anchor build`)
2. Copies `target/idl/prediction_copilot.json` to this directory
3. Copies `target/types/prediction_copilot.ts` to this directory

## When to Regenerate

Run the sync script after any changes to the Anchor program that affect:
- Account structures (PDAs)
- Instruction definitions
- Program errors
- Events

## Do Not Edit

These files are automatically generated. Any manual changes will be overwritten on the next sync.
