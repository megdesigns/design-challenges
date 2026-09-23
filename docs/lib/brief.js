// Shared by the Node server and the browser (static / GitHub Pages mode).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DCGBrief = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Builds the short "design brief" a user gets after liking a challenge,
  // composed from the task, the product domain, and the constraint.

  // ---------------------------------------------------------------------------
  // Task-specific questions, keyed by the task text exactly as it appears in the
  // prompt file. `think` = things to wrestle with, `trap` = a common failure.
  // ---------------------------------------------------------------------------
  const TASKS = {
    // Mobile screens
    "Design an onboarding flow that gets a new user to value in under three screens": {
      think: ["What is the 'aha' moment, and can the user reach it before creating an account?", "Which setup questions can you defer until they actually matter?", "How does a returning user who skipped onboarding catch up later?"],
      trap: "Three carousel slides of marketing copy before the product does anything.",
    },
    "Design a home screen that prioritizes one primary action without hiding secondary tasks": {
      think: ["What does usage data (real or imagined) say people do most often here?", "How do secondary tasks stay discoverable without competing visually?", "How does the home screen change for a brand-new user versus a daily one?"],
      trap: "A grid of equally weighted tiles that makes the user choose every time.",
    },
    "Design a search experience with recent searches, suggestions, filters, and an empty state": {
      think: ["What does the screen show before the user types a single character?", "How do filters stay visible without eating half the results area?", "What does a zero-results state offer besides an apology — spelling fixes, broader filters, related items?"],
      trap: "An empty state that just says \"No results\" and leaves the user stuck.",
    },
    "Design a detail screen that makes a complex decision feel simple": {
      think: ["What are the two or three facts that actually drive this decision?", "What can be progressively disclosed for the people who want more?", "How do you show risk or cost honestly without scaring people off?"],
      trap: "Dumping every attribute in one long list with no hierarchy.",
    },
    "Design a checkout flow with clear progress, editable details, and error recovery": {
      think: ["Can the user edit an earlier step without losing everything they entered?", "What happens when payment fails — what's preserved, what's explained, what's the next action?", "Where does the total price appear, and does it ever surprise the user?"],
      trap: "Surprise fees on the final step.",
    },
    "Design a profile screen that balances identity, settings, and activity": {
      think: ["Is this screen mainly for the user, or for others viewing them?", "Which settings are changed often enough to live here versus a deeper settings page?", "How does it look for a brand-new account with no activity?"],
      trap: "Turning the profile into a junk drawer of every setting.",
    },
    "Design a notification center that helps users distinguish urgent from informational updates": {
      think: ["What makes something urgent in this product — money, time, safety, other people waiting?", "Can users act on a notification inline, or must they leave the screen?", "How do read, unread, and dismissed states differ, and can a user undo a dismiss?"],
      trap: "Everything styled the same, so urgent items drown in noise.",
    },
    "Design a saved-items experience with folders, sorting, and bulk actions": {
      think: ["How does a user enter and exit selection mode on touch?", "What happens to a saved item that becomes unavailable or out of date?", "Do folders earn their complexity, or would tags or smart groups work better?"],
      trap: "Bulk actions with no confirmation or undo for destructive operations.",
    },
    "Design a mobile form for a task users may need to complete one-handed": {
      think: ["Which fields can be removed, prefilled, or inferred?", "Are inputs using the right keyboard types (numeric, email, date)?", "Where does the submit button sit relative to the keyboard and thumb?"],
      trap: "Validation that only fires on submit, scrolling the user back up to find errors.",
    },
    "Design a comparison screen for choosing between three options": {
      think: ["Which differences actually matter — and which specs are identical noise?", "How do you compare on a narrow screen without horizontal scrolling tables?", "Should you recommend one option, and how do you do it without feeling pushy?"],
      trap: "A spec table that makes users do the comparison work themselves.",
    },
    "Design a permissions request that explains value before asking for system access": {
      think: ["What does the user get in return for granting access, in concrete terms?", "When in the journey is the request most obviously relevant?", "What does the product do gracefully if the user says no?"],
      trap: "Asking for everything on first launch before any trust exists.",
    },
    "Design an offline state that still gives the user something useful to do": {
      think: ["What content or actions can work from cache?", "How do you queue actions taken offline and show their sync status?", "How does the UI recover when the connection returns — silently or with confirmation?"],
      trap: "A full-screen dinosaur that blocks everything.",
    },
    "Design a first-use empty state that teaches the product through action": {
      think: ["What's the smallest first action that produces a satisfying result?", "Can you show sample data that the user can safely poke at or delete?", "How does the empty state disappear — gradually or all at once?"],
      trap: "An illustration and a paragraph instead of a clear first step.",
    },
    "Design a mobile calendar view for quickly finding and changing a booking": {
      think: ["Is month, week, or agenda view the best default for how often people book?", "How is 'changing a booking' different from creating one — what's locked, what's flexible?", "What do conflicts, cancellations, and time-zone edge cases look like?"],
      trap: "A desktop calendar grid shrunk until the text is unreadable.",
    },
    "Design a progress screen that motivates without turning into a generic streak UI": {
      think: ["What does meaningful progress look like in this domain, beyond days in a row?", "How does the screen treat someone who fell off for a week — shame or welcome back?", "What comparisons motivate (past self) and which demotivate (others)?"],
      trap: "Fire emoji streak counters that punish a single missed day.",
    },

    // Websites & landing pages
    "Design a homepage that explains an unfamiliar service in the first viewport": {
      think: ["What familiar thing can you compare it to so people get it instantly?", "Would showing the service in action (image, short demo) beat explaining it?", "What is the one next step for someone who is curious but not ready?"],
      trap: "Abstract hero copy that relies on the visitor already knowing the category.",
    },
    "Design a conversion-focused landing page for a new product with one clear CTA": {
      think: ["What is the exact CTA label, and does it describe what happens next?", "Which links or navigation can be removed to protect focus?", "What is the proof or risk reversal next to the CTA?"],
      trap: "Five competing CTAs styled as primary buttons.",
    },
    "Design a pricing page for three plans with meaningful differentiation": {
      think: ["What is the real reason someone upgrades — seats, limits, features, support?", "Which plan do you want most people to pick, and how is that signaled?", "How do you handle the FAQ questions that block purchase, like billing and cancellation?"],
      trap: "Feature lists with 30 checkmarks where the differences are buried.",
    },
    "Design a product marketing page that demonstrates the workflow instead of listing features": {
      think: ["What is the before-and-after of a user's day with this product?", "Can the page follow one realistic task from start to finish?", "Where do static screenshots fail and short loops or annotated steps work better?"],
      trap: "A feature grid of icons plus two-word labels.",
    },
    "Design a portfolio site that makes the creator's strongest work obvious within 10 seconds": {
      think: ["What is the single best project, and does it lead?", "What does a hiring manager need to see — outcome, role, process — at a glance?", "Does the site's own design prove the creator's skill?"],
      trap: "An about-me intro that pushes the work below the fold.",
    },
    "Design an editorial homepage that supports both browsing and deep reading": {
      think: ["How do you signal what's new versus what's important?", "What does the reading experience look like after the click — typography, measure, pace?", "How does the page avoid feeling like an ad-cluttered news site?"],
      trap: "Uniform card grids that flatten every story to the same importance.",
    },
    "Design a service-business website that turns trust signals into booking intent": {
      think: ["What does someone need to trust before booking — credentials, prices, reviews, faces?", "How early does availability or pricing appear?", "How few steps is the booking itself?"],
      trap: "Testimonials hidden on a separate page nobody visits.",
    },
    "Design a launch page for a product that has no testimonials yet": {
      think: ["What can replace social proof — founder credibility, a demo, a transparent roadmap?", "How specific can you be about the problem to show you understand the audience?", "What does signing up actually commit the visitor to?"],
      trap: "Fake logos or vague \"trusted by thousands\" claims.",
    },
    "Design a waitlist page that makes joining feel worthwhile without overpromising": {
      think: ["What does someone get for joining early — access, pricing, input?", "How honest are you about timing?", "What happens right after they submit — just a thank-you, or a reason to share?"],
      trap: "Hype language with no concrete detail about what the product does.",
    },
    "Design a comparison page that positions a product against an old way of working": {
      think: ["What does the old way cost in time, money, or frustration, specifically?", "Can you show the difference visually rather than in a table?", "How do you stay credible and avoid strawmanning the alternative?"],
      trap: "A smug tone that insults the people who still use the old way.",
    },
    "Design a careers page that communicates culture through evidence rather than slogans": {
      think: ["What concrete artifacts show culture — real rituals, policies, team photos, benefits?", "What would a skeptical candidate want to verify?", "How easy is it to find open roles and understand the hiring process?"],
      trap: "Stock photos of people high-fiving and words like 'passionate' and 'innovative'.",
    },
    "Design a nonprofit campaign page that communicates impact and makes donating easy": {
      think: ["What does one donation concretely do?", "How many steps and fields are between intent and a completed donation?", "How do you show impact honestly without exploiting the people you help?"],
      trap: "A donation form buried below long mission copy.",
    },

    // Web sections
    "Design a hero section that communicates value without relying on a dashboard mockup": {
      think: ["What outcome can you show instead of the interface — a result, a person, a before/after?", "Is the headline about the customer or about the company?", "What does the secondary CTA offer the not-yet-ready visitor?"],
      trap: "Swapping the dashboard for an equally generic abstract 3D blob.",
    },
    "Design a feature section that explains one capability through a before-and-after story": {
      think: ["What is the painful 'before' in the user's own words?", "Is the 'after' shown, not just stated?", "How does the transition between before and after work on mobile?"],
      trap: "A 'before' so exaggerated it isn't believable.",
    },
    "Design a testimonial section that feels credible rather than decorative": {
      think: ["What makes a quote credible — full name, role, photo, specific result?", "Would one detailed story beat six one-liners?", "Can you link to proof, like a case study or public review?"],
      trap: "Anonymous five-star quotes that say \"Great product!\".",
    },
    "Design a comparison section that explains three approaches without a dense table": {
      think: ["What are the two or three dimensions that really separate the approaches?", "Can a visual metaphor (spectrum, quadrant, path) replace the table?", "Which approach should the reader choose, and is that clear?"],
      trap: "A table disguised as cards.",
    },
    "Design an FAQ section for questions that block conversion": {
      think: ["What are the real objections — price, trust, time, switching cost?", "Should the most important answers be visible without expanding?", "Does each answer end with a clear next step?"],
      trap: "FAQ answers that dodge the question with marketing copy.",
    },
    "Design a security and trust section that nontechnical users can understand": {
      think: ["What does a nontechnical user actually worry about — data selling, breaches, who can see their stuff?", "How do you translate certifications into plain-language promises?", "Where do technical readers go for depth?"],
      trap: "A row of compliance badges with no explanation.",
    },
    "Design an integration section for a product that connects to many tools": {
      think: ["Which integrations matter most to your target audience?", "How do you show the depth of an integration, not just its logo?", "How does someone search or browse when there are 200?"],
      trap: "A logo wall with no sense of what the integrations actually do.",
    },
    "Design a case-study section that shows measurable outcomes and process": {
      think: ["What is the headline metric, and is it credible and specific?", "How much process is interesting versus padding?", "Who is the customer, and why should the reader identify with them?"],
      trap: "Vanity metrics with no baseline or timeframe.",
    },
    "Design a footer that remains useful on a content-heavy website": {
      think: ["What do people scroll to the footer looking for?", "How is the footer grouped so 50 links still scan quickly?", "How does it collapse on mobile without becoming a long accordion maze?"],
      trap: "Dumping the entire sitemap in equal weight.",
    },

    // Web apps
    "Design a workspace where users create, organize, and revisit ongoing work": {
      think: ["How does the user find what they were doing yesterday in one click?", "What are the organizing primitives — folders, tags, projects — and why?", "How does the workspace feel at item #1 versus item #500?"],
      trap: "Organization features that make users file things before they can create.",
    },
    "Design a split-view experience for browsing items while inspecting details": {
      think: ["How does selection persist when filters change?", "Can the user move through items with the keyboard without losing context?", "What happens to the split on narrower screens?"],
      trap: "A detail pane that resets scroll position every time.",
    },
    "Design a collaborative editor with comments, presence, and version history": {
      think: ["How do you show who's here without distracting from the content?", "What does a comment thread look like when its anchor text is edited or deleted?", "How does a user compare and restore versions confidently?"],
      trap: "Presence cursors and avatars that clutter the actual writing space.",
    },
    "Design a command-center web app that supports both novice and power users": {
      think: ["What does a novice see that a power user can hide?", "How are shortcuts and a command palette discovered?", "Where does density adjust — per user, per view, automatically?"],
      trap: "Building two separate UIs instead of one that grows with the user.",
    },
    "Design a multi-step creation flow with autosave and a useful draft state": {
      think: ["How is autosave communicated without constant 'Saving...' noise?", "What does a draft look like in the list view — how complete is it, what's missing?", "Can the user jump between steps, and what validates when?"],
      trap: "Losing work when the user navigates back or the tab closes.",
    },
    "Design an AI-assisted workspace where generated output is editable and sources are visible": {
      think: ["How does the user distinguish AI-generated text from their own edits?", "How are sources attached to specific claims, not just listed at the end?", "What happens when the AI is wrong or uncertain — how is confidence shown?"],
      trap: "A chat box bolted onto a document with no connection between the two.",
    },
    "Design a web app for comparing, shortlisting, and deciding between options": {
      think: ["How does the shortlist persist and get shared with others?", "Which attributes line up for side-by-side comparison?", "What helps the final decision — notes, scores, pros and cons?"],
      trap: "Comparison limited to two items when real decisions involve five.",
    },
    "Design a file-management experience with search, filters, preview, and bulk actions": {
      think: ["Is preview fast enough to replace opening files?", "How do selection, bulk actions, and drag-and-drop coexist?", "What do permissions and sharing states look like at a glance?"],
      trap: "Destructive bulk actions without undo.",
    },
    "Design an inbox-style workflow where users triage incoming items": {
      think: ["What are the three to five triage outcomes (done, snooze, assign, escalate)?", "Can the user triage entirely from the keyboard?", "What does 'inbox zero' look like, and is it rewarding?"],
      trap: "Opening each item fully just to decide what to do with it.",
    },
    "Design a web app that turns a complicated setup process into manageable steps": {
      think: ["Which steps are required now and which can be deferred?", "How does the user know how long setup will take?", "What happens if they need information they don't have yet?"],
      trap: "A 12-step wizard with no way to save and return.",
    },

    // Dashboards & internal tools
    "Design an operations dashboard that makes exceptions more prominent than normal activity": {
      think: ["What defines an exception, and who set the threshold?", "How does the normal state fade into the background?", "What is the next action for each exception, and can it be taken from here?"],
      trap: "Every metric wrapped in a colored card, so nothing stands out.",
    },
    "Design an admin table with filtering, sorting, saved views, and bulk actions": {
      think: ["Which columns are truly needed by default, and how are others added?", "How are active filters shown and cleared?", "How do saved views get named, shared, and discovered?"],
      trap: "Filters hidden in a modal so users forget they're active.",
    },
    "Design a role-management screen for assigning granular permissions": {
      think: ["How does an admin understand what a role can actually *do*, in plain language?", "How do you prevent accidentally granting too much?", "How are changes audited and reversible?"],
      trap: "A matrix of 200 checkboxes with cryptic permission names.",
    },
    "Design an analytics dashboard that moves from overview to diagnosis": {
      think: ["What's the top-level question, and what's the drill-down path from there?", "How does context (date range, segment) carry through each level?", "How does a user share a specific diagnosed view with a teammate?"],
      trap: "Overview and detail pages that feel like different products.",
    },
    "Design an approval queue where reviewers need enough context to act quickly": {
      think: ["What is the minimum context needed to approve with confidence?", "How are risky items flagged and separated from routine ones?", "Can reviewers approve in batches, and how is that made safe?"],
      trap: "Making reviewers open three tabs to find the context.",
    },
    "Design a case-management workspace with status, owner, history, and next action": {
      think: ["Is the next action the most prominent thing on the screen?", "How does history stay useful rather than becoming an endless log?", "How are handoffs between owners made explicit?"],
      trap: "Status labels that don't tell anyone what to do next.",
    },
    "Design a dashboard that surfaces anomalies without overwhelming users with alerts": {
      think: ["How are anomalies ranked by impact rather than just flagged?", "Can users tune sensitivity or snooze known issues?", "What explanation accompanies each anomaly — why is it unusual?"],
      trap: "Alert fatigue — so many flags that users ignore all of them.",
    },
    "Design a scheduling dashboard for teams, resources, and conflicts": {
      think: ["How are conflicts shown and resolved without leaving the view?", "What time scale is right — day, week, sprint?", "How does it handle people across time zones or part-time schedules?"],
      trap: "A dense Gantt chart where conflicts are invisible until someone complains.",
    },
    "Design an audit-log experience that helps users investigate what changed and why": {
      think: ["What does a typical investigation start with — a person, an object, a time?", "How are before/after values shown for a change?", "How do you group noisy automated events?"],
      trap: "A raw event stream with no filtering or grouping.",
    },
    "Design an internal tool for creating and managing reusable templates": {
      think: ["How does someone find the right template instead of making a duplicate?", "What happens to existing items when a template changes?", "How are variables or placeholders defined and previewed?"],
      trap: "Template sprawl with no ownership or deprecation.",
    },
    "Design an inventory tool that highlights shortages, delays, and recommended actions": {
      think: ["How confident is each recommendation, and can users see why?", "How do shortages get ranked — by impact, by time to stockout?", "What action can a user take directly from the alert?"],
      trap: "Recommendations with no explanation that users don't trust.",
    },
    "Design a dashboard for monitoring performance across multiple locations": {
      think: ["How do you compare locations fairly when they differ in size?", "What's the path from 'this location is underperforming' to 'here's why'?", "How does it scale from 5 locations to 500?"],
      trap: "A map that looks impressive but hides the actual numbers.",
    },

    // Components
    "Design a reusable dropdown that handles search, groups, long labels, and disabled options": {
      think: ["At what number of options does search appear?", "How are long labels truncated, and can the full text be read?", "Why is an option disabled, and can the user find out?"],
      trap: "Disabled options with no explanation.",
    },
    "Design a date picker that works for both single dates and ranges": {
      think: ["Can users type a date as well as pick one?", "How is a range shown while the second date is still being chosen?", "How are unavailable dates and min/max limits communicated?"],
      trap: "A calendar that doesn't work with the keyboard.",
    },
    "Design a data-table component with responsive behavior and row actions": {
      think: ["What happens to columns on a narrow screen — hide, stack, scroll?", "Are row actions always visible, on hover, or in a menu, and what about touch?", "How do sticky headers and first columns behave?"],
      trap: "Hover-only row actions that are unreachable on touch devices.",
    },
    "Design a toast system for success, warning, error, and undoable actions": {
      think: ["How long does each type stay, and do errors auto-dismiss?", "How does undo work, and what happens when the toast disappears?", "How do multiple toasts stack?"],
      trap: "Error messages that vanish before they can be read.",
    },
    "Design a stepper component for a process that allows users to revisit completed steps": {
      think: ["What does a completed, current, upcoming, and errored step look like?", "What happens to later steps if an earlier one is edited?", "How does it collapse on mobile?"],
      trap: "Steps that look clickable but aren't.",
    },
    "Design a file-upload component with progress, validation, retry, and failure states": {
      think: ["When does validation happen — before upload or after?", "How is progress shown for multiple files?", "What does retry preserve, and can users cancel mid-upload?"],
      trap: "A generic 'Upload failed' with no reason or retry.",
    },
    "Design a card component that supports several content densities without becoming inconsistent": {
      think: ["What slots does the card have, and which are optional?", "What stays fixed across densities (padding, radius, type scale) and what flexes?", "How do cards align in a grid when content lengths differ?"],
      trap: "A dozen one-off card variants that share nothing.",
    },
    "Design a search field with autocomplete, recent items, loading, and no-results states": {
      think: ["How is typed text highlighted within suggestions?", "Can users navigate suggestions with arrow keys?", "Can recent items be removed?"],
      trap: "Suggestions that jump around while the user is still typing.",
    },
    "Design an input component with helper text, validation, character count, and accessibility states": {
      think: ["Where do helper text and error text live, and do they replace each other?", "When does the character count appear, and how does it warn near the limit?", "Are labels and errors correctly associated for screen readers?"],
      trap: "Placeholder text used as the only label.",
    },
    "Design a notification component with priority, actions, timestamps, and read states": {
      think: ["How is priority shown beyond color?", "Are timestamps relative or absolute, and when do they switch?", "What does a notification with two actions look like?"],
      trap: "Unread state shown only with a tiny colored dot.",
    },
    "Design a bottom sheet with collapsed, expanded, loading, and error states": {
      think: ["What's visible in the collapsed state, and is it useful on its own?", "How does the user dismiss it — drag, tap outside, button?", "What happens to content behind it at each height?"],
      trap: "A sheet that can only be dismissed with a gesture.",
    },

    // Motion & interactions
    "Design microinteractions for saving, unsaving, and confirming an item": {
      think: ["How does unsaving feel different from saving, and is it reversible?", "Where does the saved item 'go', and can motion show it?", "How subtle can the feedback be while still being noticed?"],
      trap: "Identical feedback for save and unsave.",
    },
    "Create a loading interaction that communicates progress without a fake percentage": {
      think: ["What real stages can you show (connecting, processing, finishing)?", "How does the design change if loading takes 1 second versus 30?", "Can the user do something else while waiting?"],
      trap: "A progress bar that jumps to 99% and sits there.",
    },
    "Design a drag-and-drop interaction with clear pickup, target, success, and error feedback": {
      think: ["How does the user know something is draggable before trying?", "How are valid and invalid drop targets shown mid-drag?", "What's the keyboard and screen-reader alternative?"],
      trap: "Drop zones that only appear once you're already dragging.",
    },
    "Design the transition between a list item and its detail view": {
      think: ["Which element carries over between states to maintain continuity?", "How does the back transition mirror the forward one?", "What happens if the detail content is still loading?"],
      trap: "A shared-element animation that stutters because the content isn't ready.",
    },
    "Create a button interaction covering hover, press, loading, success, and disabled states": {
      think: ["Does the button keep its width when the label changes to a spinner?", "How long does the success state stay before resetting?", "Can a user double-submit during loading?"],
      trap: "A button that changes width and shifts the layout.",
    },
    "Design a gesture-driven mobile interaction with an obvious non-gesture alternative": {
      think: ["How is the gesture discovered by first-time users?", "Where is the visible button that does the same thing?", "What feedback happens during the gesture, before it commits?"],
      trap: "Swipe-to-delete with no confirmation or undo.",
    },
    "Animate a chart update so users can understand what changed": {
      think: ["Should values animate from old to new, or should changes be highlighted?", "How do you animate added or removed data points?", "How long should it take so the eye can follow but not wait?"],
      trap: "Everything redraws at once so no change is trackable.",
    },
    "Create a motion sequence that introduces a new feature without blocking the user's task": {
      think: ["Where does the introduction appear, and when does it get out of the way?", "Can the user dismiss it, and can they find it again later?", "Is the motion tied to the feature's location in the UI?"],
      trap: "A modal tour that interrupts the task the user came to do.",
    },
    "Design an interaction for reordering items that works with pointer and keyboard input": {
      think: ["What key commands pick up, move, and drop an item?", "How is the new position announced to screen readers?", "How do other items make room as one moves?"],
      trap: "Keyboard reordering that's technically possible but undiscoverable.",
    },
    "Animate a bottom sheet so hierarchy and spatial relationships remain clear": {
      think: ["Where does the sheet come from, and does it return there?", "How does the background dim or scale to show depth?", "What springs or easing make the drag feel physical?"],
      trap: "Motion that obscures which layer is in front.",
    },
    "Design an optimistic interaction for a task that may fail after the UI updates": {
      think: ["How does the UI roll back if the request fails, and is that change noticeable?", "What's preserved so the user can retry without re-entering anything?", "Which actions are safe to be optimistic about, and which are not?"],
      trap: "A silent rollback the user never notices.",
    },
    "Create a motion concept for switching between compact and expanded views": {
      think: ["Which elements persist, which appear, and which disappear?", "Does the user keep their scroll position and focus?", "How does the transition feel when triggered repeatedly?"],
      trap: "Content jumping around so the user loses their place.",
    },

    // Data visualization
    "Design a chart that helps users compare performance across categories and time": {
      think: ["Is the primary comparison across categories or across time?", "Would small multiples be clearer than one busy chart?", "How are the categories ordered — alphabetically, by value, by change?"],
      trap: "A spaghetti line chart with ten overlapping series.",
    },
    "Design a visualization for part-to-whole data where a pie chart would be misleading": {
      think: ["Would a stacked bar, waffle, or treemap make the proportions easier to compare?", "How are small slices kept visible and labeled?", "Does the whole add up to 100%, and is that stated?"],
      trap: "Swapping the pie for a donut, which has the same problem.",
    },
    "Design a chart for spotting anomalies across a long time series": {
      think: ["How is 'normal' shown — a band, a baseline, a forecast?", "How do users zoom in without losing the overview?", "How are anomalies annotated with cause or context?"],
      trap: "Relying on the viewer to spot spikes in thousands of points.",
    },
    "Design a mobile-friendly visualization for comparing five options": {
      think: ["Does a horizontal bar layout fit better on a narrow screen than vertical?", "How are labels kept readable without rotation?", "How does tapping reveal detail without hover?"],
      trap: "A desktop chart scaled down until the labels are unreadable.",
    },
    "Design a visualization for showing progress toward a target with uncertainty": {
      think: ["How is the range of likely outcomes shown — bands, fans, ranges?", "Is the target clearly separated from the forecast?", "How will non-experts read uncertainty without panicking or ignoring it?"],
      trap: "A single projected line that implies false precision.",
    },
    "Design a small-multiples view for comparing the same metric across groups": {
      think: ["Do all panels share axes so comparisons are fair?", "How are the panels ordered to reveal patterns?", "How is one standout group highlighted?"],
      trap: "Independent y-axes that make every panel look equally dramatic.",
    },
    "Design an interactive chart with hover, filtering, zoom, and annotation states": {
      think: ["What's visible before any interaction — does the static chart still tell the story?", "How are filters and zoom levels reset?", "How does it work on touch?"],
      trap: "Hiding key information behind hover.",
    },
    "Create an accessible visualization that does not rely on color alone": {
      think: ["Which encodings back up color — pattern, shape, position, direct labels?", "How does the chart read in grayscale?", "What's the text alternative or data table?"],
      trap: "Red and green as the only distinction.",
    },
    "Turn a dense KPI table into a hierarchy of useful visualizations": {
      think: ["Which three KPIs matter most, and which are supporting?", "Which metrics are best as numbers, sparklines, or full charts?", "How does a user get back to the raw table when needed?"],
      trap: "Charting every column just because you can.",
    },

    // Design systems
    "Define a semantic color-token structure that supports light and dark themes": {
      think: ["What layers do you need — primitive, semantic, component?", "How are tokens named by purpose (surface, text-muted, danger) rather than hue?", "How do you guarantee contrast in both themes?"],
      trap: "Dark mode made by just inverting colors.",
    },
    "Create a typography system for dense product UI and marketing pages": {
      think: ["How many sizes do you really need, and how do they relate?", "How do product and marketing scales share a family without clashing?", "What are the rules for line length, line height, and numeric figures?"],
      trap: "A type scale with 14 sizes that nobody can choose between.",
    },
    "Design a spacing and sizing scale, then apply it to three components": {
      think: ["Is the scale linear, geometric, or hybrid, and why?", "How does spacing express relationships (inside vs. between groups)?", "What sizes do touch targets and icons snap to?"],
      trap: "A scale on paper that the components then ignore.",
    },
    "Build a button component family with variants, sizes, states, and accessibility guidance": {
      think: ["When should each variant be used, and when not?", "How do icon-only buttons stay accessible?", "What's the rule for how many primary buttons can appear together?"],
      trap: "Too many variants that differ only slightly.",
    },
    "Create form-field patterns covering labels, hints, errors, optional fields, and validation": {
      think: ["Do you mark required or optional fields, and why?", "When does validation run — on blur, on submit, while typing?", "How are errors summarized for long forms?"],
      trap: "Inconsistent error placement across different field types.",
    },
    "Design a responsive grid system for product and marketing contexts": {
      think: ["How many columns and breakpoints, and what triggers them?", "How do product layouts (sidebars, panels) sit on the same grid as marketing pages?", "What are the max-widths and gutters at each size?"],
      trap: "A grid that works on marketing pages but not in dense apps.",
    },
    "Create guidelines for elevation, overlays, and layered surfaces": {
      think: ["How many elevation levels, and what does each mean?", "How is elevation expressed in dark mode, where shadows disappear?", "What overlays can stack on top of each other?"],
      trap: "Random shadow values on every component.",
    },
    "Audit a fictional UI kit for inconsistencies and propose a migration plan": {
      think: ["How will you categorize and prioritize the inconsistencies?", "What's the migration order that causes the least disruption?", "How will you measure progress?"],
      trap: "An audit with no prioritization — just a long list of problems.",
    },
    "Design a component contribution process for a growing product team": {
      think: ["What's the bar for a component to enter the system?", "Who reviews it, and how long should that take?", "How are one-off solutions handled while a component is pending?"],
      trap: "A process so heavy that teams build around the system.",
    },

    // FigJam & UX artifacts
    "Create a journey map that reveals emotional highs, friction, and opportunity areas": {
      think: ["Whose journey is this, and what's their goal?", "How is the emotional line grounded in evidence?", "Which moments of friction are worth solving first?"],
      trap: "A journey where every step is equally painful.",
    },
    "Create a service blueprint connecting user actions to frontstage and backstage processes": {
      think: ["Where are the lines of visibility and interaction?", "Which backstage failures cause frontstage pain?", "Who owns each process?"],
      trap: "Leaving out the support processes where most failures happen.",
    },
    "Build an affinity map from 25 fictional interview observations and synthesize five themes": {
      think: ["Are the groupings based on patterns of need, not surface topics?", "Is each theme phrased as an insight rather than a label?", "How many observations support each theme?"],
      trap: "Themes that just restate the category names.",
    },
    "Create a task flow for a high-stakes workflow with alternate and failure paths": {
      think: ["What are the decision points and their possible outcomes?", "Where can the user recover, and where are mistakes irreversible?", "Which paths are most common and deserve the most attention?"],
      trap: "Only mapping the happy path.",
    },
    "Build a prioritization matrix balancing user value, business value, effort, and risk": {
      think: ["How is each dimension scored, and who scored it?", "How do you prevent effort from dominating every decision?", "What does the team do with the top-right quadrant?"],
      trap: "Scores that reflect opinions dressed up as data.",
    },
    "Create an information architecture map for a product with several user roles": {
      think: ["What does each role see, and where do they overlap?", "How are shared and role-specific areas labeled?", "What's the navigation model that serves all roles?"],
      trap: "One tree that ignores how roles see different things.",
    },
    "Create a workshop board for aligning a cross-functional team on a vague product problem": {
      think: ["What's the goal of the workshop, and what artifact comes out of it?", "How do you give quiet participants a voice?", "How is the agenda timeboxed?"],
      trap: "A board with activities but no decisions.",
    },
    "Build an assumption map that separates evidence from team beliefs": {
      think: ["How is each assumption rated by importance and evidence?", "Which risky assumptions get tested first?", "How are assumptions phrased so they can be tested?"],
      trap: "Assumptions phrased too vaguely to test.",
    },
    "Create a storyboard showing the user's context before, during, and after using a product": {
      think: ["What triggers the need for the product?", "What does the user feel at each frame?", "What changes in their life afterward?"],
      trap: "A storyboard centered on the UI instead of the person.",
    },

    // UX research
    "Write a research plan to understand why users abandon a key workflow": {
      think: ["What does quantitative data already say about where people drop off?", "Would you combine analytics with interviews or session recordings?", "Who do you recruit — people who abandoned, completed, or both?"],
      trap: "Only talking to people who completed the workflow.",
    },
    "Create a usability-test plan for a prototype with five critical tasks": {
      think: ["Are tasks phrased as goals rather than instructions?", "What counts as success, partial success, and failure for each?", "How many participants, and which ones?"],
      trap: "Tasks that name the UI element the user needs to click.",
    },
    "Design an interview guide that explores behavior without leading participants": {
      think: ["Do questions ask about specific past behavior rather than hypothetical futures?", "Where do you probe with 'tell me more' or 'why'?", "How does the guide open to build rapport?"],
      trap: "Questions like \"Would you use a feature that...?\".",
    },
    "Turn a vague stakeholder question into research questions and an appropriate method": {
      think: ["What decision is the stakeholder really trying to make?", "What would a useful answer look like?", "What's the lightest method that answers it?"],
      trap: "Picking the method before understanding the question.",
    },
    "Create a survey that measures a behavior without relying on satisfaction alone": {
      think: ["How do questions measure frequency, recency, and specific actions?", "How do you avoid bias from question order or wording?", "What will you do with each answer?"],
      trap: "A survey of 5-point satisfaction scales that says nothing actionable.",
    },
    "Plan a diary study for a behavior that unfolds across several days": {
      think: ["How often do participants log, and how is it prompted?", "How do you keep participation from dropping off?", "What happens in the debrief interview?"],
      trap: "Logging so demanding that participants quit by day three.",
    },
    "Synthesize fictional findings into insights, evidence, opportunities, and open questions": {
      think: ["Is each insight a non-obvious truth, not just an observation?", "How strong is the evidence behind each one?", "Which opportunities are most actionable?"],
      trap: "Insights that are just quotes with no interpretation.",
    },
    "Design a research repository structure that makes findings reusable": {
      think: ["How are findings tagged so they can be found later?", "What's the atomic unit — observation, insight, study?", "Who maintains it, and how does it stay current?"],
      trap: "A repository that becomes a graveyard of PDFs.",
    },
  };

  // ---------------------------------------------------------------------------
  // Domain context: realistic content to design with instead of placeholders.
  // ---------------------------------------------------------------------------
  const DOMAINS = {
    "public transit": { content: "Real route names, platform numbers, delay reasons, fare types, service alerts." },
    insurance: { content: "Policy numbers, deductibles, premiums, claim statuses, coverage limits." },
    manufacturing: { content: "Machine IDs, OEE percentages, batch numbers, shift schedules, defect codes." },
    accessibility: { content: "Screen-reader labels, captions, contrast ratios, assistive device settings." },
    "remote work": { content: "Time zones, status messages, meeting notes, handoff docs, availability windows." },
    education: { content: "Course names, assignment deadlines, grades, rubrics, attendance." },
    "event planning": { content: "Venue names, RSVP counts, vendor contracts, budgets, run-of-show timelines." },
    "pet care": { content: "Pet names, breeds, vaccination dates, medication doses, vet notes." },
    logistics: { content: "Tracking numbers, ETAs, route IDs, carrier names, exception codes." },
    "subscription management": { content: "Service names, billing dates, prices, trial end dates, cancellation steps." },
    "grocery shopping": { content: "Product names, weights, unit prices, substitutions, delivery slots." },
    "healthcare scheduling": { content: "Provider names, appointment types, insurance info, prep instructions, wait times." },
    "project management": { content: "Task names, assignees, due dates, statuses, dependencies." },
    freelancing: { content: "Client names, invoice amounts, rates, hours, payment terms." },
    "language learning": { content: "Phrases in two languages, pronunciation scores, lesson levels, vocabulary counts." },
    "personal finance": { content: "Account balances, transactions, categories, budgets, due dates." },
    "sports analytics": { content: "Player names, xG, possession %, match timelines, season stats." },
    "restaurant operations": { content: "Table numbers, covers, ticket times, 86'd items, staff shifts." },
    sustainability: { content: "CO₂e figures, energy usage, targets, certifications, reporting periods." },
    "real estate": { content: "Addresses, prices, square footage, listing dates, offer statuses." },
    HR: { content: "Employee names, roles, PTO balances, review cycles, onboarding tasks." },
    "home organization": { content: "Room names, item lists, chore schedules, storage locations." },
    weather: { content: "Temperatures, precipitation chances, wind speed, alerts, hourly forecasts." },
    "music discovery": { content: "Artist names, genres, track lengths, play counts, release dates." },
    gaming: { content: "Player handles, ranks, match stats, inventories, achievements." },
    banking: { content: "Account numbers (masked), balances, pending transactions, transfer limits." },
    reading: { content: "Book titles, authors, page counts, highlights, reading time." },
    "nonprofit fundraising": { content: "Campaign goals, amounts raised, donor names, impact metrics." },
    "legal workflows": { content: "Case numbers, filing deadlines, document versions, billable hours." },
    "fitness coaching": { content: "Workout plans, reps and sets, heart rate, progress photos, check-ins." },
    "car ownership": { content: "Make/model, mileage, service dates, recall notices, fuel costs." },
    "social communities": { content: "Usernames, posts, reactions, reports, member counts." },
    "job searching": { content: "Job titles, companies, salaries, application statuses, interview dates." },
    "hotel booking": { content: "Hotel names, room types, nightly rates, cancellation policies, check-in times." },
    cybersecurity: { content: "CVE IDs, severity scores, IP addresses, affected assets, incident timelines." },
    "customer support": { content: "Ticket IDs, SLAs, customer names, priorities, canned responses." },
    "photo management": { content: "Albums, dates, locations, faces, file sizes." },
    "meal planning": { content: "Recipes, ingredients, prep times, portions, dietary tags." },
    "creator tools": { content: "Project names, export formats, follower counts, revenue figures." },
    "AI productivity": { content: "Prompts, generated drafts, sources, confidence notes, edit history." },
    "travel planning": { content: "Destinations, flight numbers, itineraries, budgets, confirmation codes." },
    "e-commerce": { content: "Product names, prices, sizes, stock levels, shipping estimates." },
    "beauty services": { content: "Service names, durations, prices, stylist profiles, deposit policies." },
  };

  // ---------------------------------------------------------------------------
  // Constraint sentences (the last sentence of every prompt) → "done when" checks.
  // ---------------------------------------------------------------------------
  const CONSTRAINTS = {
    "Focus on hierarchy, spacing, typography, and one obvious primary action.": {
      checks: ["The squint test: blur your eyes. Is the primary action still the first thing you see?", "Every spacing value comes from a consistent scale.", "No more than three type sizes on the main surface.", "Exactly one primary button."],
    },
    "Include empty, loading, error, success, and edge-case states, plus responsive behavior.": {
      checks: ["Empty, loading, error, and success states are all designed, not just described.", "At least one edge case (very long text, huge numbers, zero items).", "Mobile and desktop layouts both shown.", "Error states say what happened and what to do next."],
    },
    "Support multiple roles, ambiguous data, accessibility, edge cases, and a scalable component strategy.": {
      checks: ["At least two roles, with how their views differ.", "A strategy for incomplete, conflicting, or stale data.", "Keyboard, focus, and contrast accounted for.", "Reusable components identified, with their variants."],
    },
    "Limit yourself to one core user goal and keep the information architecture simple.": {
      checks: ["You can state the one user goal in a single sentence.", "Nothing on the screen serves a different goal.", "Navigation has no more than one level.", "Someone new could complete the goal without instructions."],
    },
    "Account for accessibility, realistic content, and at least one non-happy path.": {
      checks: ["Text contrast meets WCAG AA (4.5:1 for body text).", "All placeholder copy replaced with realistic content.", "One failure or recovery path fully designed.", "Nothing relies on color alone."],
    },
    "Include tradeoffs, failure recovery, power-user behavior, and measurable success criteria.": {
      checks: ["At least two tradeoffs written down, with what you gave up.", "A failure scenario and how the design recovers.", "One power-user accelerator (shortcut, bulk action, saved view).", "Success metrics you could actually measure."],
    },
    "Use an 8-point spacing system and define all major UI states before polishing visuals.": {
      checks: ["Every spacing value is a multiple of 8 (with 4 for tight spots).", "A state inventory made before visual design.", "Components aligned to the grid.", "Visual polish applied only after structure is locked."],
    },
    "Create a small clickable prototype and document the reasoning behind two key decisions.": {
      checks: ["The prototype covers the main flow end to end.", "Two decisions documented with the options you considered.", "Transitions between screens make sense.", "Someone else could click through it without help."],
    },
    "Design the system, not just the screen: define rules, states, responsive behavior, and how it scales.": {
      checks: ["Rules written down that someone else could follow.", "States defined for key components.", "Behavior across at least three breakpoints.", "One example of how it scales (more data, new feature, new role)."],
    },
  };

  const LEVEL = {
    Beginner: { time: "1 hour", deliverable: "One polished frame" },
    Intermediate: { time: "2–3 hours", deliverable: "2–3 frames with short notes" },
    Advanced: { time: "Half a day", deliverable: "Key frames, states, and your reasoning" },
  };

  // Short, scannable brief: what to think about, what to avoid, when you're done.
  function buildBrief(challenge) {
    const task = TASKS[challenge.task] || { think: [], trap: null };
    const domain = DOMAINS[challenge.domain] || null;
    const constraint = CONSTRAINTS[challenge.constraint] || null;
    const level = LEVEL[challenge.difficulty] || LEVEL.Intermediate;

    return {
      id: challenge.id,
      time: level.time,
      deliverable: level.deliverable,
      think: task.think.slice(0, 3),
      avoid: task.trap,
      realContent: domain ? domain.content : null,
      checklist: constraint ? constraint.checks.slice(0, 3) : [],
    };
  }

  return { buildBrief, TASKS, DOMAINS, CONSTRAINTS };
});
