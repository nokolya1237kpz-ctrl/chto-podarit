export type ImportJobStatus = 'idle' | 'running' | 'success' | 'warning' | 'error';

export interface ImportJobReport {
  source: string;
  total: number;
  importedActive: number;
  importedDraft: number;
  skipped: number;
  errors: string[];
  status: ImportJobStatus;
}
