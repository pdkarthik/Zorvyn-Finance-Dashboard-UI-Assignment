# Finance Dashboard UI - Comprehensive Documentation

> **Finance Dashboard UI assignment for the Frontend Developer Intern position at Zorvyn.**
>
> 🌐 **Live Demo:** 🔗 https://zorvyn-finance-dashboard-ui-assignm.vercel.app

A modern, responsive, and dynamic web application for managing and analyzing personal or business finances. This dashboard provides a comprehensive view of transactions, cash flow trends, and categorical expenses, specifically designed with high-quality UI/UX principles, smooth animations, and robust filtering capabilities.

---

## 🛠️ Extensive Overview of the Approach & Architecture

The application is built as a highly modular **Single Page Application (SPA)** using **React** and **Vite**. From data ingestion to visual rendering, the project emphasizes a clean separation of concerns:

- **Component-Driven Architecture**: The UI is broken down into reusable logical pieces (e.g., `Card`, `Button`, `Modal`, `SafeIcon`). Pages (`Dashboard.jsx`, `Transactions.jsx`, `Insights.jsx`) act as containers that consume these smaller presentational components.
- **Global State Management**: Redux, paired with Redux Thunk, drives the application's central nervous system.
  - **Asynchronous Operations**: Data fetching, creating, updating, and deleting transactions are handled gracefully with full `loading` and `isProcessing` states to prevent race conditions or duplicate submissions.
  - **Synchronous Actions**: Global preferences like filters, selected roles, theme (Dark/Light mode), and data grouping configurations reside centrally.
- **Persistent Mock Data Layer**: Transaction data is persisted to **`localStorage`** via the mock API layer (`src/api/mockApi.js`), ensuring that adds, edits, and deletes survive page refreshes without a real backend. The storage key is versioned (`finance_transactions_v1`) so updates to the seed data propagate cleanly.
- **SPA Routing Fix**: A `vercel.json` rewrite rule ensures direct URL access and page refreshes (e.g., `/transactions`, `/insights`) are handled correctly in production by always serving `index.html`.
- **Responsive & Semantic Design**: Leveraging **Tailwind CSS**, the layout smoothly transitions across screen sizes. A collapsible mobile sidebar and adaptive flex/grid configurations ensure information is readable everywhere.
- **State-of-the-Art Visualizations**: **Apache ECharts** (`echarts-for-react`) handles rendering large sets of financial data smoothly on a canvas, scaling axes automatically and applying theme rules (Dark/Light) inherently.

---

## 🚀 Deep Dive: Output & Features Breakdown

The project delivers three core functional views — Dashboard, Transactions, and Insights — surrounded by global functional layers.

### 1. Global Interactions & UI Wrapper
- **Dark/Light Mode**: Fully integrated theming. Toggling the theme applies an HTML `.dark` class, propagating precise color shifts (`blue-900/30`, `text-white`, `bg-gray-800`) avoiding stark pitch-black contrasts for a premium soft-dark look.
- **Role-Based Access Control (RBAC)**: Currently supports simulated `admin` and `viewer` roles. While `admin` users can utilize "Add", "Edit", and "Delete" capabilities, viewers are restricted strictly to read-only outputs such as charts, tables, and downloading reports.
- **Toast Notifications System**: Fully integrated global toast notifications overlay that informs users instantly when transactions succeed or fail, automatically disappearing after 3 seconds.

### 2. Dashboard View (`/`)
The entry point of the app, designed to output an immediate health check of the user's finances.
- **Top Metrics Strip**: Calculates **Total Balance**, **Total Income**, and **Total Expenses** accurately by iterating through state transaction arrays. Each metric rests in an animated Framer Motion card.
- **AI Financial Advisor Module**: A fully integrated AI component that securely communicates with a Vercel Serverless Function (`/api/analyze`) to review transaction data and provide rapid, high-level financial guidance.
  - **Resilient Fallback Engine**: Engineered to ensure 100% uptime. If the external AI API hits rate limits or cold-starts, the backend gracefully catches the crash and utilizes a custom heuristic math engine to calculate savings rates and top expense drains natively, guaranteeing a dynamic response is always delivered.
- **Cash Flow Trend (Line Chart)**: Represents money in vs. money out over a timeline. The data is parsed, grouped by `YYYY-MM`, and plotted identically using vibrant opposing paths (green vs. red). Hovering yields confined tooltips to guarantee readability on small screens.
- **Expenses by Category (Pie & List Chart)**: Provides a visual segmentation of spending habits. It combines an ECharts circle graph with a custom-mapped, responsive list broken into discrete rows detailing specific percentage contributions and dollar amounts per category.

### 3. Transactions Manager View (`/transactions`)
The power-user interface for manipulating individual records.
- **Dynamic Data Table**: Outputs all financial records vertically. Each row elegantly pairs distinct iconography (Arrow Up/Down) and color-coding depending on whether it's an income or expense line item.
  - **Mobile-Responsive & Scroll-Free**: Instead of forcing clunky horizontal scrollbars on narrow phones, the table intelligently flexes. Granular details (like category or description) utilize smart word-wrapping, effortlessly jumping to multiple centered lines when space gets tight.
  - **Unobscured Action Controls**: For `admin` users on touch-devices, action controls (Edit/Delete) are persistently visible rather than hiding behind hover events, drastically improving UX.
- **Advanced Filtering Engine**:
  - **Instant Search**: Free-text filtering over description content and categories.
  - **Type Filter**: Strict gating for Income vs. Expenses.
  - **Advanced Accordion**: Hides granular controls out of the way until requested. Unlocking it reveals:
    - **Date Range Controls**: Native HTML date-pickers locking queries between explicit start and end dates.
    - **Amount Range Controls ($)**: Enables users to track micro or macro transactions by enforcing min/max boundaries.
- **Data Grouping Layer**: Users can flip the table to slice data logically. Switching to `group by date` injects custom header table-rows to separate chronologies, while `group by category` aggregates similar purchases together seamlessly.
- **Exporting Capabilities**: A dynamic floating dropdown (handling outside clicks efficiently) granting the ability to serialize the currently viewed, *filtered* table data directly into downloadable **CSV** or raw **JSON** formats.
- **CRUD Operations Overlay (Admin Only)**: Form submissions happen within an accessible floating `<Modal>`. The modal forms are strictly typed (disabling submissions while processing) and natively limit input formats (e.g., step 0.01 on money).

### 4. Financial Insights View (`/insights`)
Outputs deep calculated intelligence preventing the user from doing mental math.
- **Savings Rate KPI**: Derives the realistic ratio of kept money vs spent money (`((income - expense) / income * 100)`).
- **Top Expense Category**: Analyzes all expenditure datasets to reveal what area consumes the most capital.
- **Largest Single Expense**: Sweeps transaction logs to find the single largest purchase event and its exact size.
- **Average Monthly Expense**: Intelligently clusters unique months in the transaction log to establish a run-rate metric.
- **Automated Summary Notes**: Actionable text output recommending the user to examine their topmost spending categories depending on specific milestones or limits hit.

---

## 💻 Tech Stack Specifications

- **Frontend Framework**: **React 18** setup via Vite ensuring Hot Module Replacement (HMR) and instantaneous build time.
- **Routing Engine**: **React Router DOM v7** maintaining strict nested route hierarchies (`<Layout>` acts as the `Outlet` wrapper).
- **Store & Asynchrony**: **Redux (v5) + React-Redux** heavily fortified with **Redux Thunk** interceptors for async mock API requests.
- **Styling Architecture**: **Tailwind CSS** heavily utilizing arbitrary values, grid/flex hybrid alignments, and pseudo-classing for flawless transitions.
- **Data Visualization Engine**: **Apache ECharts** (`echarts` & `echarts-for-react`) operating the responsive HTML5 Canvas charts.
- **Iconography & Micro-Animations**: **React Icons** and highly orchestrated entry/exit physics via **Framer Motion**.
- **Mock Persistence**: Browser **localStorage** via a versioned storage key (`finance_transactions_v1`) ensuring seed data and user edits survive page refreshes.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js environment (v16.14.0 or higher recommended).
- Git.
- Vercel CLI *(optional — only needed to run AI endpoints locally)*: `npm i -g vercel`

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository_url>
   ```

2. **Navigate into the project root**:
   ```bash
   cd Zorvyn-Finance-Dashboard-Assignment
   ```

3. **Install exact dependencies**:
   ```bash
   npm install
   ```

### Execution

**To start the local dev environment:**

```bash
npm run dev
```

Navigate to the provided local URL (e.g. `http://localhost:5173/`).

> 💡 **AI Advisor Note:** The AI Financial Advisor module communicates with a Vercel Serverless Function (`/api/analyze`). When running locally with `npm run dev`, this endpoint is not proxied by Vite, so the AI Advisor will fall back to the built-in heuristic engine automatically — all other features work fully. If you want the live AI endpoint to run locally, use the Vercel CLI instead:
> ```bash
> npx vercel dev
> ```

**To produce a bundle for production environments:**
```bash
npm run build
```

The output will rest securely in the top-level `/dist` folder. Preview the generated dist environment via:

```bash
npm run preview
```

---

## 🐛 Known Fixes & Technical Notes

### SPA Routing on Refresh
Direct URL navigation and hard refreshes on sub-routes (e.g. `/transactions`, `/insights`) previously returned a 404 in production. This is fixed via `vercel.json` at the project root:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Mock Data Persistence
Transaction data is stored in `localStorage` under the key `finance_transactions_v1`. On first load, the app seeds localStorage with `initialTransactions` from `src/utils/mockData.js`. Subsequent adds, edits, and deletes are saved immediately, surviving refreshes.

> If you update `initialTransactions` in `mockData.js` and don't see the changes, clear the old localStorage entry manually:
> **DevTools → Application → Local Storage → delete `finance_transactions_v1`**
>
> Alternatively, bump the `STORAGE_KEY` constant in `src/api/mockApi.js` to a new version (e.g. `finance_transactions_v2`).