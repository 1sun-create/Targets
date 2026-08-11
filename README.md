# Moneyphilo — Discipline Tracker

A mobile-first, local-only daily target and bankroll discipline tracker for trading and gambling use.

## Files
- `index.html` — app structure
- `style.css` — responsive Light/Dark UI
- `app.js` — accounts, calculations, daily results, monthly report, local storage, import/export

## Main behavior
1. Front page is intentionally simple:
   - Today's Win Target
   - Today's Stop-Loss
   - Current Bankroll
   - Today's P&L
   - Progress
   - WIN / LOSS / NO TRADE
2. WIN and LOSS open a confirmation sheet where the user enters the actual P&L.
3. Once a result is recorded, that account's day is closed. This is designed to discourage chasing.
4. Monthly Report shows every day as a compact green/red/neutral grid.
5. Light/Dark theme is saved locally.
6. Multiple independent accounts are supported. Each account has:
   - name
   - starting bankroll
   - target %
   - stop-loss %
   - planned days
   - purpose
   - independent result history
7. Data is stored in the browser's localStorage.
8. Settings includes JSON backup export/import.
9. Compounding Calculator is at the bottom of the Today page.

## Important calculation
Daily target amount = current bankroll × target percentage.

Daily stop-loss amount = current bankroll × stop-loss percentage.

Today's target card shows the bankroll level after achieving the planned target:
current bankroll + target amount.

The calculator uses:
starting bankroll × (1 + daily rate) ^ planned days

This is a mathematical projection, not a promise of profit.

## Run
Open `index.html` in a modern browser. No server or build step is required.

For GitHub Pages:
1. Create/open the repository.
2. Upload all three files.
3. Keep `index.html` in the repository root.
4. Enable Pages from the repository settings and select the branch/root folder.

## Data safety
This version is local-first. Browser storage can be cleared by the device/browser, so use Export Backup periodically if the data matters.
