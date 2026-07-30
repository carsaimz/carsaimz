# Task: Fix Admin Reports - Replace Mock Data with Real Firestore Data

## Summary
Replaced all hardcoded mock data in `admin-reports.tsx` with real data fetched from `/api/stats` and `/api/stats/history` endpoints. Added i18n keys for all previously hardcoded English text across all 8 translation files.

## Changes Made

### 1. `src/components/admin/admin-reports.tsx` - Complete rewrite
- **Removed**: All 3 mock data arrays (`revenueData`, `userGrowthData`, `serviceUsageData`)
- **Added**: `useEffect` + `fetch` to call both `/api/stats` and `/api/stats/history` endpoints
- **Added**: Loading state with skeleton components (`CardSkeleton`, `TableSkeleton`)
- **Added**: Error state with retry button and `AlertCircle` icon
- **Added**: Empty state with `Database` icon and `reportsNoData` message
- **Added**: TypeScript interfaces for API response shapes (`StatsData`, `HistoryData`, etc.)
- **Added**: `formatMonth()` function that uses the user's language locale for date formatting
- **Changed**: All hardcoded English labels now use `t()` calls with i18n keys
- **Changed**: Currency formatting uses `formatCurrency()` from language context
- **Changed**: Revenue Report table shows real data from history API (revenue by month)
- **Changed**: User Growth Report table shows real data from history API (usersGrowth by month)
- **Changed**: Service Usage Report table shows real data from `postsByCategory` from history API
- **Changed**: Summary cards derive values from real API data (totalRevenue, totalBookings, totalNewUsers)

### 2. i18n keys added to all 8 translation files
Added 18 new keys under the `admin` section in each file:

| Key | pt-pt | en-us |
|-----|-------|-------|
| `reportsTotalRevenue` | Receitas Totais | Total Revenue |
| `reportsTotalBookings` | Total de Reservas | Total Bookings |
| `reportsNewUsers` | Novos Utilizadores | New Users |
| `reportsRevenueMonthly` | Relatório de Receitas (Mensal) | Revenue Report (Monthly) |
| `reportsUserGrowth` | Relatório de Crescimento de Utilizadores | User Growth Report |
| `reportsServiceUsage` | Relatório de Utilização de Serviços | Service Usage Report |
| `reportsMonth` | Mês | Month |
| `reportsRevenue` | Receitas | Revenue |
| `reportsBookings` | Reservas | Bookings |
| `reportsAvgPerBooking` | Média por Reserva | Avg. per Booking |
| `reportsNewUsersCol` | Novos Utilizadores | New Users |
| `reportsTotalUsers` | Total de Utilizadores | Total Users |
| `reportsGrowthRate` | Taxa de Crescimento | Growth Rate |
| `reportsService` | Serviço | Service |
| `reportsCount` | Contagem | Count |
| `reportsAvgRevenue` | Receita Média | Avg. Revenue |
| `reportsNoData` | Sem dados disponíveis para gerar relatórios | No data available to generate reports |
| `reportsLoadError` | Falha ao carregar dados dos relatórios | Failed to load reports data |

Files modified:
- `src/lib/translations/pt-pt.ts`
- `src/lib/translations/en-us.ts`
- `src/lib/translations/pt-br.ts`
- `src/lib/translations/fr-fr.ts`
- `src/lib/translations/es-es.ts`
- `src/lib/translations/zh-cn.ts`
- `src/lib/translations/de-de.ts`
- `src/lib/translations/sw-tz.ts`

## Lint Results
- `admin-reports.tsx`: ✅ No errors or warnings
- All translation files: ✅ No errors or warnings
- Pre-existing lint errors in other files (`project-detail.tsx`, `service-detail.tsx`) are unrelated to this change
