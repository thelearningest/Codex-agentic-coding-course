export function isSetupEffort(value: unknown): value is 'medium' | 'high' {
  return value === 'medium' || value === 'high'
}

export const setupSettings = [
  { key: 'reasoningEffort', stepId: 'set-effort', criterionId: 'effort-matches', label: 'Effort', expectedLabel: 'Medium hoặc High', matches: isSetupEffort },
  { key: 'approvalPolicy', stepId: 'set-approval', criterionId: 'approval-matches', label: 'Approval', expectedLabel: 'Approve for me', matches: (value: unknown) => value === 'on-request' },
  { key: 'fullAccess', stepId: 'disable-full-access', criterionId: 'full-access-off', label: 'Full access', expectedLabel: 'Off', matches: (value: unknown) => value === 'off' }
] as const
