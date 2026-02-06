import { describe, test, expect } from 'vitest';
import {
  getTierClass,
  getLeadStatusClass,
  getPartnershipStatusClass,
  getHealthColor,
  getPhaseIndex,
  priorityColors,
} from '@/lib/utils/statusClasses';

describe('getTierClass', () => {
  test('returns blue classes for discovery', () => {
    expect(getTierClass('discovery')).toContain('blue');
  });

  test('returns purple classes for foundation', () => {
    expect(getTierClass('foundation')).toContain('purple');
  });

  test('returns amber classes for architect', () => {
    expect(getTierClass('architect')).toContain('amber');
  });

  test('returns empty string for unknown tier', () => {
    expect(getTierClass('unknown')).toBe('');
  });
});

describe('getLeadStatusClass', () => {
  test('returns empty for new status', () => {
    expect(getLeadStatusClass('new')).toBe('');
  });

  test('returns warning tag for contacted', () => {
    expect(getLeadStatusClass('contacted')).toBe('tag-warning');
  });

  test('returns success tag for qualified', () => {
    expect(getLeadStatusClass('qualified')).toBe('tag-success');
  });

  test('returns success tag for converted', () => {
    expect(getLeadStatusClass('converted')).toBe('tag-success');
  });

  test('returns empty for unknown status', () => {
    expect(getLeadStatusClass('unknown')).toBe('');
  });
});

describe('getPartnershipStatusClass', () => {
  test('returns yellow for onboarding', () => {
    expect(getPartnershipStatusClass('onboarding')).toContain('yellow');
  });

  test('returns tag-success for active', () => {
    expect(getPartnershipStatusClass('active')).toBe('tag-success');
  });

  test('returns green for graduated', () => {
    expect(getPartnershipStatusClass('graduated')).toContain('green');
  });

  test('returns empty for unknown status', () => {
    expect(getPartnershipStatusClass('unknown')).toBe('');
  });
});

describe('getHealthColor', () => {
  test('returns green for health >= 80', () => {
    expect(getHealthColor(80)).toContain('green');
    expect(getHealthColor(100)).toContain('green');
  });

  test('returns yellow for health 60-79', () => {
    expect(getHealthColor(60)).toContain('yellow');
    expect(getHealthColor(79)).toContain('yellow');
  });

  test('returns red for health < 60', () => {
    expect(getHealthColor(59)).toContain('red');
    expect(getHealthColor(0)).toContain('red');
  });
});

describe('getPhaseIndex', () => {
  test('returns correct index for each phase', () => {
    expect(getPhaseIndex('discover')).toBe(0);
    expect(getPhaseIndex('co-create')).toBe(1);
    expect(getPhaseIndex('deploy')).toBe(2);
    expect(getPhaseIndex('independent')).toBe(3);
  });

  test('returns -1 for unknown phase', () => {
    expect(getPhaseIndex('unknown')).toBe(-1);
  });
});

describe('priorityColors', () => {
  test('has high priority color (red)', () => {
    expect(priorityColors.high).toContain('red');
  });

  test('has medium priority color (orange)', () => {
    expect(priorityColors.medium).toContain('orange');
  });

  test('has low priority color (green)', () => {
    expect(priorityColors.low).toContain('green');
  });
});
