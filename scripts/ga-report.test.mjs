import { test } from 'node:test';
import assert from 'node:assert/strict';
import { period } from './ga-report.mjs';

// 13:00 UTC = 8:00 Bogotá, when the routine runs.
test('Monday report covers Friday to Sunday', () => {
  assert.deepEqual(period(new Date('2026-11-16T13:00:00Z'), []), { from: '2026-11-13', to: '2026-11-15' });
});

test('Friday report covers Monday to Thursday', () => {
  assert.deepEqual(period(new Date('2026-11-13T13:00:00Z'), []), { from: '2026-11-09', to: '2026-11-12' });
});

test('other days cover the last 7 days; Bogotá date, not UTC', () => {
  // 2026-11-11 02:00 UTC is still Tuesday the 10th in Bogotá
  assert.deepEqual(period(new Date('2026-11-11T02:00:00Z'), []), { from: '2026-11-03', to: '2026-11-09' });
});

test('--from/--to override the period', () => {
  assert.deepEqual(period(new Date(), ['--from', '2026-11-01', '--to', '2026-11-07']), { from: '2026-11-01', to: '2026-11-07' });
});
