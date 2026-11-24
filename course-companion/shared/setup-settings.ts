export function isSetupEffort(value: unknown): value is 'medium' | 'high' {
  return value === 'medium' || value === 'high'
}

export const setupSettings = [
  { key: 'reasoningEffort', criterionId: 'effort-matches', label: 'Effort', expectedLabel: 'Medium hoặc High', matches: isSetupEffort },
  { key: 'approvalPolicy', criterionId: 'approval-matches', label: 'Approval', expectedLabel: 'Approve for me', matches: (value: unknown) => value === 'on-request' },
  { key: 'fullAccess', criterionId: 'full-access-off', label: 'Full access', expectedLabel: 'Off', matches: (value: unknown) => value === 'off' }
] as const
