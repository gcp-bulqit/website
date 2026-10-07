// All personal content lives here. Edit this file to make the site yours.
// Résumé content source: ../gcp/Output/Gleb_Pavlov_Resume.docx (October 2026).

export const site = {
  name: 'Gleb Pavlov',
  initials: 'GCP', // home tab label in the header
  // Rendered on two lines on the home page.
  nameLines: ['Gleb', 'Pavlov'],
  role: 'Software Developer',
  tagline: 'I build systems, tools, and the occasional website.',
  location: 'Chicago, IL',
  url: 'https://www.pavlovsdogma.com',
  email: 'gcpavlov@gmail.com',
  updated: 'October 2026',
  // icon: a Nerd Font glyph. Only the glyphs listed in public/fonts/README.md are in the subset.
  social: [
    { label: 'GitHub', href: 'https://github.com/gcp-bulqit', icon: '\uf09b' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/glebcpavlov', icon: '\uf0e1' },
    { label: 'Email', href: 'mailto:gcpavlov@gmail.com', icon: '\uf0e0' },
  ],
};

// About page introduction, adapted to first person from the résumé summary.
export const about = [
  'I’m a Director of Operations Engineering with 10+ years across finance, process engineering, and platform operations.',
  'I own production for a proptech marketplace in Chicago, Los Angeles, and Austin: blue/green release engineering, CI/CD quality gates, observability, security, and payments and billing correctness on Stripe.',
  'I designed and operate an AI agent pipeline on Claude Code that shipped 106 reviewed pull requests in its first month, fed by an LLM triage system I built.',
  'I trained in accounting (B.S. Accounting and Finance), which grounds my focus on reconciliation, audit trails, and correctness in every system I ship.',
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages & Frameworks', items: ['TypeScript', 'Python', 'JavaScript', 'SQL', 'Rust', 'Ruby on Rails', 'Next.js', 'React', 'Node.js', 'Flask'] },
  { group: 'Data & Databases', items: ['PostgreSQL', 'Neon', 'Drizzle ORM', 'Database migrations', 'Data migration and ETL', 'Tableau', 'Excel (VBA)'] },
  { group: 'Cloud & Infrastructure', items: ['AWS (S3, Lambda, EC2, EMR, Glue, Redshift)', 'Azure (Data Factory, Databricks, Data Lake Storage)', 'Docker', 'Kubernetes', 'Terraform', 'Vercel', 'Fly.io', 'Temporal workflows', 'Nix / devenv', 'mise'] },
  { group: 'CI/CD & Release Engineering', items: ['GitHub Actions', 'Blue/green deployments', 'Merge trains', 'Release management', 'Dependabot', 'Secret scanning (gitleaks)', 'Pre-commit hooks', 'Database migration safety gates'] },
  { group: 'Observability & Reliability', items: ['Sentry', 'Health checks', 'Synthetic monitoring', 'Tiered alerting', 'Uptime and cron monitoring', 'Incident management', 'Root cause analysis', 'Error-coverage auditing'] },
  { group: 'Security', items: ['Role-based access control (RBAC)', 'Authentication (Clerk)', 'Account-takeover and SSRF remediation', 'PII-safe logging', 'Rate limiting', 'File upload validation', 'Dependency vulnerability gates'] },
  { group: 'Payments & Financial Systems', items: ['Stripe (Payments, Connect)', 'Billing systems', 'Payment reconciliation', 'QuickBooks', 'Maxio (Chargify)', 'First Data', 'GAAP', 'Month-end close'] },
  { group: 'AI & Automation', items: ['Claude Code', 'AI agents', 'Large language models (LLMs)', 'OpenRouter (Claude, GPT, Llama, Qwen, DeepSeek)', 'Ollama (local models)', 'TypeSafe Jev', 'Claude Code skills', 'Process automation'] },
  { group: 'Integrations & Business Systems', items: ['REST APIs and webhooks', 'Twilio', 'SendGrid', 'Sanity CMS', 'Linear', 'CRM (Twenty, Zoho, Vtiger, Sonar)', 'ERP implementation'] },
];

export const education = [
  {
    degree: 'B.S., Accounting and Finance; B.B.A., Business Administration (dual major)',
    school: 'Robert Morris University – Illinois, Chicago, IL',
    years: '2012 – 2015',
    note: 'GPA 3.9',
  },
];

export const languages = ['English (native)', 'Russian (native)'];

export const nav = [
  { href: '/about', label: 'About' },
  { href: '/work', label: 'Work' },
  // Writing (/writing, chapter 04) is hidden from the tabs for now but still reachable by URL.
  { href: '/lab', label: 'Lab' },
];

export type Project = {
  title: string;
  year: string;
  summary: string;
  details?: string[];
  stack: string[];
  href?: string;
  repo?: string;
  note?: string; // e.g. "Private repository"
};

export const projects: Project[] = [
  {
    title: 'Autonomous AI Agent Pipeline',
    year: '2026',
    summary:
      'A Claude Code system that turns Linear tickets into reviewed pull requests: a supervisor and five specialized agents (discovery, planning, implementation, adversarial review, documentation) running up to five tickets in parallel, each in its own git worktree and database.',
    details: [
      'Built to recover safely if stopped, with a staged state machine, one migration at a time, signed commits, and decision briefs, documented in 14 ADRs.',
      'Shipped 106 pull requests in its first month, 99% passing review within three attempts.',
    ],
    stack: ['Claude Code', 'AI agents', 'git worktrees', 'Linear'],
  },
  {
    title: 'AI Ticket Triage and Routing System',
    year: '2026',
    summary:
      'An LLM triage system that asks ten typed questions per ticket, grounds the answers in git evidence, and applies code-defined thresholds to choose work for the agent pipeline; 33 of 43 picks shipped, and 82% passed first-attempt review versus 67% overall.',
    details: [
      'A companion labeler scores workability, ambiguity, effort, blast radius, and locatability and routes each ticket to the right human step.',
      'A hindsight-free backtest against 130 shipped tickets found 25% carried the wrong type label.',
    ],
    stack: ['TypeSafe Jev', 'Python', 'LLMs'],
  },
  {
    title: 'Claude Code Operations Skills Library',
    year: '2026',
    summary:
      'Approval-gated skills that make high-risk operations repeatable: blue/green promotion pre-flight, merge trains with migration renumbering, and Twilio number provisioning.',
    details: [
      'Checkpoint-based content syncs between dev and production databases and CMS that never overwrite production edits; reconciled 146 notification templates and avoided 23 broken images a naive copy would have caused.',
    ],
    stack: ['Claude Code skills', 'PostgreSQL', 'Sanity CMS', 'Twilio'],
    note: 'Bulqit/tool-shed (private repository)',
  },
  {
    title: 'Blue/Green Release System',
    year: '2026',
    summary:
      'Replaced agency-era deploys with protected blue/green slots, CI-gated promotions, read-only production pre-flight checks, and migration dry-runs; shipped one release of 116 new tickets and 7 database migrations through the standby slot.',
    stack: ['GitHub Actions', 'Vercel', 'Fly.io', 'PostgreSQL'],
  },
  {
    title: 'Developer Onboarding Documentation',
    year: '2026',
    summary:
      'The engineering onboarding repository: an infrastructure overview with an architecture diagram, 65 files of initial developer documentation, an accounts checklist, and a 686-line staging QA checklist with a pass/fail matrix.',
    stack: ['Documentation', 'QA'],
    note: 'Bulqit/bul-dev-docs (private repository)',
  },
  {
    title: 'Physarum Background',
    year: '2026',
    summary:
      'The GPU slime mold simulation running behind this site. Hundreds of thousands of agents follow and lay down pheromone trails, and they react to your cursor.',
    stack: ['WebGL2', 'GLSL', 'TypeScript', 'Astro'],
    href: '/lab',
  },
];

export type Post = { title: string; date: string; summary: string; href: string };

export const posts: Post[] = [
  {
    title: 'Notes on simulating slime mold in a fragment shader',
    date: '2026-10-01',
    summary: 'Agents in textures, trails in ping-pong buffers, and why everything wraps around.',
    href: '#',
  },
];

export type Highlight = string | { text: string; details: string[] };

export type Role = {
  title: string;
  altTitle?: string;
  company: string;
  location: string;
  start: string;
  end: string;
  context?: string;
  // A plain string, or a short summary whose full original bullets open in an accordion.
  highlights: Highlight[];
};

export const experience: Role[] = [
  {
    title: 'Director of Operations Engineering',
    company: 'Bulqit',
    location: 'Chicago, IL (Hybrid)',
    start: 'Dec 2025',
    end: 'Present',
    context:
      'Proptech marketplace that groups neighborhoods into buying groups for recurring home services. Stack: Next.js, TypeScript, PostgreSQL, Temporal, Stripe, Twilio, Vercel, Fly.io.',
    // Order: product, AI, payments, security, the SMS fix, then the condensed release and
    // operations work. A merged item's `details` keep the original bullets in full.
    highlights: [
      'Designed and shipped a one-time services product line end to end (checkout, scheduling, and charge on completion) behind a feature flag after five adversarial design reviews.',
      'Designed and operate an AI agent pipeline on Claude Code: five specialized agents working in parallel, isolated git worktrees, adversarial review, and signed commits. It shipped 106 pull requests in its first month, with 67% passing review on the first attempt, 92% within two, and 99% within three.',
      {
        text: 'Rebuilt billing so the money is never wrong: a locked invoice ledger that corrected Stripe’s fee model and reconciled vendor earnings, and retry-safe charging that makes double charges impossible, with a daily money monitor and reconciliation for finance.',
        details: [
          'Traced inconsistent fees to a ledger that recalculated charges from live settings and modeled Stripe’s fee as a flat 3.0% instead of 2.9% plus 30 cents; rebuilt it as a locked invoice line-item ledger and reconciled three conflicting vendor-earnings figures into a single definition.',
          'Eliminated double-charge risk on retries with durable Stripe idempotency keys and reconcile-before-retry, proved charges cannot double-apply with real-database race tests, and launched a daily monitor of four money invariants plus a Stripe and QuickBooks reconciliation export for finance.',
        ],
      },
      {
        text: 'Closed critical account-takeover and authentication vulnerabilities, then added admin role-based access control with audit logging and database-backed rate limiting.',
        details: [
          'Closed five critical account-takeover paths, an unauthenticated credit-minting endpoint, and a production OTP backdoor; implemented admin role-based access control with audit logging and lockout protection, and moved rate limiting to PostgreSQL after finding the in-memory limiter never enforced on serverless.',
        ],
      },
      'Resolved a production SMS outage caused by an account-wide Twilio binding limit shared across environments; isolated each environment’s number pool and webhooks, increasing messaging capacity by 1,067% for $85 a month and cutting cost per connection by about 70%.',
      {
        text: 'Took over production from the founding agency and built the release process: blue/green deployments with CI-gated promotions (89% of production deploys, including a 116-ticket release) and a restored integration test suite that cut failing test files from 81 to 5.',
        details: [
          'Took over production from the founding development agency with no in-house release process; designed blue/green deployment slots with protected branches, CI-gated promotions, and slot-aware worker deploys, then triggered 89% of production deploys, including one release of 116 new tickets and 7 database migrations.',
          'Found only 25 of 385 integration test files running in CI and a harness defect hiding failures; restored the suite on every pull request, scoped CI to essential suites, and cut failing test files from 81 to 5, adding secret scanning, dependency advisory, and migration-order gates.',
        ],
      },
      {
        text: 'Built the operational safety net: health checks across 14 dependencies with automatic machine replacement, release-stamped Sentry and tiered alerts, approval-gated Claude Code skills for high-risk operations, and a one-command devenv/Nix environment.',
        details: [
          'Inherited background workers that could stop silently and reported every release as “dev”; built health checks across 14 third-party dependencies with automatic Fly.io machine replacement, release-stamped Sentry reporting, tiered alerts, and an hourly synthetic probe that proves alerting works.',
          'Wrote and designed Claude Code skills that make high-risk business operations repeatable and auditable: production promotion pre-flight, merge trains, database and CMS content syncs with checkpoint-based conflict detection, telephony provisioning, and velocity reporting.',
          'Built out the team’s reproducible devenv/Nix development environment: local PostgreSQL, Temporal, Twilio mocks, secret scanning, and AI tooling context in a single command.',
        ],
      },
      'Resolved 408 engineering issues, 26% of everything the team completed, including 150 urgent or high-priority issues. Authored 342 pull requests across 245 tickets.',
    ],
  },
  {
    title: 'Programmatic Automation and Operations Consultant',
    company: 'Self-employed (confidential client)',
    location: 'Remote',
    start: 'May 2024',
    end: 'Jul 2025',
    highlights: [
      'Established the business foundations for a stealth-stage proptech startup: entity setup, accounting and bookkeeping systems, and operating budgets.',
      'Contributed code, development environment setup, and service configuration to the marketplace platform build alongside an external development agency (Next.js, PostgreSQL, Temporal, Stripe, Twilio, Clerk, Sanity CMS), through its first production release in June 2025.',
      'Implemented a large language model chatbot that guides customers through onboarding, including secure collection of payment profiles and account setup.',
      'Designed automated financial, management, and investor-level reporting frameworks and led automation work in Python, PyTorch, Power Query, and AWS for financial and operational data processing.',
    ],
  },
  {
    title: 'Senior Process Manager',
    altTitle: 'Senior Manager, Process and Innovation',
    company: 'Zentro Internet (formerly Everywhere Wireless)',
    location: 'Chicago, IL',
    start: 'Jun 2021',
    end: 'Dec 2023',
    highlights: [
      'Led systems integration through the merger with Silver IP, consolidating two companies’ CRM, billing, and payment data into a single unified database for the combined internet service network.',
      'Migrated customer payment vault tokens into a new recurring billing processor and designed the data hierarchy for a new CRM, backfilling legacy customer and serviced-property records.',
      'Built webhook-driven automation and internal forms in Python, Flask, and AWS Lambda for CRM and billing workflows.',
      'Developed automated KPI dashboards for customer service, construction, and sales, and partnered with leadership on M&A financial analysis and process realignment for newly acquired entities.',
    ],
  },
  {
    title: 'Process Manager',
    company: 'Everywhere Wireless',
    location: 'Chicago, IL',
    start: 'Apr 2019',
    end: 'Jun 2021',
    highlights: [
      'Built and led the Process and Innovation department after a leadership restructuring ahead of an expected acquisition, shifting from financial reporting to business systems that could scale with expansion.',
      'Implemented the company ERP and CRM, call center IVR and KPIs, and sales and contract-valuation KPIs, with API, webhook, and automated data migration pipelines.',
      'Automated dunning and payment collections, customer notifications, physical mail, and month-end journal entries, reducing accounts receivable cycle times.',
      'Built router polling and network uptime monitoring, and delivered EBITDA, FFO, discounted cash flow, and liquidity forecasting analysis for senior leadership.',
    ],
  },
  {
    title: 'Accounting Manager',
    altTitle: 'Associate Director of Accounting and Finance',
    company: 'Everywhere Wireless',
    location: 'Chicago, IL',
    start: 'Sep 2015',
    end: 'Apr 2019',
    highlights: [
      'Owned the month-end close for a multimillion-dollar business unit: closing entries, balance sheet and P&L reconciliations, physical inventory audits, capitalization and amortization schedules, and tax.',
      'Implemented recurring payment processing for retail credit card and bulk ACH property customers, integrating Maxio (Chargify) and First Data, including secure payment profiles, onboarding, and product catalog management.',
      'Built service-agreement valuation and property-level P&L reporting used to underwrite new network construction proposals for bulk internet clients.',
      'Managed and trained billing specialists and accountants across AR, AP, invoicing, cost coding, and biweekly payroll.',
    ],
  },
];

export const earlierExperience =
  'Seasonal Tax Associate, PwC (Jan – May 2015); Finance and Accounting Staff, TRIO Student Support Services, Robert Morris University (Jul 2013 – Feb 2015).';
