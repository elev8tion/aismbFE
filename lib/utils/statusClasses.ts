export function getTierClass(tier: string) {
  switch (tier) {
    case 'discovery': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'foundation': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'architect': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return '';
  }
}

export function getLeadStatusClass(status: string) {
  switch (status) {
    case 'new': return '';
    case 'contacted': return 'tag-warning';
    case 'qualified': return 'tag-success';
    case 'converted': return 'tag-success';
    default: return '';
  }
}

export function getPartnershipStatusClass(status: string) {
  switch (status) {
    case 'onboarding': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'active': return 'tag-success';
    case 'graduated': return 'bg-green-500/20 text-green-400 border-green-500/30';
    default: return '';
  }
}

export function getHealthColor(health: number) {
  if (health >= 80) return 'text-green-400';
  if (health >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export function getPhaseIndex(phase: string) {
  const phases = ['discover', 'co-create', 'deploy', 'independent'];
  return phases.indexOf(phase);
}

export const priorityColors = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-orange-500/20 text-orange-400',
  low: 'bg-green-500/20 text-green-400',
} as const;
