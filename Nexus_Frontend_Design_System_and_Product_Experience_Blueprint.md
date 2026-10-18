# NEXUS --- Frontend, Brand, Product Design & UX Blueprint

## A complete product-design direction for an intentional, trustworthy logistics operating system

**Document status:** Proposed product and design specification\
**Product:** Nexus Logistics OS\
**Audience:** Product owner, frontend engineers, backend engineers,
design contributors, QA\
**Primary goal:** Replace a feature-heavy, inconsistent, potentially
"vibe-coded" experience with a coherent, calm, credible product that
helps real people complete logistics work.

> This is a forward-looking design specification, not a claim that every
> existing feature or backend capability has been audited and verified.
> Existing routes and components must be inspected and tested before
> implementation decisions are finalized. Any capability that cannot be
> proven to work must be marked unavailable, hidden, or removed from the
> primary experience until it is ready.

------------------------------------------------------------------------

# 0. Executive direction

Nexus should feel like a carefully engineered professional product. It
may borrow the *principles* of Apple product design---clarity,
hierarchy, restraint, purposeful motion, progressive disclosure, strong
typography, and a considered first-run experience---but it must not copy
Apple branding, layouts pixel-for-pixel, proprietary assets, or imply
Apple affiliation.

The target is not "an Apple-looking dashboard." The target is a
logistics workspace whose visual and interaction decisions feel
deliberate.

The product should communicate five things:

1.  **I understand what this product is for.**
2.  **I can tell what needs my attention.**
3.  **I can inspect the source and freshness of important information.**
4.  **I know what will happen before I take an action.**
5.  **The interface tells the truth when data or functionality is
    unavailable.**

The experience should be memorable at the first visit and efficient on
the hundredth visit.

## 0.1 The product promise

Working promise for the product:

**Nexus helps logistics teams see what is happening, identify what needs
attention, and decide what to do next.**

Supporting sentence:

"Bring shipments, fleet activity, operational exceptions, and planning
decisions into one clear workspace."

Do not promise autonomous prevention, guaranteed savings, exact
predictions, sub-second telemetry, cryptographic immutability, or
quantified accuracy unless the implementation and evidence support each
claim.

## 0.2 The core user outcome

A first-time user should be able to:

-   Understand Nexus in under 10 seconds.
-   Reach sign-in without being forced through a long animation.
-   Sign in or recover access without confusion.
-   Understand the home screen without a walkthrough.
-   Find a shipment or operational item.
-   See whether its status is current, delayed, estimated, or
    unavailable.
-   Understand the next safe action.
-   Know when the system is uncertain or disconnected.

## 0.3 The design principles

### Principle A --- Truth over theatre

No fake live states, decorative accuracy percentages, invented metrics,
simulated map movement presented as real, or AI-generated output
represented as verified operational fact.

### Principle B --- One obvious next action

Every main screen has one visually primary action. Secondary actions
remain available without competing for attention.

### Principle C --- Reveal complexity when it is needed

Advanced settings, model details, diagnostics, and scenario parameters
appear when relevant, not all at once.

### Principle D --- Operational clarity over dashboard spectacle

The map, table, event history, status and action matter more than a row
of oversized KPI cards.

### Principle E --- Motion has a job

Motion explains transitions, state changes, spatial relationships or
feedback. It is never used to disguise empty functionality.

### Principle F --- Consistency creates trust

The same action, status, spacing, component behavior and error language
should work the same way across the application.

### Principle G --- Every screen has a real state

Loading, empty, stale, partial, failed, unauthorized and successful
states are first-class design states.

### Principle H --- Respect the user's time

Returning users should enter the workspace quickly. Intro animation is
skippable and never replayed unnecessarily.

------------------------------------------------------------------------

# 1. Product and UX strategy

## 1.1 Primary audience

The initial design should support a small, explicit set of user jobs. Do
not build five radically different "cockpits" merely because the
architecture can support roles. Distinct interfaces should exist only
where role permissions and daily tasks materially differ.

### Operations manager

Needs to know which shipments or routes require intervention, how severe
the issue is, who owns it, and whether the issue has been resolved.

### Dispatcher / fleet operator

Needs to find a vehicle or shipment quickly, understand its latest
reported position/status, contact the right person or initiate a
supported action, and record the outcome.

### Supply-chain analyst

Needs to compare scenarios, inspect assumptions, understand the
difference between baseline and alternative plans, and export
reproducible results where supported.

### Administrator

Needs to manage access, workspace configuration, integrations and audit
history. The administrator does not need a visually dramatic "security
matrix" if ordinary settings and logs solve the job more clearly.

### Executive / read-only viewer

Needs a trustworthy summary, trend context and clear definitions.
Executive views must not invent ROI, savings, emissions or on-time
delivery percentages.

## 1.2 Jobs-to-be-done

-   "When a delivery may be late, help me understand what is known and
    what I should do."
-   "When I search for a shipment, show me its current record and last
    reliable update."
-   "When I open the map, help me orient myself and select a real
    operational entity."
-   "When I compare a plan, show the assumptions and trade-offs, not a
    magic score."
-   "When something fails, explain the failure and offer a safe recovery
    action."
-   "When I am returning to the app, let me get to work without
    replaying marketing."

## 1.3 The information hierarchy

The product should distinguish these concepts clearly:

1.  **Work to do** --- actionable exceptions and assigned tasks.
2.  **Operational objects** --- shipments, vehicles, routes, warehouses,
    incidents.
3.  **Operational context** --- map, timeline, status, source and last
    update.
4.  **Planning** --- scenarios, assumptions and comparisons.
5.  **Administration** --- users, access, integrations, preferences,
    audit trail.
6.  **System diagnostics** --- health, logs and technical details for
    authorized users.

Do not mix a technical health metric with a business KPI simply because
both can fit in a card.

## 1.4 Primary navigation recommendation

Start with the smallest useful navigation set:

-   Overview
-   Shipments
-   Live operations
-   Planning
-   Settings

Only show **Fleet**, **Warehouses**, **Incidents**, **Reports**,
**Integrations**, **Audit log**, or **Admin** as separate destinations
if the repository proves that they have a distinct, complete workflow
and users need them often enough to justify a top-level destination.

A navigation item must not exist just because a route or component
exists.

## 1.5 Avoid role fragmentation

Prefer one consistent shell with role-aware content and permissions.

-   All users understand the same base navigation.
-   Unauthorized actions are hidden or disabled with a clear
    explanation, not shown as broken buttons.
-   Role-specific tasks can appear as shortcuts on Overview.
-   Do not maintain five unrelated visual systems unless research proves
    that the workflows are truly different.
-   Never use role selection as a fake personalization step when the
    actual account already determines the role.

## 1.6 First-session success metric

A first-session usability test should check whether a participant can,
without coaching:

-   Explain what Nexus does.
-   Sign in or recover access.
-   Find a shipment.
-   Interpret a stale or delayed status.
-   Open the shipment detail.
-   Find the relevant action.
-   Return to the previous view without losing context.

Record observed failures and time-to-completion. Do not invent a
usability score.

------------------------------------------------------------------------

# 2. Brand strategy

## 2.1 Brand personality

Nexus should feel:

-   Precise, not cold.
-   Calm, not passive.
-   Capable, not boastful.
-   Technical, not cryptic.
-   Premium, not luxurious for its own sake.
-   Human, not playful in a way that trivializes logistics.
-   Transparent, not overconfident.

## 2.2 Brand attributes

### Clarity

A user can understand the information hierarchy quickly.

### Reliability

The interface communicates source, freshness, limitations and failure
states.

### Coordination

The visual identity suggests connected operations without using a cliché
network of glowing nodes.

### Momentum

Transitions are fluid and responsive; the interface never feels heavy or
theatrical.

### Accountability

Actions have visible outcomes and a history where appropriate.

## 2.3 Brand language

Use plain operational language.

Prefer: - "Last updated 8 minutes ago" - "Tracking update unavailable" -
"Delivery is estimated 45 minutes late" - "Compare delivery plans" -
"Review exception" - "No shipments match these filters" - "Retry
connection" - "View source details"

Avoid: - "Autonomous intelligence unleashed" - "Next-gen AI-powered
paradigm" - "Command your logistics universe" - "Revolutionary neural
engine" - "Predictive preemption" - "99.99% precision" without validated
evidence - "Magic reroute" - "Instant optimization" unless measured and
true

## 2.4 Name and wordmark

Use **NEXUS** as the wordmark, subject to confirming naming and
trademark availability independently.

-   Wordmark should be typography-first.
-   Use a restrained geometric sans-serif, medium weight.
-   Keep letter spacing slightly open but not futuristic.
-   Do not add a globe emoji, sparkles, orbit rings, random nodes,
    gradient swooshes, or a generic AI star.
-   The wordmark should work in monochrome before a colored version is
    considered.
-   Use the full wordmark on the landing page and sign-in experience.
-   Use a compact symbol only where the available space demands it, such
    as the app icon or collapsed navigation.

## 2.5 Logo concept direction

Explore three simple concepts, then choose one through legibility tests:

1.  **Linked paths:** two or three deliberate lines meeting at a single
    junction, representing coordination.
2.  **Route frame:** a minimal square or corner frame with a single path
    interruption.
3.  **N monogram:** a custom N constructed from two stable verticals and
    one connecting diagonal/path.

Do not combine all three concepts into one mark. Avoid maps, pins,
trucks, globes, gears, brains, circuit traces, infinity symbols, and
gradients all at once.

## 2.6 Logo construction rules

-   Must remain recognizable at 16 × 16 pixels.
-   Must work at 24, 32, 48 and 96 pixels.
-   Must work in monochrome.
-   Must work on light and dark backgrounds.
-   Must not depend on a glow, blur, shadow or gradient to remain
    legible.
-   Use a vector SVG as the primary asset.
-   Provide a favicon, app icon, wordmark and compact symbol from the
    same system.
-   Keep safe space around the mark equal to at least the width of the
    mark's main stroke.
-   Do not stretch, skew or apply arbitrary filters.
-   Do not create different unrelated marks for different pages.

## 2.7 App icon

Recommended direction: - Solid deep harbor-green or graphite field. -
One simple light symbol. - No text at small sizes. - No realistic 3D
object. - No glass orb. - No tiny map details. - No stock icon placed
inside a rounded square and called a brand.

The icon must still be readable when rendered at small favicon sizes and
in monochrome contexts.

## 2.8 Brand asset inventory

Required assets: - `logo-wordmark.svg` - `logo-symbol.svg` -
`app-icon.svg` - light and dark wordmark variants only if contrast
requires them - favicon set - landing hero photography or an original
product illustration - a small set of approved operational status icons

All assets should live in a documented brand directory. Avoid embedding
the same SVG markup in multiple unrelated components.

------------------------------------------------------------------------

# 3. Color system

The current repository already contains a warm-neutral / deep-teal /
burnt-orange direction in `frontend/styles/tokens.css`. Do not throw it
away reflexively. First audit actual usage, contrast, and duplication.
The proposal below refines that direction into a smaller semantic system
and removes "AI purple" as a default decorative language.

## 3.1 Core palette

### Harbor --- primary brand

-   Harbor 950: `#102521`
-   Harbor 900: `#15352E`
-   Harbor 800: `#1D4A40`
-   Harbor 700: `#286557`
-   Harbor 600: `#347D6D`
-   Harbor 500: `#4A9482`
-   Harbor 100: `#DDECE6`
-   Harbor 50: `#F0F6F2`

Primary actions should usually use Harbor 800 or Harbor 900 with white
text, subject to contrast testing.

### Ink --- text and structure

-   Ink 950: `#151B1A`
-   Ink 800: `#303936`
-   Ink 700: `#46504C`
-   Ink 600: `#5C6762`
-   Ink 500: `#707A75`

Use near-black rather than pure black for most light-mode text. Use
secondary text only where the information is genuinely secondary and
remains accessible.

### Paper --- light surfaces

-   Paper 0: `#FFFFFF`
-   Paper 50: `#FAFAF7`
-   Paper 100: `#F4F5F1`
-   Paper 150: `#ECEFEA`
-   Paper 200: `#E1E6E0`
-   Paper 300: `#CDD5CE`

The application background should be calm and slightly warm. White is
reserved for important surfaces and content areas. Do not place every
component in its own card.

### Ember --- action accent

-   Ember 700: `#A9431E`
-   Ember 600: `#C4532A`
-   Ember 100: `#F8E5DC`
-   Ember 50: `#FCF2ED`

Use Ember sparingly for a secondary action, a selected highlight, or an
important non-critical callout. Do not use it as a general status color.

### Information blue

-   Blue 700: `#2459A6`
-   Blue 100: `#E3ECF8`

Use for informational states and links when the brand accent is not
appropriate. Do not use blue-purple gradients.

### Semantic status colors

-   Success text: `#216744`
-   Success surface: `#E6F3EA`
-   Attention text: `#8B4B08`
-   Attention surface: `#FFF0D5`
-   Critical text: `#A62929`
-   Critical surface: `#FBE9E7`
-   Informational text: `#2459A6`
-   Informational surface: `#E3ECF8`
-   Unknown / stale text: `#59635E`
-   Unknown / stale surface: `#ECEFEA`

Status must never rely on color alone. Include text and/or a meaningful
icon.

## 3.2 Dark mode

Dark mode is a separate considered surface system, not a CSS inversion.

-   Background: `#111715`
-   Main surface: `#171F1B`
-   Raised surface: `#1E2823`
-   Elevated surface: `#26322C`
-   Main text: `#F1F4F0`
-   Secondary text: `#B5C0B8`
-   Subtle border: `#354139`
-   Primary brand: `#8AC3AD`
-   Primary text on brand: `#10251D`

Avoid pure black unless a specific visual reason exists. Do not add
glowing borders to make dark mode feel "premium."

## 3.3 Semantic tokens

Implement semantic tokens rather than hardcoding palette hex values
throughout components:

-   `--color-bg`
-   `--color-surface`
-   `--color-surface-raised`
-   `--color-surface-muted`
-   `--color-text`
-   `--color-text-secondary`
-   `--color-text-tertiary`
-   `--color-border`
-   `--color-border-strong`
-   `--color-primary`
-   `--color-primary-hover`
-   `--color-primary-pressed`
-   `--color-primary-text`
-   `--color-accent`
-   `--color-success`
-   `--color-warning`
-   `--color-danger`
-   `--color-info`
-   `--color-stale`
-   `--color-focus-ring`
-   `--color-overlay`

Map semantic tokens to light and dark palettes in one place.

## 3.4 Color usage ratios

As a starting point, not a rigid law: - 75--85% neutral surfaces and
text. - 10--20% brand and structural colors. - 5% or less attention
colors.

Critical red should mean a genuine critical condition. Orange should not
be used on every button. Teal should not be used for every icon and
border.

## 3.5 Color rules

-   No purple-blue gradient as the default brand.
-   No glowing teal on every card.
-   No rainbow status system.
-   No low-contrast muted labels.
-   No color-only chart interpretation.
-   No random chart colors that change between screens.
-   Use the same status meaning across table, map, detail panel and
    alert.
-   Verify contrast with automated checks and manual testing.

------------------------------------------------------------------------

# 4. Typography

## 4.1 Font stack

Use the platform system font stack for a native-feeling, performant
interface:

`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Use an approved local or licensed font only if the team can explain the
measurable improvement. Do not load several fashionable web fonts just
for the appearance of craft.

Use a monospace stack only for identifiers, technical values, hashes,
and code---not for ordinary operational data.

## 4.2 Type scale

-   Display: 48--64 px desktop, 36--44 px mobile.
-   H1: 36--44 px desktop, 30--36 px mobile.
-   H2: 28--32 px.
-   H3: 22--24 px.
-   H4: 18--20 px.
-   Body large: 17--18 px.
-   Body: 14--16 px.
-   Supporting: 13--14 px.
-   Metadata: 12--13 px, with sufficient contrast.
-   Data number: use tabular numerals where alignment matters.

Do not make every heading oversized. In an operations product, a clear
24 px section heading is often more useful than a 48 px marketing
headline.

## 4.3 Weight and tracking

-   Display and H1: 500--600.
-   Section headings: 550--650 depending on font support.
-   Body: 400.
-   Buttons: 500--600.
-   Metadata: 400--500.
-   Avoid ultra-light headings over complex imagery.
-   Use slightly tighter tracking only for large headlines.
-   Never use widely tracked uppercase for every label.

## 4.4 Typographic hierarchy rules

-   One H1 per page.
-   Section headings describe the content that follows.
-   Data labels are concise and explicit.
-   Units are visible: km, minutes, shipments, percentage, currency.
-   Date and time formats are consistent and localized.
-   Avoid ambiguous abbreviations unless they are standard for the
    intended audience.
-   Do not truncate critical status labels.
-   Allow long names and identifiers to wrap or reveal a tooltip.
-   Use tabular numerals for aligned numeric columns.
-   Do not use giant numbers without context or a definition.

------------------------------------------------------------------------

# 5. Layout, spacing, shape and elevation

## 5.1 Spacing scale

Use a base 4 px scale:

-   4 px: icon/text micro-gap.
-   8 px: compact control gap.
-   12 px: compact component padding.
-   16 px: standard spacing.
-   20 px: medium group spacing.
-   24 px: section spacing.
-   32 px: major group spacing.
-   40 px: large separation.
-   48--64 px: page-level breathing room.
-   80--120 px: marketing/landing page sections where appropriate.

Do not use arbitrary values in every component. Allow exceptions when
visual alignment or data density demands them, and document those
exceptions.

## 5.2 Page grid

Desktop: - App shell sidebar: approximately 232--256 px expanded. -
Collapsed sidebar: approximately 64--76 px. - Main content: flexible
width with a sensible max-width for reading-heavy pages. - Main page
horizontal padding: 28--40 px depending on viewport. - Dense tables and
maps can use more width than forms or settings. - Avoid a large empty
column simply to make the dashboard look luxurious.

Tablet: - Sidebar collapses or becomes a temporary drawer. - Filters
move into a controlled panel. - Table columns adapt rather than becoming
unreadable.

Mobile: - Primary navigation becomes a bottom bar or menu appropriate to
the number of destinations. - Prioritize task flows and readable
details. - Maps can fill the viewport with a collapsible detail sheet. -
Avoid forcing desktop dashboard cards into a long column if a focused
mobile workflow is better.

## 5.3 Radius system

Use restrained, consistent corner radii: - Small controls: 6--8 px. -
Standard input/button: 8--10 px. - Panels: 10--14 px. - Large
media/hero: 16--20 px. - Pills: only for chips and compact status labels
where the pill shape adds meaning.

Do not put every panel, button, badge, chart and input inside a 24 px
capsule.

## 5.4 Borders and shadows

-   Prefer subtle borders for structural separation.
-   Use shadows only when elevation needs to be understood.
-   Most dashboard surfaces should be flat.
-   Menus, dialogs and floating panels may use a restrained shadow.
-   Do not apply a shadow to every card.
-   Avoid translucent glass surfaces over every background.
-   Use blur only for a purposeful overlay or navigation material, not
    as a brand signature.

## 5.5 Density modes

Support two deliberate density modes only if users benefit: -
Comfortable: default, readable, more row height. - Compact: for
high-volume operational users.

Do not create multiple density modes until the base layout is stable and
keyboard/accessibility behavior is verified.

------------------------------------------------------------------------

# 6. Component design system

## 6.1 Buttons

Variants: - Primary: one main action per region. - Secondary: important
alternative action. - Tertiary/ghost: low-emphasis contextual action. -
Destructive: irreversible or risky action, with confirmation where
needed. - Icon-only: only when the icon is conventional and has an
accessible label.

Rules: - Label describes the result, not the internal mechanism. - Use
"Create shipment," not "Execute operation." - Use "Compare plans," not
"Run matrix engine." - Use loading text when the action takes time. -
Prevent duplicate submissions. - Disable only when there is a clear
reason; explain that reason nearby. - Show success/error feedback after
the actual result returns. - Never display success optimistically for a
mutation that can fail. - Keep touch targets accessible. - Do not use
gradients on primary buttons.

## 6.2 Inputs

-   Every input has a visible label or a genuinely equivalent accessible
    label.
-   Placeholder text is an example, not the only label.
-   Validation appears near the field.
-   Explain the correction needed.
-   Preserve valid input after a recoverable error.
-   Do not clear the whole form after a server failure.
-   Use correct autocomplete attributes.
-   Use appropriate input types for email, password, numbers and dates.
-   Never show a fake input state that is not connected to application
    state.

## 6.3 Cards

A card is justified when it groups related information or provides a
distinct actionable summary.

Use a flat section or table instead when: - Items are part of one
continuous list. - Cards add no hierarchy. - A row layout makes
comparison easier. - Multiple cards repeat the same title/status/button
pattern.

No "card for every sentence" layouts.

## 6.4 Tables

Tables are first-class components for operational work.

Must include: - Clear column headings. - Stable column alignment. - Sort
controls with visible state. - Filters that can be cleared. - Pagination
or virtual scrolling for large datasets. - Loading skeletons that
preserve table geometry. - A meaningful empty state. - Row selection
only when a real bulk action exists. - Keyboard navigation where
feasible. - A clear way to open a row detail. - Responsive treatment
that does not silently hide important data. - Export only when export
actually works.

Do not use a grid of cards as a substitute for a useful table on
desktop.

## 6.5 Badges and status chips

-   Use compact labels.
-   Reserve filled color for meaningful statuses.
-   Use neutral styling for ordinary categories.
-   Include text; never rely on a colored dot alone.
-   Do not use badges for decorative metadata.
-   Use consistent status names throughout the app.

## 6.6 Icons

-   Use one consistent icon family.
-   Keep stroke weight and optical size consistent.
-   Pair unfamiliar icons with labels.
-   Do not mix emojis, three icon libraries, bespoke SVGs and random
    Unicode symbols in the same navigation.
-   Avoid sparkles as a generic indicator for AI.
-   Avoid an icon on every label if it does not improve recognition.

## 6.7 Tooltips

-   Explain unfamiliar controls, not obvious controls.
-   Never put critical information only in a tooltip.
-   Show on keyboard focus as well as pointer hover.
-   Avoid tooltip chains that are required to understand the page.

## 6.8 Modals and dialogs

Use a modal only when the user needs to focus on a contained task or
confirm an important action.

-   Keep forms short.
-   Provide a clear title.
-   Explain the consequence of destructive actions.
-   Close on Escape when safe.
-   Do not close on outside click if that would lose important unsaved
    input without warning.
-   Restore focus to the triggering control.
-   Avoid stacking multiple dialogs.
-   Prefer a side panel for inspect-and-return workflows where
    preserving map/table context matters.

## 6.9 Toasts and notifications

-   Use toasts for short, non-blocking confirmation.
-   Do not use toasts as the only record of an important event.
-   Use persistent inline error messages for failures that need action.
-   Avoid celebratory confetti for ordinary operations.
-   Never show "Saved" until persistence is confirmed.

## 6.10 Loading skeletons

-   Match the final layout geometry.
-   Do not animate every shape excessively.
-   Use a stable loading state when loading may take longer.
-   If loading takes too long, explain what is happening and offer a
    retry or diagnostic action where appropriate.
-   Do not use a skeleton for an instantaneous state change.

## 6.11 Empty states

Every empty state should say: 1. What is empty. 2. Why it may be empty,
if known. 3. What the user can do next.

Examples: - "No shipments yet. Create a shipment or import a CSV." - "No
exceptions match these filters. Clear filters to see all exceptions." -
"No vehicle locations received. Check the vehicle connection and last
update." - "No scenarios saved. Create a comparison to explore a
planning question."

Do not show a generic illustration, "Nothing here!", and no next step.

------------------------------------------------------------------------

# 7. Navigation and application shell

## 7.1 Desktop shell

-   Stable left sidebar with wordmark at top.
-   Primary destinations grouped clearly.
-   Workspace selector only if multiple workspaces actually exist.
-   Main content with a consistent page header.
-   Global search only if it searches real objects and results.
-   User menu with account and sign-out.
-   A compact connection/data freshness indicator only when its meaning
    is reliable.
-   No decorative status lights pretending to indicate system health.

## 7.2 Sidebar order

Recommended initial order: 1. Overview 2. Shipments 3. Live operations
4. Planning 5. Divider 6. Settings

Optional destinations only when verified: - Fleet - Warehouses -
Exceptions - Reports - Integrations - Audit log - Admin

Use the same labels in breadcrumbs, page headings and action links.

## 7.3 Active and hover states

-   Active item has clear background/foreground contrast and a subtle
    marker if useful.
-   Hover is understated.
-   Focus is visible.
-   Disabled state is distinct and explained.
-   No glowing active nav item.
-   Avoid oversized icon tiles inside the sidebar.

## 7.4 Breadcrumbs

Use breadcrumbs when users navigate multiple levels deep, especially: -
Shipments → Shipment detail. - Live operations → Selected vehicle. -
Settings → Integrations → Integration detail. - Planning → Scenario →
Results.

Do not show breadcrumbs for simple one-level pages if they add clutter.

## 7.5 Page header contract

Every main page header should include: - Title. - One sentence
explaining purpose, if not self-evident. - Optional contextual
metadata. - One primary action. - Secondary actions in a menu or quieter
placement. - A consistent location for filters or time range controls.

Avoid a title, subtitle, three pill badges, a breadcrumb, two icon
buttons and four CTAs all competing in the same header.

## 7.6 Global search

If implemented, search should: - Search only supported entity types. -
Display entity type and meaningful identifying fields. - Support
keyboard navigation. - Clearly distinguish recent searches from actual
results. - Show a proper no-results state. - Handle errors and
permissions. - Never fabricate a match. - Never silently switch to a
global city dictionary when the user intended a shipment search unless
that behavior is explicitly communicated.

------------------------------------------------------------------------

# 8. Landing page story

The landing page should be a short story with a beginning, middle and
end. It should not be a long scroll of generic SaaS sections.

## 8.1 Landing page purpose

Its job is to answer: - What is Nexus? - Who is it for? - What work does
it make easier? - Why should I trust the claims? - How can I try it or
sign in?

## 8.2 Story sequence

### Scene 1 --- Arrival

A restrained wordmark, a calm background, one clear headline, and a
meaningful logistics visual.

Headline direction: **"Every shipment. One clearer picture."**

Supporting copy: "See what is moving, spot what needs attention, and
make the next decision with the information available to your team."

Primary CTA: "Get started"

Secondary CTA: "Sign in"

Do not use: - "The future of logistics is here" - "Revolutionize your
supply chain" - "Unleash autonomous intelligence" - Unsupported claims
about preventing every disruption - Fake customer logos or
testimonials - A wall of animated numbers

### Scene 2 --- The real problem

A concise explanation: logistics information is often fragmented across
shipments, fleet updates, spreadsheets and communication channels.

Use one visual example, not a wall of feature cards.

### Scene 3 --- The workflow

Show a simple three-step flow: 1. Find the shipment or exception. 2.
Understand the latest known status and context. 3. Decide what action to
take.

The visual must use real product UI where possible. If the UI is a
prototype, label it as a concept rather than presenting it as live
operational data.

### Scene 4 --- Product proof

Show one or two real screens: - Shipment detail with event history and
freshness. - Live operations map with functioning controls.

Use authentic screenshots from the application after it has been cleaned
up. Do not fabricate metrics, routes or "live" data in marketing
screenshots.

### Scene 5 --- Trust

Explain data source, freshness and uncertainty in plain language. If
Nexus currently lacks integrations or verified prediction methods, do
not pretend otherwise.

### Scene 6 --- Action

End with a clear CTA to create an account or sign in. Avoid several
competing calls to action.

## 8.3 Landing animation

Total target: approximately 4--7 seconds when played in full, with the
user able to skip immediately.

Suggested choreography: - 0--500 ms: wordmark appears through opacity
and a tiny positional shift. - 400--1400 ms: headline reveals in two
intentional groups. - 900--2200 ms: logistics image or product visual
gently resolves. - 1800--2800 ms: supporting copy and CTA appear. -
After the sequence: the page remains still and usable.

These timings are starting points for prototyping, not mandatory values.

Rules: - Use transform and opacity where possible. - Avoid layout shifts
during animation. - Avoid continuous loops. - No random particle
systems. - No fake GPS dots moving just to look live. - No autoplay
sound. - No forced full-screen intro gate. - Respect
`prefers-reduced-motion`. - The CTA must be usable before the sequence
completes. - Do not replay the animation on every route change. - Store
a first-visit completion flag only if storage behavior is
privacy-appropriate and robust; the app must still work if storage is
unavailable. - Never block sign-in behind animation.

## 8.4 Landing responsive behavior

Desktop: - Strong typography and a single hero composition. -
Image/product visual occupies a meaningful but not overpowering area. -
CTA is visible without scrolling.

Mobile: - Headline wraps naturally. - Visual crops deliberately. - CTA
remains visible. - No text over a busy image without sufficient
contrast. - Intro motion is shorter and lighter. - No horizontal
overflow.

## 8.5 Landing page proof checklist

-   All claims are supported.
-   No invented logos or testimonials.
-   No fake dashboard numbers.
-   No fake "live" status.
-   Screenshots match the product.
-   CTA routes work.
-   Sign-in is reachable in one action.
-   Page works with reduced motion.
-   Page works with keyboard and screen reader.
-   Page remains understandable if imagery fails to load.

------------------------------------------------------------------------

# 9. Authentication experience

## 9.1 Authentication principles

Authentication should feel premium because it is calm, predictable and
forgiving---not because it contains elaborate visual effects.

-   Returning user reaches the form quickly.
-   The form has one clear primary action.
-   Errors explain what happened.
-   Password recovery is easy to find.
-   Account creation is not confused with sign-in.
-   Session errors do not silently discard the user.
-   Auth state is enforced by the server/backend, not only by client
    routing.

## 9.2 Sign-in screen

Content: - Nexus symbol and wordmark. - Heading: "Welcome back." -
Supporting line: "Sign in to your workspace." - Email field. - Password
field with show/hide control. - "Forgot password?" link. - Primary
button: "Sign in." - Secondary route: "New to Nexus? Create an
account." - Legal/privacy links only if real policies exist. - Optional
SSO buttons only if fully configured and tested.

Avoid: - A fake biometric button. - "Continue with Apple" unless
actually implemented and appropriate. - A full marketing carousel beside
a tiny form. - Multiple gradients and glows. - A password-strength meter
on sign-in. - Decorative testimonial cards. - A long required tour
before the form.

## 9.3 Sign-in interaction details

-   Email is normalized according to backend rules.
-   Password input supports paste and password managers.
-   Show/hide control has an accessible name and does not clear the
    password.
-   Enter submits the form.
-   Submit is disabled or guarded during an active request to prevent
    duplicates.
-   The button shows a concise pending state.
-   Server errors are shown without exposing sensitive internals.
-   The form preserves the email after a recoverable error.
-   Do not reveal whether a particular email has an account if that
    creates account-enumeration risk.
-   Rate limiting and abuse prevention belong on the server.
-   Redirect only to safe, authorized destinations.
-   Sign-out actually invalidates or clears the session as designed.

## 9.4 Account creation

Only include fields needed to create a valid account: - Name, if
genuinely used. - Email. - Password, if password auth is supported. -
Terms/privacy consent if legally required and backed by real
documents. - Organization/workspace creation only if it is a real
supported flow.

Do not ask for company size, industry, role, shipment volume, AI
preference and dashboard theme before a user can access the product
unless research proves the information is required.

## 9.5 Password recovery

-   A visible recovery route.
-   Clear email entry.
-   A generic confirmation that does not expose account existence.
-   A secure, expiring reset flow.
-   Clear invalid/expired token handling.
-   Success confirmation.
-   Return to sign-in.
-   Never show a success state before the backend confirms the request
    was accepted.

## 9.6 First-run transition after sign-in

If the account has no data: - Welcome briefly. - Explain that the
workspace is empty. - Offer one appropriate first action: import data,
connect a source, or create a first record---depending on real supported
capabilities. - Offer sample/demo data only as an explicit sandbox,
clearly labeled. - Do not inject fake shipments into the production
workspace.

If the account has data: - Go directly to Overview. - Do not force a
welcome wizard. - Do not replay the landing animation. - Preserve the
user's intended destination if the sign-in flow started from a protected
route.

## 9.7 Authentication accessibility

-   Correct input labels and autocomplete.
-   Keyboard-only completion.
-   Visible focus indicators.
-   Errors associated with their fields.
-   No color-only validation.
-   Sufficient contrast.
-   Screen-reader announcements for submission state and errors.
-   Reduced motion.
-   Usable zoom and small screens.

------------------------------------------------------------------------

# 10. Overview tab

## 10.1 User question

"What needs my attention right now?"

## 10.2 Purpose

Overview is a work queue and orientation screen, not a wall of KPIs.

## 10.3 Recommended structure

1.  Page title: "Overview"
2.  Short context: "Your workspace at a glance."
3.  Date/time or workspace context only if meaningful.
4.  Attention queue for actionable exceptions.
5.  Recent activity.
6.  A compact operational summary only where values are real and
    defined.
7.  Quick actions based on actual permissions and supported workflows.

## 10.4 Priority order

The attention queue comes first if actionable issues exist.

Each exception row should show: - Severity. - Object identifier. -
Plain-language issue. - Last known update. - Why it needs attention. -
Owner or responsible team, if available. - One relevant action.

Do not use a large red card for every minor warning.

## 10.5 Summary metrics

Only show a metric if: - Its definition is clear. - Its source is
known. - Its time range is visible where relevant. - Its value is not
fabricated. - It helps a decision. - It can be clicked through to
supporting records, where appropriate.

Potential metrics, only if supported: - Active shipments. - Shipments
with exceptions. - Vehicles reporting recently. - Deliveries due today.

Avoid: - "AI accuracy." - "Autonomy score." - "Network intelligence
index." - Unexplained health scores. - Dollar savings without a
documented calculation. - ESG claims without a defined method and
source.

## 10.6 Overview states

Loading: - Show a stable page skeleton. - Preserve header geometry. -
Avoid flashing zero values before data loads.

Empty: - Explain that no operational data is connected or available. -
Offer the correct next action. - Do not show fake sample data by
default.

Partial: - Show available data and mark the missing source. - Do not
present partial totals as complete totals.

Stale: - Show the last successful update. - Explain which sections may
be outdated. - Offer retry or connection details if supported.

Error: - State what failed. - Preserve other working sections if
possible. - Provide a retry action. - Include a support/reference ID
only if the system really generates one.

Success: - Keep the page calm. Do not use celebratory effects for normal
data loading.

## 10.7 Overview acceptance criteria

-   A first-time user can identify the main action.
-   Every metric has a definition or clear label.
-   Every exception links to its underlying record.
-   No mock values appear in production.
-   Empty and error states are tested.
-   No card is present solely for visual balance.

------------------------------------------------------------------------

# 11. Shipments tab

## 11.1 User question

"Where is this shipment, what is its current state, and what should I
know?"

## 11.2 Shipment list

Required capabilities: - Search by supported identifiers. - Filter by
meaningful status. - Sort by date, status or other available fields. -
Clear filters. - Open a detail view. - Show last update/freshness. -
Paginate or virtualize large datasets. - Display an honest empty
state. - Show permission errors clearly.

Suggested columns: - Shipment ID. - Origin → destination. - Status. -
Estimated/confirmed delivery time, clearly distinguished. - Last
update. - Assigned vehicle/carrier, if available. - Exception indicator,
if derived from real data.

Do not show all fields at once. Make column selection an optional later
enhancement, not an initial complexity.

## 11.3 Search behavior

-   Debounce where appropriate.
-   Keep the query visible.
-   Support Enter to submit if using explicit search.
-   Indicate when filters are also active.
-   Do not treat a no-result response as a successful search.
-   Do not fall back to searching cities or unrelated entities without
    telling the user.
-   Show recent searches only if they are real and useful.

## 11.4 Shipment detail

Recommended hierarchy: 1. Shipment ID and current status. 2. Origin and
destination. 3. Best available delivery estimate, with
confidence/uncertainty only if valid. 4. Last update and source. 5.
Event timeline. 6. Map context, if real coordinates are available. 7.
Related vehicle/carrier/route. 8. Available actions. 9. Raw technical
details only in a secondary disclosure.

## 11.5 Timeline

Each event should show: - Event label. - Timestamp and timezone. -
Source, if known. - Location, if known. - Whether the event is
confirmed, estimated or system-generated. - Event ordering that is
consistent and explainable.

Do not invent milestones to make a timeline look complete.

## 11.6 Shipment actions

Potential actions, only if implemented: - Edit shipment. - Assign
vehicle. - Add note. - Report issue. - Export record. - Notify
recipient.

Every action should have a confirmation/result state and a recovery path
if it fails.

## 11.7 Shipment empty states

No shipments: "Your workspace has no shipments yet." Offer: - "Create
shipment" if supported. - "Import CSV" if supported. - "Connect a data
source" if supported.

No filter matches: "No shipments match these filters." Offer "Clear
filters."

Unknown shipment: "We couldn't find a shipment with that ID." Offer a
corrected search, not a fake result.

## 11.8 Shipment acceptance criteria

-   IDs and statuses map to backend records.
-   Sorting and filters operate on actual data.
-   Detail pages handle missing optional fields.
-   Timezones are explicit.
-   Estimated and confirmed timestamps are distinct.
-   No fake progress percentage.
-   No unverified delivery promise.

------------------------------------------------------------------------

# 12. Live operations tab and Leaflet map

## 12.1 User question

"What is happening geographically, and what should I inspect?"

## 12.2 Map philosophy

The map is an operational tool, not a cinematic background.

Use Leaflet as the primary 2D map if that is the chosen supported
implementation. Do not maintain multiple competing map experiences---SVG
fake map, Three.js "digital twin," and Leaflet map---unless each has a
proven distinct job and the user can understand the difference.

## 12.3 Default map experience

-   A real map with a clear initial extent based on the user's actual
    workspace data.
-   If there is no workspace data, show a neutral empty map or a clearly
    labeled sample/demo mode.
-   Fit the map to available entities when appropriate.
-   Do not silently default to an arbitrary city and imply that the
    user's operations are located there.
-   Keep map controls in predictable locations.
-   Use clear attribution for map tiles.
-   Ensure tile provider terms and keys are handled correctly.
-   Do not claim live traffic or weather if the data source is not
    connected.

## 12.4 Map controls

Minimum useful controls: - Zoom in. - Zoom out. - Fit to available
data. - Layers. - Optional search if it searches actual map entities. -
Optional fullscreen. - Clear selection.

Do not add a control simply because a map library supports it.

## 12.5 Layer menu

Use a compact menu with explicit toggles: - Vehicles. - Warehouses. -
Routes. - Incidents.

Only add weather, traffic, telemetry, geofences, grid overlays or other
layers if they are real and their visual meaning is clear.

Layer menu behavior: - Clicking the Layers button toggles the menu. -
Clicking a layer toggle changes that layer immediately. - Clicking
outside closes the menu unless a deliberate interaction requires it to
stay open. - Escape closes the menu. - Focus returns to the trigger
after closing. - Menu state does not get trapped behind the map. - Map
drag does not start when interacting with the menu. - Closing the menu
must not turn the layer state back on. - Layer visibility state should
be explicit and testable. - Use accessible checkbox/switch semantics. -
Do not render a second map instance when toggling a menu.

## 12.6 Grid behavior

If a grid overlay is genuinely useful: - Provide a clearly named "Grid
overlay" toggle. - Grid off means all grid lines disappear, including
SVG/canvas overlays. - The grid toggle must control the actual rendered
layer, not only a menu label. - Do not draw an always-on background grid
outside the map layer system. - Distinguish a geographic coordinate grid
from a decorative UI grid. - Use subtle line contrast. - Do not show
grid by default unless user research indicates value. - Persist the
preference only if persistence is intentional and reliable. - Resetting
map view should not unexpectedly reset layer visibility.

## 12.7 Map selection and detail panel

When a user selects a marker: - Highlight the selected entity. - Open a
detail panel or bottom sheet. - Show identifier, status, last update,
and relevant actions. - Keep the selected item visually linked to the
map marker. - Provide a clear close/clear-selection control. - Do not
make the user click tiny markers without an accessible alternative. -
Clicking the same marker again should have a consistent behavior. - The
panel must not cover essential controls at small viewport sizes.

## 12.8 Marker design

-   Use a restrained icon or shape set.
-   Differentiate object types clearly.
-   Use color primarily for state, not object type, unless the mapping
    remains unambiguous.
-   Avoid glowing halos and pulsating rings except for a real, urgent
    event that merits attention.
-   Cluster dense markers when necessary.
-   Ensure selected, hovered and keyboard-focused markers are distinct.
-   Do not animate markers unless location updates are real and the
    motion communicates change.

## 12.9 Map loading and error states

Loading: - Show map shell and a subtle loading state. - Avoid repeated
spinner loops.

Tile failure: - Explain that map tiles could not load. - Preserve
available data list/details where possible. - Offer retry. - Do not show
a blank canvas that looks like an empty region.

No entities: - Explain no map entities are available. - Provide the
right data setup action. - Do not inject mock trucks into production.

Stale telemetry: - Show last reported timestamp. - Avoid a "live" badge
if updates are delayed or disconnected.

## 12.10 Leaflet technical requirements

-   Use the supported Leaflet integration consistently.
-   Ensure the map container has a non-zero height.
-   Call `invalidateSize()` after a hidden map becomes visible or its
    container changes size.
-   Use `ResizeObserver` or an equivalent measured layout mechanism
    where needed.
-   Clean up listeners, observers and layers.
-   Avoid duplicate Leaflet instances on the same DOM node.
-   Keep React state and map state synchronized intentionally.
-   Avoid stale closures in event handlers.
-   Prevent map dragging from hijacking button, input, menu and panel
    interactions.
-   Use appropriate z-index layers for map, controls, menus, dialogs and
    app navigation.
-   Do not put a menu inside an element clipped by `overflow: hidden` if
    it must escape that boundary.
-   Test fullscreen enter/exit, sidebar collapse, responsive resize,
    route changes and modal visibility.
-   Do not create a custom mouse-based map pan implementation when
    Leaflet already owns pan/zoom.
-   Avoid mixing map projection math with a separate handcrafted canvas
    map in the same primary experience.
-   Verify tile attribution and license terms.
-   Test keyboard and touch interactions.

## 12.11 Map acceptance tests

-   Open map.
-   Open Layers menu.
-   Close it with trigger.
-   Close it with outside click.
-   Close it with Escape.
-   Toggle each supported layer on/off.
-   Confirm grid lines disappear when disabled.
-   Select an entity.
-   Close detail panel.
-   Resize viewport.
-   Collapse/expand sidebar.
-   Enter/exit fullscreen.
-   Navigate away and back.
-   Verify there is no duplicate map instance.
-   Verify no stale listeners or stuck overlays.
-   Verify actual data source and timestamps.

------------------------------------------------------------------------

# 13. Planning and scenario comparison tab

## 13.1 User question

"What happens if I change this assumption or choose another plan?"

## 13.2 Naming

Prefer **Planning** or **Compare plans** over "AI Simulation Matrix,"
"Autonomous Decision Engine," or "Monte Carlo Cockpit" in primary
navigation.

Technical model names may appear in a secondary methodology panel if
they are real and useful to expert users.

## 13.3 Minimum useful workflow

1.  Choose a real baseline.
2.  Choose one or more supported assumptions to change.
3.  Review the assumptions before running.
4.  Run the computation.
5.  Show progress honestly.
6.  Present results with units and definitions.
7.  Compare baseline and alternative.
8.  Explain the trade-offs and limitations.
9.  Save/export only if supported.
10. Allow the user to return to the input and reproduce the scenario.

## 13.4 Inputs

-   Use human labels.
-   Include units.
-   Set sensible defaults from real data when possible.
-   Validate ranges.
-   Explain why an input matters.
-   Avoid exposing raw model parameters to ordinary users.
-   Do not invent precision by allowing six decimal places where the
    data only supports whole units.
-   Distinguish editable assumptions from measured facts.

## 13.5 Results

Show: - Baseline value. - Scenario value. - Difference. - Units. -
Assumptions. - Data timestamp/source. - Calculation status. - Model or
method limitations where relevant.

Avoid: - "AI confidence 99.2%" without calibration and validation. - A
single green "optimal" badge without a defined objective. - Fancy
histograms with no labels. - A score with no explanation. - Claiming a
route is safer/faster/cheaper without a supported calculation. -
Pretending a simulated output is an operational action.

## 13.6 Simulation vs. action

Running a scenario must not automatically reroute a real vehicle unless
a separately authorized and fully supported action exists.

The interface should clearly distinguish: - "Run comparison" ---
computation only. - "Apply plan" --- real operational mutation, if
supported. - "Export results" --- file generation, if supported.

Before applying a real plan: - Show the consequence. - Show affected
objects. - Ask for confirmation where appropriate. - Validate
permissions. - Handle failures. - Record the outcome if audit logging
exists.

## 13.7 Scenario states

-   Draft.
-   Running.
-   Completed.
-   Failed.
-   Cancelled.
-   Stale (inputs changed after computation).
-   Saved, if persistence is real.

Never show "completed" when the backend timed out.

------------------------------------------------------------------------

# 14. Settings tab

## 14.1 User question

"How do I control my account and workspace?"

## 14.2 Settings structure

Use grouped, understandable sections: - Account. - Workspace. -
Notifications. - Data sources / integrations, if supported. - Appearance
and preferences. - Security. - Audit history, if the user is authorized
and the capability exists.

## 14.3 Account

-   Display name.
-   Email.
-   Account identifiers only where needed.
-   Password change/reset route if supported.
-   Sign out.
-   Account deletion only if a valid backend workflow and policy exist.

## 14.4 Workspace

Only include real settings: - Workspace name. - Timezone. - Units. -
Operational defaults. - Team membership, if supported. - Workspace
deletion only with strong confirmation and authorization.

## 14.5 Notifications

-   Explain which events can generate notifications.
-   Let users choose meaningful categories.
-   Show delivery channel status if available.
-   Do not expose toggles for notification types that are not
    implemented.
-   Do not claim an email or push notification was delivered unless
    delivery is confirmed by the system.

## 14.6 Appearance

-   Light.
-   Dark.
-   System preference.

Do not add theme marketplaces, accent pickers or decorative
personalization unless users genuinely need them.

## 14.7 Integrations

For each integration: - Name. - Purpose. - Connected/disconnected state
based on actual connection check. - Last successful sync. - Error
details appropriate to the user's permissions. - Connect/disconnect
actions only if supported. - Clear data ownership and permissions. -
Retry or reconnect path.

Never use a green "Connected" badge because credentials exist; verify
that the integration is actually functioning where possible.

## 14.8 Security

-   Active sessions if supported.
-   Password/passkey management if implemented.
-   Access roles and permissions.
-   Audit events where supported.
-   Clear explanation of security behavior.
-   No invented "Aegis matrix" if ordinary controls and audit history
    are clearer.

------------------------------------------------------------------------

# 15. Optional pages and whether to keep them

## 15.1 Fleet

Keep as a separate tab only if vehicle management is a frequent,
distinct job. Otherwise include a Fleet filter/view inside Live
operations.

A useful fleet view shows: - Vehicle identifier. - Last known
location. - Last update. - Operational status. - Assigned
shipment/route, if available. - Relevant exception. - Actions that
actually work.

## 15.2 Warehouses

Keep as a separate destination only if users create/manage facilities
and inspect their operations. Otherwise use a filter and detail panel in
Live operations.

## 15.3 Incidents / exceptions

A dedicated exceptions queue is valuable if it helps users triage and
resolve real problems. It should not duplicate the Overview attention
list without adding workflow value.

Each incident needs: - Clear severity. - Affected entity. -
Detected/received time. - Current owner/status. - Evidence or source. -
Next action. - Resolution history if supported.

## 15.4 Reports

Keep only when the report is reproducible and grounded in real data.
Show: - Period. - Metric definitions. - Source coverage. - Generation
timestamp. - Export format. - Data limitations.

Do not create a report page that only rearranges decorative KPI cards.

## 15.5 Audit log

Keep if the product genuinely records events and the user has permission
to inspect them. Distinguish: - User action. - System event. -
AI-generated suggestion. - Confirmed operational action.

Do not call a log "immutable" or "cryptographic" unless the
implementation verifies that property.

## 15.6 Driver portal / PWA

Treat this as a distinct mobile workflow if drivers genuinely use it.
Prioritize: - Large touch targets. - Minimal typing. - Clear assigned
manifest. - Reliable connectivity handling. - Explicit permission
requests. - Safe location sharing. - Delivery confirmation steps. -
Clear failure recovery.

Do not claim geo-verified proof of delivery unless location capture,
timestamps, identity and persistence work as specified.

## 15.7 AI copilot

Keep out of the primary navigation until it can perform a reliable user
job.

If retained: - Explain what data it can access. - Show source references
for factual answers when possible. - Separate suggestions from executed
actions. - Ask for confirmation before consequential actions. - Handle
uncertainty. - Provide feedback/reporting. - Avoid a generic chat panel
that does not know the workspace state. - Do not present hallucinated
values as system facts.

------------------------------------------------------------------------

# 16. Trust, data provenance and accuracy

## 16.1 Every important value needs a provenance story

For each value, establish: - Source. - Time of source observation. -
Time ingested. - Whether the value is measured, estimated, predicted,
calculated or user-entered. - Unit. - Missing-data behavior. -
Validation rules. - Any confidence/calibration method, if applicable.

## 16.2 Status language

Use distinct language: - **Confirmed:** supported by a reliable
source/event. - **Estimated:** calculated or inferred using an
identified method. - **Predicted:** output from a predictive method. -
**Reported:** received from an external system or person. - **Stale:**
last update exceeds the defined freshness threshold. - **Unavailable:**
source or result could not be obtained. - **Unknown:** system cannot
determine state.

Do not use these labels interchangeably.

## 16.3 Accuracy claims

Before showing a model accuracy percentage: - Define the prediction
target. - Define the evaluation population. - Define the time period. -
Define the metric. - Compare against a meaningful baseline. - Check
calibration if presenting probabilities. - Document limitations and
sample size. - Monitor drift where appropriate. - Re-evaluate after
model/data changes. - Show the result only to the degree the evidence
supports.

If these conditions are not met, remove the percentage from the UI and
marketing.

## 16.4 Demo data

Demo mode must be explicit: - Visible "Demo data" banner. - Clear
explanation that values are illustrative. - Distinct styling if
necessary. - No mixing demo and production records. - Demo mode must not
trigger real actions. - Switching out of demo mode must not leave sample
data behind. - Do not use sample values to pad a production dashboard.

## 16.5 Failure honesty

If the backend is down: - Do not show cached data as live. - If cached
data is shown, label its timestamp. - Preserve user input where
possible. - Explain the failed action. - Offer retry only when retry is
safe. - Never fabricate a success response.

------------------------------------------------------------------------

# 17. Motion and interaction system

## 17.1 Motion philosophy

Motion should: - Show where content came from or went. - Connect a
selected map marker to its detail panel. - Confirm a state change. -
Help the user understand navigation. - Avoid blocking interaction.

Motion should not: - Make static pages feel busy. - Delay a task. -
Repeat forever without a clear reason. - Hide loading failures. -
Animate every card into view. - Turn ordinary button clicks into a show.

## 17.2 Duration tokens

Starting points: - Instant feedback: 80--120 ms. - Small control state:
120--180 ms. - Menu/popover: 150--220 ms. - Panel transition: 180--280
ms. - Page transition: 200--320 ms. - Landing storytelling: longer only
where the user can skip and the content remains available.

Do not make every interaction use the same duration. Avoid excessively
long easing curves on frequent operational actions.

## 17.3 Easing

-   Use a restrained ease-out for entering elements.
-   Use a quicker ease-in for dismissal.
-   Use spring-like motion only when it improves physical understanding.
-   Avoid bouncy transitions in a serious operations product.
-   Do not use different easing curves randomly across components.

## 17.4 Motion accessibility

-   Honor `prefers-reduced-motion`.
-   Replace large movement with opacity or immediate state changes.
-   Avoid parallax for essential content.
-   No flashing.
-   No autoplay sound.
-   Do not animate critical status color in a way that causes
    distraction.
-   Ensure animation does not cause layout shift.

## 17.5 Interaction feedback

For every action, define: - Initial state. - Hover state. - Focus
state. - Pressed state. - Disabled state. - Pending state. - Success
state. - Error state. - Cancellation behavior.

If the designer cannot describe the states, the interaction is not
ready.

------------------------------------------------------------------------

# 18. Responsive design

## 18.1 Breakpoints

Use the project's existing responsive breakpoints where practical. Avoid
inventing a different breakpoint system per component.

Typical design checkpoints: - Small mobile: 320--374 px. - Mobile:
375--430 px. - Tablet: 600--900 px. - Desktop: 1024--1439 px. - Wide
desktop: 1440 px and above.

These are testing ranges, not a mandate to create a separate layout at
every number.

## 18.2 Responsive priorities

-   Content hierarchy remains stable.
-   Primary action stays discoverable.
-   Forms remain usable.
-   Table data remains accessible.
-   Map controls do not overlap.
-   Side panels become sheets when appropriate.
-   Navigation does not obscure content.
-   No horizontal scrolling except for deliberate data tables or map
    gestures.
-   Avoid tiny icon-only actions on mobile.
-   Ensure dialog height respects the visible viewport and keyboard.

## 18.3 Responsive QA

Test: - 320 px wide. - 375 px wide. - 768 px wide. - 1024 px wide. -
1280 px wide. - 1440 px wide. - 1920 px wide. - 200% zoom. - Long
labels. - Large data counts. - Empty states. - Open dropdowns near
viewport edges. - Map fullscreen and panel behavior.

------------------------------------------------------------------------

# 19. Accessibility

Target WCAG 2.2 AA as a baseline.

-   Semantic HTML.
-   Keyboard access for all interactive controls.
-   Visible focus indicators.
-   Correct heading order.
-   Form labels and field errors.
-   Sufficient text and non-text contrast.
-   Touch target sizing.
-   Screen-reader names for icon buttons.
-   Reduced-motion support.
-   No color-only status.
-   No keyboard traps.
-   Correct dialog focus handling.
-   Accessible tables.
-   Map entities accessible through a synchronized list.
-   Live regions only where announcements help.
-   No important information available only on hover.
-   Text resizing without loss of function.
-   Authentication compatible with password managers and paste.

Automated accessibility checks are useful but do not replace keyboard
and screen-reader testing.

------------------------------------------------------------------------

# 20. Frontend architecture and design-system implementation

## 20.1 Existing repository context

The repository is described as a Next.js App Router frontend with a
FastAPI backend and shared design token files. Current source paths
referenced in the repository include:

-   `frontend/styles/tokens.css`
-   `frontend/styles/globals.css`
-   `frontend/components/world/InteractiveWorldMap.tsx`
-   `frontend/components/world/NexusWorld.tsx`

The README describes routes including Overview, Operations, Status,
Settings, Simulations, admin/audit and driver-related pages. Treat this
as a repository inventory to verify, not proof that every route is
production-ready.

## 20.2 Audit before refactor

For every route: - Identify its page component. - Identify the data
source. - Identify all API calls. - Identify permissions. - Identify
local state. - Identify loading/error/empty states. - Identify mock-data
imports. - Identify nonfunctional buttons. - Identify duplicated
components. - Identify route-specific styling overrides. - Identify
unused components. - Identify test coverage. - Record the actual result
of manual verification.

## 20.3 Component ownership

Suggested layers: - `app/`: routing and page composition. -
`components/shell/`: app shell, sidebar, header, mobile navigation. -
`components/ui/`: reusable controls and primitives. -
`components/data-display/`: tables, status, timelines, metrics. -
`components/maps/`: Leaflet map, layers, markers, controls, map
selection. - `components/forms/`: validated task forms. -
`components/feedback/`: alerts, toasts, empty/loading/error states. -
`features/shipments/`: shipment-specific components and logic. -
`features/operations/`: operations-specific workflows. -
`features/planning/`: scenario workflows. - `features/settings/`:
preferences and configuration. - `lib/api/`: typed API client and
endpoint functions. - `lib/auth/`: session/auth helpers. -
`lib/format/`: date, number, currency and unit formatting. - `styles/`:
semantic design tokens and global styles.

Adapt this structure to the actual codebase rather than mechanically
moving files. Avoid a giant refactor that breaks working features.

## 20.4 Design tokens as source of truth

-   Keep semantic tokens centralized.
-   Remove duplicate declarations after checking usage.
-   Avoid hardcoded colors in shared components.
-   Define spacing, radii, shadows, typography, motion and z-index
    scales.
-   Use tokens consistently.
-   Add a token usage guide.
-   Avoid adding a new token for a one-off value without reason.

## 20.5 State management

-   Keep transient UI state local when possible.
-   Share state only when multiple views need it.
-   Distinguish server data from client UI state.
-   Avoid duplicated sources of truth.
-   Avoid derived state that can be computed.
-   Keep map layer visibility and menu open/closed state separate.
-   Do not tie the visibility of a layer to whether its settings menu is
    open.
-   Avoid global stores for state used by a single component.
-   Use stable identifiers for lists and entities.

## 20.6 API client behavior

-   Centralize base URL and error handling.
-   Use typed request/response models where possible.
-   Handle timeouts.
-   Handle unauthorized responses.
-   Handle rate limits.
-   Handle server errors.
-   Validate response shapes at boundaries when needed.
-   Avoid swallowing errors into empty arrays.
-   Do not replace failed API responses with mock data silently.
-   Keep demo fixtures separate from production API code.
-   Show stale-cache metadata if cache fallback is used.

## 20.7 Data formatting

Centralize: - Date/time formatting. - Timezone formatting. - Relative
time. - Number formatting. - Currency formatting. - Distance and
duration units. - Status label mapping. - Null/missing value display.

Never show `undefined`, `NaN`, raw backend enum strings or an
unformatted timestamp in a polished UI.

## 20.8 Error boundaries and logging

-   Add page or feature-level error boundaries where appropriate.
-   Preserve unaffected parts of the app.
-   Log diagnostic detail safely.
-   Do not show stack traces or secrets to users.
-   Add request/correlation IDs only if the backend actually supplies
    them.
-   Avoid noisy console errors.
-   Do not catch every error and return a fake success object.

------------------------------------------------------------------------

# 21. Performance and reliability

## 21.1 Performance targets

Treat these as goals to measure: - Fast first contentful rendering. - No
layout shift caused by image or font loading. - Responsive interactions
on ordinary laptops. - Map stays usable under realistic marker counts. -
Large tables do not freeze the page. - Animation remains smooth on
supported devices. - Bundle size is controlled. - Heavy 3D libraries are
not loaded on routes that do not need them.

Measure with real builds and representative data; do not claim
performance scores without measurement.

## 21.2 Image strategy

-   Use approved assets.
-   Optimize image size and formats.
-   Provide aspect ratios to avoid layout shifts.
-   Use meaningful alt text for informative images.
-   Use empty alt for decorative imagery.
-   Do not generate a new random AI image for every page.
-   Do not use imagery that falsely represents a real customer, fleet or
    facility.

## 21.3 Map performance

-   Cluster dense markers.
-   Avoid rebuilding the entire map on every unrelated React state
    update.
-   Update changed layers selectively where practical.
-   Clean up listeners and observers.
-   Avoid unnecessary animation loops.
-   Test on lower-powered devices.
-   Handle tile/network failures.
-   Do not fetch unnecessary global datasets.

## 21.4 Performance acceptance

-   Run production build.
-   Measure actual loading behavior.
-   Test with network throttling.
-   Test with a large but realistic dataset.
-   Check memory and listener cleanup.
-   Check mobile responsiveness.
-   Document any known limitation.

------------------------------------------------------------------------

# 22. Security and privacy in the UX

-   Never expose secrets in frontend code.
-   Never rely on hidden UI alone for authorization.
-   Server must validate every protected operation.
-   Handle expired sessions clearly.
-   Avoid leaking account existence during recovery.
-   Request location permission only when the user initiates a feature
    that needs it.
-   Explain location use in plain language.
-   Do not collect more data than necessary.
-   Do not show sensitive operational data to unauthorized users.
-   Avoid storing sensitive data in local storage without a reviewed
    reason.
-   Do not log passwords, tokens or personal details.
-   Ensure export actions respect authorization.
-   Confirm destructive operations.
-   Provide a clear sign-out flow.

------------------------------------------------------------------------

# 23. Content design and microcopy

## 23.1 Writing rules

-   Use short, direct sentences.
-   Lead with the user's task or result.
-   Prefer verbs.
-   Avoid jargon unless the audience expects it.
-   Explain technical terms where necessary.
-   Do not exaggerate.
-   Avoid fake urgency.
-   Use the same term for the same concept everywhere.
-   Avoid vague error messages such as "Something went wrong" without a
    next step.

## 23.2 Button label examples

Prefer: - "Create shipment" - "Import CSV" - "View shipment" - "Clear
filters" - "Retry connection" - "Compare plans" - "Save changes" -
"Cancel" - "Sign in" - "Create account"

Avoid: - "Launch" - "Engage" - "Optimize now" - "Activate
intelligence" - "Execute" - "Do it" - "Magic fix"

## 23.3 Error copy examples

API unavailable: "We couldn't load shipment data. Your changes have not
been submitted." Action: "Try again"

Stale data: "The latest update we received was 24 minutes ago. The
current location may have changed." Action: "Check connection" if
supported

Invalid form: "Enter a valid email address."

Permission: "You don't have permission to change this workspace setting.
Ask a workspace administrator."

No results: "No shipments match your search. Check the ID or clear
filters."

Simulation failure: "We couldn't complete this comparison. Your inputs
are still available so you can try again."

Do not disclose internal server stack traces.

------------------------------------------------------------------------

# 24. What to remove, hide, merge or rebuild

This is a design decision list, not a claim that each listed item has
been verified in the current app. Audit each item before changing it.

## 24.1 Remove immediately if present and not essential

-   Purple/blue AI gradients used as a generic theme.
-   Glowing cards and neon outlines.
-   Random particles and floating orbs.
-   Continuous decorative animations.
-   Emoji in professional navigation.
-   Excessive glassmorphism.
-   Giant KPI cards without useful meaning.
-   Duplicate cards showing the same number.
-   Fake "live" indicators.
-   Fake route/vehicle motion.
-   Unsupported accuracy, confidence, ROI or savings claims.
-   AI-generated stock visuals used as if they were real operational
    scenes.
-   Fake testimonials and customer logos.
-   Unused buttons and controls.
-   Dead navigation items.
-   Empty charts with decorative curves.
-   Unexplained scores.
-   Random map grid lines that cannot be controlled.
-   Duplicate map implementations without distinct purpose.
-   Unnecessary confirmation modals.
-   Forced onboarding that blocks work.
-   Repeated intro animation on every page.
-   Sound effects for ordinary clicks.
-   Unnecessary command-palette complexity.
-   Technical internal names shown as primary user labels.
-   Fake connected integrations.
-   Fake security/uptime badges.
-   Sample data mixed with production data.
-   Empty dashboard widgets retained just to fill space.

## 24.2 Merge when workflows overlap

-   Fleet and map entity browsing, if users perform the same task in
    both.
-   Overview exception summaries and the dedicated exceptions queue, if
    one is merely duplicating the other.
-   Separate data-source status cards into one clear integration health
    view.
-   Duplicate "AI assistant" entry points.
-   Repeated action buttons across the same record.
-   Multiple search inputs that search the same entities.
-   Duplicate status indicators that disagree.

## 24.3 Hide until verified

-   Monte Carlo simulation claims.
-   PINN / physics-informed ML claims.
-   SHAP explainability claims.
-   Cryptographic immutable audit claims.
-   Autonomous rerouting.
-   Real-time weather and traffic.
-   Driver GPS beaconing.
-   Geo-verified proof of delivery.
-   AI voice copilot.
-   Exact model accuracy or confidence.
-   Carbon avoidance metrics.
-   Enterprise uptime figures.
-   SSO, passkeys or biometric login.
-   Any integration that is not actually connected.
-   Any feature that uses hardcoded fixtures in its production path.

## 24.4 Keep only with evidence

A feature should be promoted to the primary experience when: - The core
path works end-to-end. - Data source is identified. - Errors are
handled. - Permissions are enforced. - User can understand the output. -
Tests cover critical behavior. - The feature has a distinct user
benefit. - It is better than the simpler alternative.

------------------------------------------------------------------------

# 25. Quality gates before release

## 25.1 Functional audit

For each route and control, record: - Intended purpose. - Actual
behavior. - Data dependency. - Permission requirement. - Result. - Error
behavior. - Test evidence. - Decision: keep, fix, hide, remove.

## 25.2 Visual audit

-   Consistent type scale.
-   Consistent spacing.
-   Consistent button heights.
-   Consistent focus rings.
-   Consistent status semantics.
-   No arbitrary gradients.
-   No inconsistent radii.
-   No card overload.
-   No clipped menus.
-   No overlap at responsive sizes.
-   No layout shift.
-   No low-contrast metadata.
-   No meaningless empty space.
-   No placeholder copy left behind.

## 25.3 Interaction audit

-   Every button works.
-   Every form validates.
-   Every route resolves.
-   Every dialog closes correctly.
-   Keyboard focus is correct.
-   Menus dismiss as expected.
-   Map interactions do not conflict with controls.
-   Pending states prevent duplicate operations.
-   Error states offer safe recovery.
-   Navigation preserves context where expected.

## 25.4 Data audit

-   No hardcoded production metrics.
-   No fake live values.
-   No silent mock fallback.
-   No inaccurate timestamps.
-   No invented status labels.
-   No unsupported accuracy percentage.
-   No hidden stale data.
-   No misleading prediction.
-   No inconsistent values across overview/detail/map.

## 25.5 Build and test audit

Run the project's actual package scripts and test suites after
inspecting their definitions. The README references frontend
typecheck/lint and backend tests; verify that those scripts exist and
run successfully rather than assuming they do.

Minimum checks: - Lint. - Typecheck. - Production build. - Unit tests
for important logic. - API integration tests. - Authentication flow
tests. - Responsive smoke tests. - Keyboard/accessibility tests. -
End-to-end shipment workflow. - Map layer and grid interaction tests. -
Failure-mode tests. - Permission tests.

Never claim "all tests pass" unless the commands were run and the
results were observed.

------------------------------------------------------------------------

# 26. Implementation phases

## Phase 0 --- Evidence-based audit

Deliverables: - Route inventory. - Component inventory. -
API/data-source inventory. - Mock-data inventory. - Broken interaction
list. - Screenshot inventory. - Accessibility findings. - Feature
decision matrix. - Baseline build/test status.

Exit criteria: - Every primary route is classified. - Every primary
feature has a known source and status. - No major implementation
decision depends solely on README claims.

## Phase 1 --- Foundation

Deliverables: - Semantic design tokens. - Typography and spacing
system. - Shared shell. - Button/input/table/status primitives. - Shared
loading/empty/error states. - API error handling. -
Session/authorization handling.

Exit criteria: - Shared components are consistent. - No critical auth or
navigation regression. - Tokens replace arbitrary repeated styling where
practical.

## Phase 2 --- Brand and first impression

Deliverables: - Wordmark and symbol. - App icon and favicon. - Landing
page story. - Intro animation and reduced-motion variant. -
Authentication screens. - Sign-in recovery states.

Exit criteria: - Landing claims are verified. - Returning users can
bypass the intro. - Authentication works end-to-end. - No fake product
visuals or claims.

## Phase 3 --- Core workflows

Deliverables: - Overview attention queue. - Shipment list and detail. -
Live operations map. - Correct map layers and grid control. - Useful
empty/loading/error states.

Exit criteria: - A user can complete the core journey without
coaching. - All displayed records come from a known source or explicitly
labeled demo mode. - Map controls pass manual tests.

## Phase 4 --- Planning and advanced workflows

Deliverables: - Planning scenario workflow, if verified. - Scenario
assumptions and comparison. - Optional reports, admin and integrations
based on evidence.

Exit criteria: - Advanced features have a clear user job. - Results are
reproducible and explain limitations. - Unverified capabilities remain
hidden.

## Phase 5 --- Refinement

Deliverables: - Motion tuning. - Responsive polish. - Accessibility
fixes. - Performance work. - Copy refinement. - Visual consistency
audit.

Exit criteria: - No major usability blockers. - No known fake data. - No
broken primary controls. - No unhandled common failure state. - Measured
performance is acceptable for the supported environment.

------------------------------------------------------------------------

# 27. Definition of done

The redesign is not done when screenshots look impressive.

It is done when: - The brand is recognizable without decorative
effects. - The landing page tells a clear, truthful story. -
Authentication is smooth and reliable. - The main navigation matches
real user tasks. - A new user understands where to start. - Every
visible feature has a distinct purpose. - Every important value has a
known source and freshness state. - The map controls work, including
grid visibility and menu dismissal. - There are no mock values disguised
as production data. - The app handles empty, stale, loading and error
states. - Advanced features are honest about limitations. -
Accessibility is tested. - Responsive layouts are tested. - Build and
tests have been run. - Known issues are documented rather than hidden.

------------------------------------------------------------------------

# 28. Working design review checklist

Use this at every design review.

### Brand

-   [ ] Does the product look like Nexus rather than a generic AI
    dashboard?
-   [ ] Does the logo work in monochrome?
-   [ ] Is the accent color restrained?
-   [ ] Is there a coherent visual language?

### Hierarchy

-   [ ] Can a user identify the page purpose in a few seconds?
-   [ ] Is there one obvious primary action?
-   [ ] Are secondary details visually quieter?
-   [ ] Is any content present only to fill space?

### Data truth

-   [ ] Is every metric defined?
-   [ ] Is source/freshness visible where important?
-   [ ] Are estimates distinct from confirmed facts?
-   [ ] Is demo data labeled?
-   [ ] Are any claims unsupported?

### Interaction

-   [ ] Does every control work?
-   [ ] Are loading and failure states handled?
-   [ ] Can the user recover?
-   [ ] Does the interface preserve context?
-   [ ] Does keyboard interaction work?

### Motion

-   [ ] Does motion explain something?
-   [ ] Can the user act immediately?
-   [ ] Is reduced motion respected?
-   [ ] Is anything looping without a purpose?

### Density

-   [ ] Are tables used when comparison matters?
-   [ ] Are cards used only when grouping matters?
-   [ ] Are map controls discoverable?
-   [ ] Is the information density appropriate for the task?

### Finish

-   [ ] Are alignment and spacing consistent?
-   [ ] Are long labels handled?
-   [ ] Is contrast sufficient?
-   [ ] Are small screens usable?
-   [ ] Are loading skeletons stable?

------------------------------------------------------------------------

# 29. Final product direction

Nexus should not try to look futuristic. It should look considered.

The landing page earns attention through a clear story and a
well-composed visual. The authentication experience removes friction.
The app shell gives the user a stable mental model. Overview prioritizes
real work. Shipments makes records easy to find and understand. Live
operations uses a dependable map with controls that behave predictably.
Planning explains assumptions and trade-offs rather than pretending to
know the future. Settings exposes only real capabilities. The entire
product communicates uncertainty honestly.

The guiding standard is:

**Make the useful things obvious. Make the complex things
understandable. Make the uncertain things honest. Remove everything that
exists only to impress.**

This document should guide an evidence-based redesign of the existing
repository. It is not permission to rebuild everything at once, invent
capabilities, or replace working code without testing. Start with the
audit, then improve the highest-value user journey end-to-end.

# 30. Page contracts and acceptance criteria

## 30.1 Overview

**User question:** What needs attention right now?

**Required capabilities (only if backed by working implementation):** -
Actionable exception queue. - Recent activity. - Defined operational
summary. - One primary action.

**Do not ship:** - Unsupported KPI. - Decorative chart. - Duplicate
alert cards. - Unexplained score.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.2 Shipments

**User question:** Where is this shipment and what is known?

**Required capabilities (only if backed by working implementation):** -
Search. - Filters. - Sortable list. - Detail timeline. - Source and
freshness. - Relevant actions.

**Do not ship:** - Fake progress. - Invented milestones. - Unverified
ETA. - Silent mock fallback.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.3 Live operations

**User question:** What is happening geographically?

**Required capabilities (only if backed by working implementation):** -
Leaflet map. - Supported entity layers. - Selection detail panel. -
Fit-to-data. - Grid toggle only if useful.

**Do not ship:** - Competing map implementations. - Decorative grid
outside layer control. - Fake moving markers. - Nonfunctional
weather/traffic.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.4 Planning

**User question:** How do these supported plans compare?

**Required capabilities (only if backed by working implementation):** -
Baseline. - Editable assumptions. - Run status. - Results and units. -
Limitations. - Reproducibility.

**Do not ship:** - Magic optimal score. - Unsupported confidence. -
Simulated result presented as action.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.5 Settings

**User question:** How do I control my account/workspace?

**Required capabilities (only if backed by working implementation):** -
Account. - Preferences. - Real notifications. - Verified integrations. -
Security settings.

**Do not ship:** - Unimplemented toggles. - Fake connected badges. -
Decorative security matrix.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.6 Admin / audit

**User question:** What changed and who is allowed to do what?

**Required capabilities (only if backed by working implementation):** -
Role-aware access. - Real event records. - Filters. - Clear
actor/time/action fields.

**Do not ship:** - Claim of immutability without proof. - Fake audit
events. - UI-only authorization.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.7 Driver portal

**User question:** What do I need to do for this delivery?

**Required capabilities (only if backed by working implementation):** -
Assigned manifest. - Large touch controls. - Offline/retry behavior. -
Proof of delivery if real.

**Do not ship:** - Unnecessary desktop dashboard. - Fake GPS. -
Unverified geo-proof.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

## 30.8 AI assistance

**User question:** Can this help me answer a specific operational
question?

**Required capabilities (only if backed by working implementation):** -
Grounded answers. - Sources. - Clear uncertainty. - Confirm
consequential actions.

**Do not ship:** - Generic chatbot with no data access. - Fake
accuracy. - Unconfirmed execution.

**Acceptance checks:** - A new user can explain the purpose without a
verbal walkthrough. - Primary action is obvious and its result is
visible. - Loading, empty, stale, error and permission states are
handled. - Data comes from a known source or is explicitly labeled as
demo content. - No control is displayed unless it has a supported
behavior. - Keyboard focus and small-screen behavior are checked. - The
route is included in end-to-end smoke tests.

# 31. Data-state contract

Every data-backed component should implement a deliberate state model.
Do not overload an empty array to mean loading, error, disconnected,
unauthorized and truly empty.

Recommended conceptual states: - `idle`: no request has been made yet. -
`loading`: a request is in progress. - `success`: a valid response was
received. - `empty`: request succeeded but there are no records. -
`partial`: some sources succeeded and others did not. - `stale`: cached
or last-known data is shown with its age. - `error`: request failed. -
`unauthorized`: access is not allowed or the session has expired. -
`offline`: connectivity is unavailable, if this can be detected
reliably.

State rules: - Never render a loading skeleton and an empty state at the
same time. - Never render zero as a placeholder for an unknown value. -
Never transform an error into a successful empty response without an
explicit product decision. - Preserve the last successful data only when
it is safe and clearly marked as stale. - Distinguish "no records exist"
from "records could not be loaded." - Do not show "updated just now"
unless a successful update timestamp supports it. - A retry button must
actually retry the failed operation. - A stale badge must have a defined
freshness threshold. - A disconnected source must not continue to appear
healthy based solely on cached values.

# 32. Z-index and overlay policy

Define a single z-index scale and use it consistently: - Base content. -
Sticky page header. - Map controls. - Popovers and dropdowns. - Side
panels. - Modal backdrop. - Modal dialog. - Toasts and urgent system
notices.

Do not use arbitrary z-index values such as 999999 in individual
components. Avoid creating a stacking context unintentionally through
transforms, opacity or filters. Menus that must escape a clipped parent
should use a suitable portal or layout strategy. Test dropdowns inside
map containers, side panels, fullscreen mode and mobile sheets.

# 33. Form behavior contract

For every form: - State the purpose. - Use visible labels. - Group
related fields. - Use the correct field types. - Validate client-side
for immediate feedback. - Validate server-side for security and
correctness. - Preserve valid input after a recoverable error. - Show
errors next to the relevant field. - Prevent duplicate submissions. -
Make cancellation behavior explicit. - Warn before losing meaningful
unsaved changes. - Announce success only after the server confirms it. -
Keep focus behavior predictable. - Do not auto-advance fields unless the
flow benefits from it. - Do not use placeholder-only labels. - Do not
clear the entire form after a failed request.

# 34. Search and filter contract

-   Search scope is clear.
-   Search supports expected identifiers.
-   Filters are visible when active.
-   Active filter count is accurate.
-   "Clear all" clears all relevant filters.
-   Sorting state is visible.
-   Empty results are distinct from request failures.
-   Query state is preserved when opening and returning from a detail
    page where practical.
-   Search never invents fallback results.
-   Search permissions are enforced server-side.
-   Long-running search has a pending state.
-   Keyboard navigation works for suggestions.
-   A result reveals why it matched where this improves confidence.

# 35. Confirmation and destructive-action policy

Ask for confirmation when: - The action is destructive or difficult to
reverse. - The action affects multiple operational records. - The action
sends a real dispatch or notification. - The action changes
access/security settings. - The action has a material external
consequence.

Do not ask for confirmation for every low-risk navigation or filter
change.

A confirmation should state: - What will happen. - Which records or
people are affected. - Whether the action can be undone. - The clear
primary confirmation action. - A safe cancel action.

# 36. Logging and observability contract

-   Log technical details on the server or in approved telemetry.
-   Do not expose secrets or tokens.
-   Use a request ID only if one exists.
-   Make user-facing messages useful without disclosing sensitive
    internals.
-   Capture failures for important workflows.
-   Record mutation outcomes.
-   Do not create a fake audit history in the client.
-   Do not label logs "immutable" unless immutability is enforced and
    verified.
-   Distinguish client validation failure from server failure.
-   Make repeated failure patterns diagnosable.

# 37. Product review questions

Before adding any feature, ask: 1. Which user has this problem? 2. How
often does it occur? 3. What decision or task does this enable? 4. What
is the simpler alternative? 5. What real data does it require? 6. How
does it fail? 7. How does the user recover? 8. What permission is
required? 9. What is the evidence that the feature works? 10. What
existing feature should be removed or simplified instead? 11. Does it
make the main workflow easier? 12. Can the user explain the output? 13.
Does the feature introduce a new unsupported claim? 14. Can the same
result be achieved with a clearer table or detail panel? 15. What will
the team test before release?

# 38. Non-negotiable product rules

1.  No fake metrics in production.
2.  No unsupported accuracy claims.
3.  No mock data presented as live.
4.  No dead buttons.
5.  No hidden authorization assumptions.
6.  No map control without tested behavior.
7.  No animation that blocks essential work.
8.  No top-level navigation item without a distinct user job.
9.  No chart without a defined measure, unit and source.
10. No destructive action without a safe interaction design.
11. No silent API error converted into a success-looking screen.
12. No claims of real-time updates without a verified update path.
13. No feature retained solely because it looks impressive.
14. No major refactor without a baseline and regression checks.
15. No "done" declaration based only on visual inspection.

# 39. Final review scorecard

Score each dimension with evidence, not intuition: - Product clarity. -
Brand consistency. - Navigation clarity. - Authentication usability. -
Shipment workflow completion. - Map reliability. - Data provenance. -
Error recovery. - Accessibility. - Responsive behavior. - Performance. -
Test coverage. - Visual consistency. - Trustworthiness of claims.

Use three statuses: - **Pass:** evidence shows the acceptance criteria
are met. - **Needs work:** the feature exists but misses one or more
criteria. - **Not verified:** no evidence yet; do not represent it as
complete.

Do not calculate a flattering overall percentage unless the scoring
methodology is defined. A single critical failure in authentication,
permissions, data integrity or operational actions should block release
regardless of the average.

# 40. Closing direction

The design system must make it easy for engineers to build consistent
screens, and the product strategy must make it acceptable to remove
features that do not earn their place.

A premium product is not defined by gradients, shadows, rounded corners
or a dramatic landing page. It is defined by the quality of decisions
behind the interface: the right information at the right time, truthful
data, predictable controls, thoughtful motion, clear writing, and a
reliable path through the user's task.

**Nexus should be calm enough to trust, clear enough to use, and capable
enough to earn its complexity.**

# 41. Repository audit worksheet

-   [ ] List every route and note whether it is linked in navigation.
-   [ ] Identify the page component and shared layout.
-   [ ] Identify all API calls and their response models.
-   [ ] Identify every import of mock data.
-   [ ] Identify all client-side fallback values.
-   [ ] Identify every primary and secondary action.
-   [ ] Click every action and record the actual result.
-   [ ] Identify all role and permission checks.
-   [ ] Record empty, loading, error and stale-data behavior.
-   [ ] Capture desktop and mobile screenshots.
-   [ ] Record keyboard and screen-reader issues.
-   [ ] Record console errors and network failures.
-   [ ] Classify as keep, fix, hide, remove or merge.
-   [ ] Attach test evidence to each classification.

# 42. Visual QA checklist

-   [ ] Verify page title hierarchy.
-   [ ] Verify consistent content alignment.
-   [ ] Verify one primary action per region.
-   [ ] Verify button height and label alignment.
-   [ ] Verify input labels and helper text.
-   [ ] Verify status color semantics.
-   [ ] Verify table row height and column alignment.
-   [ ] Verify cards are used only when grouping is useful.
-   [ ] Verify page background and surface contrast.
-   [ ] Verify no arbitrary glow or gradient remains.
-   [ ] Verify dropdowns are not clipped.
-   [ ] Verify modal z-index and focus handling.
-   [ ] Verify long content wraps correctly.
-   [ ] Verify empty states include a next step.
-   [ ] Verify skeletons match the final layout.
-   [ ] Verify no page contains placeholder marketing copy.
-   [ ] Verify no visual element implies fake live status.
-   [ ] Verify reduced-motion behavior.
-   [ ] Verify dark mode if it is supported.
-   [ ] Verify browser zoom and small viewport behavior.

# 43. End-to-end workflow checklist

-   [ ] Open landing page in a fresh session.
-   [ ] Skip the introduction immediately.
-   [ ] Navigate to sign-in.
-   [ ] Submit invalid input and inspect validation.
-   [ ] Submit valid credentials against the real auth service.
-   [ ] Verify server-side session state.
-   [ ] Refresh a protected route.
-   [ ] Open a deep link while signed out.
-   [ ] Recover password using the actual reset flow.
-   [ ] Sign out and verify protected content is inaccessible.
-   [ ] Open Overview with a populated workspace.
-   [ ] Open Overview with an empty workspace.
-   [ ] Open Overview with an API failure.
-   [ ] Search for a known shipment.
-   [ ] Search for an unknown shipment.
-   [ ] Open shipment details.
-   [ ] Inspect timestamps and event source.
-   [ ] Open Live operations.
-   [ ] Open and close the layer menu.
-   [ ] Toggle supported layers.
-   [ ] Turn the grid off and verify all grid lines disappear.
-   [ ] Select an entity and inspect details.
-   [ ] Resize the map container.
-   [ ] Toggle fullscreen.
-   [ ] Navigate away and return to the map.
-   [ ] Run a supported planning scenario.
-   [ ] Trigger a scenario validation error.
-   [ ] Save settings and reload the page.
-   [ ] Verify changes persisted.
-   [ ] Test permissions using accounts with different roles.

# 44. Release evidence

-   [ ] Record commit SHA or release identifier.
-   [ ] Record commands run for lint, typecheck and build.
-   [ ] Record test results without paraphrasing failures away.
-   [ ] Record known bugs and workarounds.
-   [ ] Record features intentionally hidden.
-   [ ] Record data sources and freshness guarantees.
-   [ ] Record supported browsers and screen sizes.
-   [ ] Record accessibility issues remaining.
-   [ ] Record performance measurements and environment.
-   [ ] Record rollback plan for risky changes.
