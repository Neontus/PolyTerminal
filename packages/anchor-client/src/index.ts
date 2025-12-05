export {
  createPredictionCopilotClient,
  deriveAnalystProfilePDA,
  deriveSignalPDA,
  deriveSignalAccessPDA,
  deriveProgramConfigPDA,
} from './client';

// Export types when they exist (after sync-idl)
export type { PredictionCopilot } from './generated/types';
