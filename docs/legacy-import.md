# Legacy CSV import

## Supported MVP CSV files

### players.csv
Columns:
- `email`
- `displayName`
- `role`
- `legacyScore`
- `bio`

### runs.csv
Columns:
- `playerEmail`
- `title`
- `conditionType`
- `status`
- `pointsAwarded`

### inventory.csv
Columns:
- `playerEmail`
- `itemCode`
- `charges`

## Notes

MVP ships sample files inside `samples/legacy`. The UI and docs expose the format; wiring the import form to a live database is a focused next step.
