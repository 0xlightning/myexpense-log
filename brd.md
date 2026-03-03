# Business Requirements Document (BRD) - Personal Expenses App

## 1. Project Overview
The **Personal Expenses App** is a comprehensive financial ledger and tracking application built using React and Firebase. It is designed to help users accurately track their income, monitor expenses, manage investments, handle credit/debt, and perform inter-account transfers. The application relies on a double-entry-like ledger system where every financial action updates specific account balances and is logged in a master transaction ledger, ensuring all entries are balanced to prevent errors.

## 2. Business Objectives
- Provide users with a unified dashboard to monitor their net worth, available balances, spending patterns, and budget adherence.
- Enable granular tracking of money flow across multiple accounts, including debit, credit, and cash, with support for recurring transactions and alerts.
- Offer specific modules for different types of financial activities: Income, Expenditure, Transfers, Credit Management, Investments, and Budgeting.
- Ensure data security, privacy, and real-time syncing using Firebase Authentication and Firestore, while supporting offline access where feasible.

## 3. Target Audience
Individuals who need a detailed and structured way to manage their personal finances, track multiple bank accounts or credit cards, and maintain a clear ledger of investments and debts. This includes young professionals, families, and small business owners seeking simple yet robust tools without bank integrations.

## 4. Scope
- **In Scope**: User authentication, manual transaction entry, double-entry logging, dashboard visualizations, budgeting tools, investment updates, credit tracking, and basic reporting functionalities.
- **Out of Scope**: Automatic bank syncing, cryptocurrency tracking, advanced tax calculations, or multi-user collaboration (e.g., family sharing).

## 5. Stakeholders
- **Primary**: End-users (individuals managing personal finances).
- **Secondary**: Developers and maintainers for implementation; potential future investors or partners for scalability.
- **Key Contacts**: Project sponsor (e.g., app owner), business analyst, and technical lead.

## 6. Assumptions and Dependencies
- Users have basic financial literacy and will enter data manually.
- Firebase services remain available and cost-effective for the app's scale.
- Dependencies include stable internet for syncing, though offline caching will handle temporary disruptions.

## 7. Risks and Mitigations
- **Risk**: Data privacy breaches – Mitigated by strict Firebase security rules and user education on authentication.
- **Risk**: Transaction errors due to user input – Mitigated by atomic transactions and validation checks.
- **Risk**: Performance issues with large datasets – Mitigated by Firestore indexing and pagination in queries.

## 8. Key Features & Functional Requirements

### 8.1 Authentication & User Management
- **Feature**: Secure login and session management.
- **Requirement**: Users must authenticate using Firebase Auth (email/password or Google) before accessing data. Records tied to `userId`. Support guest mode for trial use with limited features.

### 8.2 Dashboard
- **Feature**: Centralized overview of the user's financial health.
- **Requirement**: Display net worth (sum of Debit/Cash balances minus Credit balances plus investment values, excluding limits). Include visual charts for income vs. expenses, category breakdowns, budget progress, and recent transactions. Add bill reminders and spending forecasts based on trends.

### 8.3 Account / Card Management
- **Feature**: Manage multiple payment methods (Cards, Cash, Credit).
- **Requirement**: Users create 'Cards' with type (Credit, Debit/Cash), initial balance, and limits. Debit/Cash: balance = available funds. Credit: balance = owed, available = limit - balance. Enforce double-entry balancing on modifications.

### 8.4 Income Module
- **Feature**: Record incoming funds.
- **Requirement**: Specify amount, date, source category, destination card (Debit/Cash only), optional note, and custom name for "Other". Increases balance; logs to income_records and transactions. Support recurring incomes with reminders.

### 8.5 Expenditure Module
- **Feature**: Record outgoing funds.
- **Requirement**: Capture amount, date, category, funding card, optional note, and custom name for "Other". For Debit/Cash: decrease balance. For Credit: increase owed, check limit. Logs to expenditure_records.

### 8.6 Transfer / Exchange Module
- **Feature**: Move money between owned accounts.
- **Requirement**: Transfer from one card to another, including credit payments (Debit/Cash to Credit reduces owed). Deduct source, add destination, log paired entries. Enforce balance checks.

### 8.7 Credit Management
- **Feature**: Track debts and credit usage.
- **Requirement**: Log expenses against credit; track 'Open' status, utilization alerts (<30% recommended). Ensure limits not exceeded; integrate with subscriptions for recurring charges.

### 8.8 Investment Tracking
- **Feature**: Record funds moved to investment assets.
- **Requirement**: Reduces cash balance, logs separately. Allow manual updates for market values/returns as income. Supports notes and custom categories; track growth via charts.

### 8.9 Budgeting Module (New)
- **Feature**: Set and monitor budgets.
- **Requirement**: Users define monthly/annual budgets per category (e.g., groceries limit $500). Track progress against actual spending; send alerts for nearing/over limits. Support zero-based budgeting option where all income is allocated.

### 8.10 Reporting
- **Feature**: Financial summaries and subscription tracking.
- **Requirement**: Display summaries within the dashboard like tax-ready expense reports or yearly overviews. Include subscription management to track and cancel recurring expenses.

## 9. Non-Functional Requirements
- **Performance**: Load efficiently; near-real-time sync. Use Firestore indexing for queries.
- **Responsiveness**: UI responsive across devices.
- **Robustness**: Atomic transactions via `runTransaction`. Offline support via Firebase caching.
- **Security**: Implement Firestore rules to restrict data access to authenticated userId. Encrypt sensitive data; comply with basic privacy standards (e.g., GDPR-like).
- **Scalability**: Handle up to 10,000 transactions per user without degradation.

## 10. Data Model & Architecture
Under `users/{userId}/`:
- `cards`: Account details.
- `income_records`, `expenditure_records`, `transfers`, `on_credit`, `investments`: As before.
- `budgets`: Category limits and progress.
- `transactions`: Master ledger.

## 11. Technology Stack
- **Frontend**: React 19.
- **Routing**: React Router DOM.
- **Styling**: Tailwind CSS, clsx, tailwind-merge.
- **Icons**: Lucide React.
- **Charts**: Recharts.
- **Backend/Database**: Firebase (Auth, Firestore).
- **Date Formatting**: date-fns.
- **Additional**: React Firebase Hooks for easier integration.