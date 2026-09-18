export const OVERDUE_DAYS = 7;

export const OUTCOMES = [
  'Called',
  'Replied',
  'Left a message',
  'No answer',
  'Engaged us',
  'Went elsewhere',
] as const;

export type Outcome = (typeof OUTCOMES)[number];

export type OutcomeRecord = {
  outcome: Outcome;
  at: string;
};

export type RowState = 'open' | 'engaged' | 'lost';

export type BoardRow = {
  id: string;
  created_at: string;
  person: string;
  firm: string;
  matter: string;
  fee_cents: number;
  kind: string;
  state: RowState;
  first_seen_at: string;
  last_contact_at: string | null;
  outcomes: OutcomeRecord[] | null;
};

const DAY_MS = 86_400_000;

export function recordsOf(row: BoardRow): OutcomeRecord[] {
  return Array.isArray(row.outcomes) ? row.outcomes : [];
}

export function lastTouchAt(row: BoardRow): string {
  const records = recordsOf(row);

  if (records.length > 0) {
    return records[records.length - 1].at;
  }

  return row.last_contact_at ?? row.first_seen_at;
}

export function hasBeenContacted(row: BoardRow): boolean {
  return recordsOf(row).length > 0 || row.last_contact_at !== null;
}

export function daysSince(iso: string, now: number): number {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return 0;
  }

  return Math.max(0, Math.floor((now - then) / DAY_MS));
}

export function daysSinceLastContact(row: BoardRow, now: number): number {
  return daysSince(lastTouchAt(row), now);
}

export function isOverdue(row: BoardRow, now: number): boolean {
  return daysSinceLastContact(row, now) >= OVERDUE_DAYS;
}

export function openRows(rows: BoardRow[]): BoardRow[] {
  return rows.filter((row) => row.state === 'open');
}

export function closedCount(rows: BoardRow[]): number {
  return rows.filter((row) => row.state !== 'open').length;
}

export function sortForBoard(rows: BoardRow[], now: number): BoardRow[] {
  return [...rows].sort((a, b) => {
    const aOverdue = isOverdue(a, now) ? 1 : 0;
    const bOverdue = isOverdue(b, now) ? 1 : 0;

    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue;
    }

    return daysSinceLastContact(b, now) - daysSinceLastContact(a, now);
  });
}

export function moneyStillOpenCents(rows: BoardRow[]): number {
  return rows.reduce((sum, row) => {
    return sum + (Number.isFinite(row.fee_cents) ? row.fee_cents : 0);
  }, 0);
}

export function overdueCount(rows: BoardRow[], now: number): number {
  return rows.reduce((count, row) => count + (isOverdue(row, now) ? 1 : 0), 0);
}

export function stateAfterOutcome(outcome: Outcome): RowState | null {
  if (outcome === 'Engaged us') {
    return 'engaged';
  }

  if (outcome === 'Went elsewhere') {
    return 'lost';
  }

  return null;
}

export function outcomePatch(row: BoardRow, outcome: Outcome, at: string): Partial<BoardRow> {
  const outcomes = [...recordsOf(row), { outcome, at }];
  const nextState = stateAfterOutcome(outcome);

  return {
    outcomes,
    last_contact_at: at,
    ...(nextState !== null ? { state: nextState } : {}),
  };
}

export function formatMoney(cents: number): string {
  const safe = Number.isFinite(cents) ? cents : 0;

  return (safe / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function daysLabel(row: BoardRow, now: number): string {
  const days = daysSinceLastContact(row, now);

  if (!hasBeenContacted(row)) {
    return days === 0 ? 'Never contacted' : days + (days === 1 ? ' day on the board, never contacted' : ' days on the board, never contacted');
  }

  if (days === 0) {
    return 'Contacted today';
  }

  return days + (days === 1 ? ' day since last contact' : ' days since last contact');
}
