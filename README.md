# Intake follow-up board

A follow-up board for open enquiries and clients who owe documents. Each row shows
the person, the firm, the matter, the fee at stake and the days since last contact.

Logging an outcome, such as called or replied, updates the total money still open
and the count overdue. Anything untouched for seven days or more is flagged in
colour and sorted to the top of the board.

## Running it locally

1. Install the dependencies: `npm install`
2. Create a file called `.env.local` next to `package.json` containing:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Run `supabase-schema.sql` in the Supabase SQL editor, one block at a time, to
   create the table and load the demo data.
4. Start it with `npm run dev` and open http://localhost:3000

`.env.local` holds the browser key and is git-ignored. It must never be committed.

## What you will see

The board has three separate states so an empty screen is never ambiguous: a
missing setting is named, a failed call to Supabase shows the error, and an empty
table says so plainly.
