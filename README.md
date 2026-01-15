# ServiceVerified

**Problem:** Court compliance tracking is chaotic—paper logs get lost, spreadsheets aren't auditable, and miscalculations risk legal consequences.

**Solution:** ServiceVerified is a Python CLI that generates immutable audit logs for every service hour logged. It calculates real-time burn rates against your deadline and exports professional timesheet reports.

## What You Get
- Tamper-proof SQLite logging (every entry is timestamped and permanent)
- Automated burn rate analysis (know if you're on track without manual math)
- Court-ready timesheets (professional formatting, export on demand)

## Quick Start
```bash
# Log service hours
python service_finder.py add "Community Center" 4.0 "2026-01-15"

# Generate compliance report
python service_finder.py report
```

## Who This Is For
Individuals managing court-ordered community service requirements who need professional-grade record-keeping without enterprise software complexity.

## Technical Details
- **Language:** Python 3.x
- **Database:** SQLite (auto-generated on first run)
- **Architecture:** Immutable append-only logging with timestamp verification

## License
MIT License
