'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBoardClient, getSettings } from '@/lib/supabase';
import {
  type BoardRow,
  type Outcome,
  OUTCOMES,
  OVERDUE_DAYS,
  closedCount,
  daysLabel,
  daysSinceLastContact,
  formatMoney,
  isOverdue,
  moneyStillOpenCents,
  openRows,
  outcomePatch,
  overdueCount,
  recordsOf,
  sortForBoard,
} from '@/lib/board';

type LoadState = 'loading' | 'ready' | 'failed';

function looksLikeMissingTable(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes('does not exist') ||
    lower.includes('schema cache') ||
    lower.includes('relation') ||
    lower.includes('could not find the table')
  );
}

export default function Page() {
  const settings = useMemo(() => getSettings(), []);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastOutcome, setLastOutcome] = useState('');

  const load = useCallback(async () => {
    if (settings.missing.length > 0) {
      return;
    }

    setState('loading');

    try {
      const client = createBoardClient();
      const { data, error } = await client.from('board_rows').select('*');

      if (error) {
        setErrorMessage(error.message);
        setState('failed');
        return;
      }

      setRows((data ?? []) as BoardRow[]);
      setNow(Date.now());
      setState('ready');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setState('failed');
    }
  }, [settings.missing.length]);

  useEffect(() => {
    void load();
  }, [load]);

  const logOutcome = useCallback(
    async (row: BoardRow, outcome: Outcome) => {
      setBusyId(row.id);

      try {
        const client = createBoardClient();
        const patch = outcomePatch(row, outcome, new Date().toISOString());
        const { error } = await client.from('board_rows').update(patch).eq('id', row.id);

        if (error) {
          setErrorMessage(error.message);
          setState('failed');
          return;
        }

        setLastOutcome(row.person + ' — ' + outcome);
        await load();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setState('failed');
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  if (settings.missing.length > 0) {
    return (
      <main className="shell">
        <Header />
        <section className="panel panel-missing">
          <h2>A setting is missing</h2>
          <p>The board cannot start until these are set in <span className="mono">.env.local</span>:</p>
          <ul>
            {settings.missing.map((name) => (
              <li key={name}>
                <span className="mono">{name}</span>
              </li>
            ))}
          </ul>
          <p>
            <span className="mono">.env.local</span> must sit next to <span className="mono">package.json</span>. Add the
            missing value, then restart the dev server — Next.js only reads that file at start-up.
          </p>
        </section>
      </main>
    );
  }

  const open = openRows(rows);
  const sorted = state === 'ready' ? sortForBoard(open, now) : [];

  return (
    <main className="shell">
      <Header />

      {state === 'loading' && (
        <section className="panel panel-loading">
          <h2>Loading the board…</h2>
          <p>Reading the rows from Supabase.</p>
        </section>
      )}

      {state === 'failed' && (
        <section className="panel panel-failed">
          <h2>Could not load the board from Supabase</h2>
          <p>
            The settings are present, but the request failed. Nothing on this screen is cached — the board is showing
            you the failure instead of an empty list.
          </p>
          <p className="detail">{errorMessage}</p>
          {looksLikeMissingTable(errorMessage) && (
            <p>
              That message usually means the table has not been created yet. Run the first SQL block from
              <span className="mono"> supabase-schema.sql </span> in the Supabase SQL editor, then refresh.
            </p>
          )}
          <p>
            <button type="button" className="pill" onClick={() => void load()}>
              Try again
            </button>
          </p>
        </section>
      )}

      {state === 'ready' && open.length === 0 && (
        <section className="panel panel-empty">
          <h2>The table is empty</h2>
          <p>
            Supabase answered, and there are no open rows. The board is working — there is simply nothing on it yet.
          </p>
          <p>
            Run the second SQL block from <span className="mono">supabase-schema.sql</span> to add the demo data, then
            refresh this page.
          </p>
        </section>
      )}

      {state === 'ready' && open.length > 0 && (
        <>
          <section className="stats">
            <article className="stat">
              <span className="stat-label">Money still open</span>
              <strong className="stat-value">{formatMoney(moneyStillOpenCents(open))}</strong>
              <span className="stat-foot">
                across {open.length} open {open.length === 1 ? 'row' : 'rows'}
              </span>
            </article>
            <article className="stat stat-alert">
              <span className="stat-label">Overdue</span>
              <strong className="stat-value">{overdueCount(open, now)}</strong>
              <span className="stat-foot">nothing logged for {OVERDUE_DAYS} days or more</span>
            </article>
          </section>

          <p className="definition">
            A row is overdue when nothing has been logged against it for {OVERDUE_DAYS} days or more. Overdue rows are
            flagged and sorted to the top.
          </p>

          {lastOutcome !== '' && <p className="definition">Last logged: {lastOutcome}</p>}

          <ul className="board">
            {sorted.map((row) => {
              const overdue = isOverdue(row, now);
              const records = recordsOf(row);
              const last = records.length > 0 ? records[records.length - 1] : null;

              return (
                <li key={row.id} className={overdue ? 'row row-overdue' : 'row'}>
                  <div className="row-top">
                    <div>
                      <span className="person">{row.person}</span>
                      <span className="firm">{row.firm}</span>
                    </div>
                    <span className="row-money">{formatMoney(row.fee_cents)}</span>
                  </div>

                  <div className="row-mid">
                    <span className="matter">{row.matter}</span>
                    <span className="tag">
                      {row.kind === 'documents' ? 'Owes documents' : 'New enquiry'}
                    </span>
                  </div>

                  <div className="row-meta">
                    <span className={overdue ? 'days-overdue' : undefined}>{daysLabel(row, now)}</span>
                    {overdue && <span className="badge">Overdue</span>}
                    {last && <span>Last: {last.outcome}</span>}
                    <span>{daysSinceLastContact(row, now)}d</span>
                  </div>

                  <div className="actions">
                    {OUTCOMES.map((outcome) => (
                      <button
                        key={outcome}
                        type="button"
                        className="pill"
                        disabled={busyId === row.id}
                        onClick={() => void logOutcome(row, outcome)}
                      >
                        {outcome}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="foot">
            {closedCount(rows)} closed {closedCount(rows) === 1 ? 'row is' : 'rows are'} hidden from the board. Totals
            above count open rows only.
          </p>
        </>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="head">
      <span className="eyebrow">KAMFA AI Solutions</span>
      <h1>Intake follow-up board</h1>
      <span className="sub">Open enquiries and clients who owe documents, with the money still at risk.</span>
    </header>
  );
}
