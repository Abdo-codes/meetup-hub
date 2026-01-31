# Points system

## Purpose
Reward member activity and surface community contributions.

## Data
- `members.points` (total)
- `point_transactions` (audit trail)

## Awarding
- Vote received: +5
- Click received: +1
- Admin awards: variable

## Functions
- `award_points` (RPC)

## UI
- Leaderboard ranks by points
- Dashboard shows last 20 transactions

## Notes / pitfalls
- Public transaction visibility may expose activity; restrict if needed
- Consider anti‑gaming rules (caps per day/month)
