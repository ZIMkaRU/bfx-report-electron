# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0] - 2022-12-09

### Added

- Added `ENET` errors for reconnection when fetching data from the `BFX api_v2`. PR: [bfx-report#273](https://github.com/bitfinexcom/bfx-report/pull/273)
- Added ability to use the `inner max` request limit to the `BFX api_v2` to seed up syncing data. PR: [bfx-report#274](https://github.com/bitfinexcom/bfx-report/pull/274)
- Added ability to display minimum derivative fees between sub-accounts. PR: [bfx-reports-framework#241](https://github.com/bitfinexcom/bfx-reports-framework/pull/241)
- Added ability to turn off the auto-update while building releases using the env var `IS_AUTO_UPDATE_DISABLED=1` or the popup of GitHub Actions for `beta` releases [bfx-report-electron#170](https://github.com/bitfinexcom/bfx-report-electron/pull/170)
- Added reports for Turkey. PR: [bfx-report-ui#561](https://github.com/bitfinexcom/bfx-report-ui/pull/561)
- Implemented selected auth type persisting if the `Remember Me` option is selected for improving UX during page/app reloading. PR: [bfx-report-ui#568](https://github.com/bitfinexcom/bfx-report-ui/pull/568)
- Implemented sub-accounts handling progress indicator, to improve UX for the cases when creation/updating requests can take some time due to slow network connection, etc. PR: [bfx-report-ui#573](https://github.com/bitfinexcom/bfx-report-ui/pull/573)

### Changed

- Provided a `new Sync Core` to use temp tables during sync processing. PR: [bfx-reports-framework#240](https://github.com/bitfinexcom/bfx-reports-framework/pull/240). The main idea is to put data fetched from the BFX api_v2 to temp tables to have consistent data in the main tables and allow users to request reports from all sections any time even sync is going on, except the first sync when the DB is empty. When the sync is finished and temp tables are filled all data will be moved to the main tables in one atomic transaction thus users don't have to experience transitional processes. Basic changes:
  - Implemened `new Sync Core` to use temp tables
  - Improved transaction flow to fix the `database is locked` issue
  - Improved handling `ENET` errors from the `BFX api_v2`, added fetching data retries. Related to PR: [bfx-report#275](https://github.com/bitfinexcom/bfx-report/pull/275)
  - Added DB migration `v31`
  - Added create and update timestamps to service tables for easier debugging
  - Significantly reduced the number of requests to the `BFX api_v2`, which increases the speed of the sync
  - Fixed WebSocket timeout connection issue
  - Reduced pragma `analysis_limit` to `400` for performance
  - Used `inner max` request limit to `BFX api_v2` for syncing data to speed up
- Actualized Spanish translations PR: [bfx-report-ui#562](https://github.com/bitfinexcom/bfx-report-ui/pull/562)
- Improved invoices for not merchant users. PR: [bfx-report-ui#565](https://github.com/bitfinexcom/bfx-report-ui/pull/565)
- Increased `Fee Perc` precision in the `Trades` report to 3 decimals for better representation. PR: [bfx-report-ui#570](https://github.com/bitfinexcom/bfx-report-ui/pull/570)

### Fixed

- Fixed WebSocket `GRENACHE_WS_IS_CLOCED` error. PR: [bfx-reports-framework#239](https://github.com/bitfinexcom/bfx-reports-framework/pull/239)
- Fixed `URL` to get API keys when sign-in. PRs: [bfx-report-electron#172](https://github.com/bitfinexcom/bfx-report-electron/pull/172), [bfx-report-ui#582](https://github.com/bitfinexcom/bfx-report-ui/pull/582)
- Fixed incorrect `rate` filter param type and value passing from `Public Funding` report. PR: [bfx-report-ui#553](https://github.com/bitfinexcom/bfx-report-ui/pull/553)
- Fixed reports exporting. PR: [bfx-report-ui#558](https://github.com/bitfinexcom/bfx-report-ui/pull/558)
- Fixed wrong auth via WebSockets for `sub-accounts`. PR: [bfx-report-ui#566](https://github.com/bitfinexcom/bfx-report-ui/pull/566)
- Prevented redirection to the `Sign In` screen after the successful adding a sub-account for improving UX if the user wants to add several sub-accounts in a row. PR: [bfx-report-ui#571](https://github.com/bitfinexcom/bfx-report-ui/pull/571)
- Fixed the possibility of creating several sub-accounts with one request in the `Multiple Accounts` sign up modal same way as we have in the main `Sub Accounts` section. PR: [bfx-report-ui#572](https://github.com/bitfinexcom/bfx-report-ui/pull/572)
- Fixed missed time frame start/end params provided during exporting in CSV for `Average Win/Loss`, `Traded Volume`, `Account Balance`, `Loan` and `Fees` reports. PR: [bfx-report-ui#575](https://github.com/bitfinexcom/bfx-report-ui/pull/575)
- Prevented the possibility for already created `sub-accounts` to being selected for the creation of new one. PR: [bfx-report-ui#576](https://github.com/bitfinexcom/bfx-report-ui/pull/576)
- Fixed issue with the staled `Master Account` still selected after the dropping database, restarting the backend and reloading the app. PR: [bfx-report-ui#577](https://github.com/bitfinexcom/bfx-report-ui/pull/577)
- Prevented the possibility of `Sub Account` creation submission if the `Master Account` hadn't been selected or registered, fixed `Sign Up` modal overlay styling. PR: [bfx-report-ui#578](https://github.com/bitfinexcom/bfx-report-ui/pull/578)
- Fixed issue with stuck sync progress percentage when the main worker is restarted while the synchronization is in progress and UI performs a successful reconnection via WebSockets. PR: [bfx-report-ui#579](https://github.com/bitfinexcom/bfx-report-ui/pull/579)
- Fixed `USDt` symbols and pairs parsing. PR: [bfx-report-ui#580](https://github.com/bitfinexcom/bfx-report-ui/pull/580)
- Fixed `sign-out` issue by providing token. PR: [bfx-report-ui#583](https://github.com/bitfinexcom/bfx-report-ui/pull/583)
- Fixed issues with unavailability for selection registered users while creating `Sub Accounts` in some cases. PR: [bfx-report-ui#584](https://github.com/bitfinexcom/bfx-report-ui/pull/584)

### Security

- Updated dependencies versions to fix vulnerabilities. PRs: [bfx-facs-db-better-sqlite#4](https://github.com/bitfinexcom/bfx-facs-db-better-sqlite/pull/4), [bfx-report-express#28](https://github.com/bitfinexcom/bfx-report-express/pull/28), [bfx-report#276](https://github.com/bitfinexcom/bfx-report/pull/276), [bfx-reports-framework#242](https://github.com/bitfinexcom/bfx-reports-framework/pull/242)

## [3.8.1] - 2022-09-29

### Changed

- Enhanced the fees report for the UI. Changed the `Report Type` selector to have `Trading fees` (by default) and `Funding fees` and `Funding + Trading fees` options. Added `cumulative` result to the chart as on `Loan Report`, PR: [bfx-report-ui#549](https://github.com/bitfinexcom/bfx-report-ui/pull/549). Removed deprecated fees report methods form the backend, PR: [bfx-reports-framework#237](https://github.com/bitfinexcom/bfx-reports-framework/pull/237)

## [3.8.0] - 2022-09-20

### Added

- Added a zipped `AppImage` release of the app to the electron build flow as a simple way to avoid users adding executable permission manually after downloading binary artifact. Also, leaves unzipped `AppImage` release for auto-update. PR: [bfx-report-electron#162](https://github.com/bitfinexcom/bfx-report-electron/pull/162)
- Added `win/loss` vs `previous day balance` results. PR: [bfx-reports-framework#233](https://github.com/bitfinexcom/bfx-reports-framework/pull/233)
- Added one more option to `Select Report Type` selection of the`win/loss` chart: `Percentage Gains (gains/deposits)` and `Percentage Gains (gains/balance)` options. PR: [bfx-report-ui#545](https://github.com/bitfinexcom/bfx-report-ui/pull/545)
- Added `Sum` option to the columns context menu and related logic to show a quick total for numeric values. PR: [bfx-report-ui#538](https://github.com/bitfinexcom/bfx-report-ui/pull/538)
- Implemented copying columns sum up values to the clipboard along with displaying the result. Allowed quick total displaying if sum up value equals 0. PR: [bfx-report-ui#540](https://github.com/bitfinexcom/bfx-report-ui/pull/540)
- Implemented dynamic payload fetching on `Candles` chart scrolling for better representation and UX improvement. PR: [bfx-report-ui#547](https://github.com/bitfinexcom/bfx-report-ui/pull/547)

### Changed

- Enhanced the fees report. Added an additional selector with `Trading fees` (by default) and `Funding fees` and `Funding + Trading fees` options. Added `cumulative` result to the chart as on `Loan Report`. PR: [bfx-reports-framework#234](https://github.com/bitfinexcom/bfx-reports-framework/pull/234)
- Improved properties validation in `Affiliates Earnings`, `Funding`, `Staking Payments` and `Ledgers` reports by defining types/defaults inside the related components for better linting. PR: [bfx-report-ui#541](https://github.com/bitfinexcom/bfx-report-ui/pull/541)
- Improved candles fetching logic to speed up `Go to` specific date feature for `Candles` chart in the `Trades` report. PR: [bfx-report-ui#542](https://github.com/bitfinexcom/bfx-report-ui/pull/542)
- Improved properties validation in `Account Balance`, `Candles`, `Derivatives`, `Candlestick`, and several `Auth` sub-components. PR: [bfx-report-ui#544](https://github.com/bitfinexcom/bfx-report-ui/pull/544)

### Fixed

- Fixed auto-update toast window styles. PR: [bfx-report-electron#161](https://github.com/bitfinexcom/bfx-report-electron/pull/161)
- Fixed `win/loss` vs `account balance` report, fixed percentage calculation for sub-account transfers and for all movements. PR: [bfx-reports-framework#233](https://github.com/bitfinexcom/bfx-reports-framework/pull/233)
- Fixed issues with selected `Unrealized Profits` and `Report Type` params dropping to defaults on `Average Win/Loss` report refresh. PR: [bfx-report-ui#545](https://github.com/bitfinexcom/bfx-report-ui/pull/545)
- Fixed `win/loss` vs `account balance` export to CSV. PR: [bfx-report-ui#546](https://github.com/bitfinexcom/bfx-report-ui/pull/546)

### Security

- Updated dependencies versions. PRs: [bfx-report-ui#539](https://github.com/bitfinexcom/bfx-report-ui/pull/539), [bfx-report-ui#543](https://github.com/bitfinexcom/bfx-report-ui/pull/543)

## [3.7.4] - 2022-08-10

### Added

- Added ability to persist columns adjustments. PR: [bfx-report-ui#530](https://github.com/bitfinexcom/bfx-report-ui/pull/530)
- Implemented selectable charts area and `Sum Up` range values feature for the `Traded Volume` and `Fees` reports. PR: [bfx-report-ui#535](https://github.com/bitfinexcom/bfx-report-ui/pull/535)
- Added `FUSE` technology description for `AppImage` into the documentation section
- Added notification sync is being paused until connection is resumed. PRs: [bfx-report#266](https://github.com/bitfinexcom/bfx-report/pull/266), [bfx-reports-framework#230](https://github.com/bitfinexcom/bfx-reports-framework/pull/230), [bfx-report-ui#537](https://github.com/bitfinexcom/bfx-report-ui/pull/537)

### Changed

- Rounded `Account Summary` displayed values for better representation [bfx-report-ui#534](https://github.com/bitfinexcom/bfx-report-ui/pull/534)
- Updated columns filter configuration to show trades `id` column by default in `Trades` report. PR: [bfx-report-ui#536](https://github.com/bitfinexcom/bfx-report-ui/pull/536)
- Allowed continuing work with the app when reporting errors. This request was got from issue: [#149](https://github.com/bitfinexcom/bfx-report-electron/issues/149)

### Fixed

- Added auth refreshing on re-login via `WebSockets` and fixed issues with broken `HTTP` requests due to the staled token from the previous authorization [bfx-report-ui#532](https://github.com/bitfinexcom/bfx-report-ui/pull/532)
- Fixed issue on `win/loss` results. PR: [bfx-reports-framework#228](https://github.com/bitfinexcom/bfx-reports-framework/pull/228)
- Prevented redundant force-syncing on startup when movements are empty. PR: [bfx-reports-framework#229](https://github.com/bitfinexcom/bfx-reports-framework/pull/229)
- Fixed layout styles of the modal dialogs
- Fixed error window width in order to not has the width as a display screen by default

### Security

- Updated dependencies versions. PRs: [bfx-report-ui#531](https://github.com/bitfinexcom/bfx-report-ui/pull/531), [bfx-report-ui#533](https://github.com/bitfinexcom/bfx-report-ui/pull/533)

## [3.7.3] - 2022-07-08

### Added

- Go to a specific date on the candles chart [bfx-report-ui#527](https://github.com/bitfinexcom/bfx-report-ui/pull/527)
- Add order metadata to csv [bfx-report#264](https://github.com/bitfinexcom/bfx-report/pull/264) and [bfx-report-framework#226](https://github.com/bitfinexcom/bfx-report-framework/pull/226)

### Changed

- Changes is calendar. Picked timezone its also used in the calendar [bfx-report-ui#529](https://github.com/bitfinexcom/bfx-report-ui/pull/529)
- Charts prices representation now has thousands separator [bfx-report-ui#523](https://github.com/bitfinexcom/bfx-report-ui/pull/523)
- Increase limit in candles sync for speed improment [bfx-report#262](https://github.com/bitfinexcom/bfx-report/pull/262) and [bfx-report-framework#224](https://github.com/bitfinexcom/bfx-report-framework/pull/224)


### Fixed

- UI dependencies verification [bfx-report-ui#526](https://github.com/bitfinexcom/bfx-report-ui/pull/526)
- Fixes removing and adding sub accounts [bfx-report-framework#225](https://github.com/bitfinexcom/bfx-report-framework/pull/225)
- Fixes sub-account recalculation [bfx-report-framework#223](https://github.com/bitfinexcom/bfx-report-framework/pull/223)

## [3.7.2] - 2022-06-01

### Added

- Adds Balance(USD) precision selector to the Wallets section. PR: [bfx-report-ui#522](https://github.com/bitfinexcom/bfx-report-ui/pull/522)

### Changed

- Adds logic for merging similar trades, with the same orderId and execPrice, to the one dot on the Candles chart for better representation and readability in the UI. PR: [bfx-report-ui#515](https://github.com/bitfinexcom/bfx-report-ui/pull/515)
- Removes Input Timezone picker from Preferences and related logic for setting and using manually selected timezone for inputs. PR: [bfx-report-ui#521](https://github.com/bitfinexcom/bfx-report-ui/pull/521)
- Adds sub accounts selection persistence in Multiple Accounts login mode in the UI. PR: [bfx-report-ui#518](https://github.com/bitfinexcom/bfx-report-ui/pull/518)

### Fixed

- Fixed issues related to database being locked in sqlite PR: [bfx-reports-framework#221](https://github.com/bitfinexcom/bfx-reports-framework/pull/221)
  - Related to issues: [#146](https://github.com/bitfinexcom/bfx-report-electron/issues/146), [#147](https://github.com/bitfinexcom/bfx-report-electron/issues/147)
- Fixes sync request fail during logout issue. PR: [bfx-report-ui#519](https://github.com/bitfinexcom/bfx-report-ui/pull/519)

## [3.7.1] - 2022-04-28

### Added

- Added option to quickly clear filters in the UI. PR: [bfx-report-ui#501](https://github.com/bitfinexcom/bfx-report-ui/pull/501)
- Added a link to affiliates dashboard on `Affiliates Earnings` page for better conversion and convenience in the UI. PR: [bfx-report-ui#512](https://github.com/bitfinexcom/bfx-report-ui/pull/512)

### Changed

- Bumped UI dependency to have the last fixes. PRs: [bfx-report-ui#500](https://github.com/bitfinexcom/bfx-report-ui/pull/500), [bfx-report-ui#502](https://github.com/bitfinexcom/bfx-report-ui/pull/502), [bfx-report-ui#503](https://github.com/bitfinexcom/bfx-report-ui/pull/503), [bfx-report-ui#504](https://github.com/bitfinexcom/bfx-report-ui/pull/504), [bfx-report-ui#505](https://github.com/bitfinexcom/bfx-report-ui/pull/505), [bfx-report-ui#507](https://github.com/bitfinexcom/bfx-report-ui/pull/507), [bfx-report-ui#508](https://github.com/bitfinexcom/bfx-report-ui/pull/508), [bfx-report-ui#509](https://github.com/bitfinexcom/bfx-report-ui/pull/509)
- Updated language options in the UI. PR: [bfx-report-ui#511](https://github.com/bitfinexcom/bfx-report-ui/pull/511)
- Implemented dynamic price precision showing for different trading pairs on `Candles` chart in the UI. PR: [bfx-report-ui#513](https://github.com/bitfinexcom/bfx-report-ui/pull/513)

### Fixed

- Fixed inconsistency in wallets and earnings. PR: [bfx-reports-framework#218](https://github.com/bitfinexcom/bfx-reports-framework/pull/218)
- Fixed symbol pair splitting to handle pairs with long characters like `tMATICM:USD` and `MATICMF0` etc. PR: [bfx-report#260](https://github.com/bitfinexcom/bfx-report/pull/260)
- Actualized i18next backend in the UI. PR: [bfx-report-ui#510](https://github.com/bitfinexcom/bfx-report-ui/pull/510)

## [3.7.0] - 2022-04-12

### Added

- Added Portuguese language and translations. PRs: [bfx-report-ui#489](https://github.com/bitfinexcom/bfx-report-ui/pull/489), [bfx-report-ui#491](https://github.com/bitfinexcom/bfx-report-ui/pull/491)

### Changed

- Improved using and creating sub-accounts in the UI. PRs: [bfx-report-ui#483](https://github.com/bitfinexcom/bfx-report-ui/pull/483), [bfx-report-ui#484](https://github.com/bitfinexcom/bfx-report-ui/pull/484)

### Fixed

- Fixed the fees of the sub-accounts for the account summary section. Fees should not be added up, should pick the lower of the accounts for each section. PR: [bfx-reports-framework#210](https://github.com/bitfinexcom/bfx-reports-framework/pull/210)
- Fixed double response by WS when sing-in. PRs: [bfx-report-express#25](https://github.com/bitfinexcom/bfx-report-express/pull/25), [bfx-reports-framework#209](https://github.com/bitfinexcom/bfx-reports-framework/pull/209)
- Handle the common network disconnection errors to be able to continue the sync process if the internet connection is failed and then restored for not more than 10 min (will try to get data again at intervals of 10 sec).
  - Related to issues: [#131](https://github.com/bitfinexcom/bfx-report-electron/issues/131), [#135](https://github.com/bitfinexcom/bfx-report-electron/issues/135), [#138](https://github.com/bitfinexcom/bfx-report-electron/issues/138), [#139](https://github.com/bitfinexcom/bfx-report-electron/issues/139).
  - PRs: [bfx-report#257](https://github.com/bitfinexcom/bfx-report/pull/257), [bfx-reports-framework#208](https://github.com/bitfinexcom/bfx-reports-framework/pull/208), [bfx-api-node-rest#95](https://github.com/bitfinexcom/bfx-api-node-rest/pull/95)
- Fixed copy-paste table data issue in the UI. PR: [bfx-report-ui#486](https://github.com/bitfinexcom/bfx-report-ui/pull/486)
- Removed redundant translations request. PR: [bfx-report-ui#488](https://github.com/bitfinexcom/bfx-report-ui/pull/488)
- Fixed copy metadata in the UI. PR: [bfx-report-ui#490](https://github.com/bitfinexcom/bfx-report-ui/pull/490)
- Fixed invoices table values copy in the UI. PR: [bfx-report-ui#492](https://github.com/bitfinexcom/bfx-report-ui/pull/492)
- Fixed account summary fees tables titles in the UI. PR: [bfx-report-ui#493](https://github.com/bitfinexcom/bfx-report-ui/pull/493)
- Fixed merchant payment data copy in the UI. PR: [https://github.com/bitfinexcom/bfx-report-ui#496](https://github.com/bitfinexcom/bfx-report-ui/pull/496)

### Security

- Updated/Hardcoded dependencies versions

## [3.6.3] - 2022-01-12

### Added

- Added usd equivalents columns to ledgers csv export. This request was got from issue: [#114](https://github.com/bitfinexcom/bfx-report-electron/issues/114)

### Fixed

- Fixed data consistency error message, while DB is being synced, we should display the message that: `This particular endpoints are not available for the selected time frame while DB is being synced`
- Fixed `Logins` metadata duplicated data preview on mobiles

## [3.6.2] - 2021-12-17

### Added

- Added ability to `backup/restore` DB
- Added ability to track server worker errors
- Added `changelog` file and flow to show one in the modal dialog after the app was updated

### Fixed

- Fixed snapshots tickers. The issue is the following: when taking a snapshot of wallets it's not showing the correspondent tickers as to represent crypto in fiat equivalent
- Fixed error manager

### Changed

- Updated electron version up to `13.6.3`

## [3.6.1] - 2021-11-03

### Fixed

- Fixed `account summary` response for sub-account
- Fixed issue with app crashing on `Start Snapshot` and related `React` errors

### Added

- Added `win/loss` vs `account balance` report
- Added `Show Unrealized Profits` selectors to `Average Win/Loss` and `Account Balance` sections
