export function isSetupEffort(value: unknown): value is 'medium' | 'high' {
  return value === 'medium' || value === 'high'
}

export const setupSettings = [
  { key: 'reasoningEffort', stepId: 'set-effort', criterionId: 'effort-matches', label: 'Effort', expectedLabel: 'Medium hoặc High', matches: isSetupEffort },
  { key: 'approvalMode', stepId: 'set-approval', criterionId: 'approval-matches', label: 'Approval', expectedLabel: 'Approve for me', matches: (value: unknown) => value === 'approve-for-me' }
] as const
