# Claude Training Workshop — Trainer's Guide

> **Goal**: Team walks away with their CLAUDE.md, about-me.md, anti-ai.md, and project folder set up
> **Deck**: 84 slides in `claude-training-deck/` (10 parts) — see `index.html`
> **Format**: ~45 min lecture + ~45 min hands-on workshop
> **Audience**: Non-technical team, minimal AI experience

---

## Workshop Structure Overview

```
Lecture ───────────────────────► Workshop ──────────────────►
│                               │                            │
Part 1-3     Part 4   Part 5    Part 6-7    Part 8-10       │
Foundations  Folder  Context    Cowork      Trust/Close    All 4 files
└─ 30 min ──┘ └─5m─┘ └─8m─┘    └─ 25 min ─┘               set up
                              ║                          ║
                          Break 1:                    Break 2:
                        Create folder +           anti-ai.md +
                        about-me.md              CLAUDE.md
                        (20 min)                 (15 min)
```

---

## Part 1 — Opening & Foundations (8 slides, ~10 min)

*Deck slides: 01-01 through 01-08*

**Outcome**: Team understands what AI is (and isn't) and shifts from "ask questions" to "delegate outcomes"

| Slide | File | Key Point |
|-------|------|-----------|
| 01-01 | `01-01-title.html` | **Title**: The Way You Work Is About to Change |
| 01-02 | `01-02-old-vs-new.html` | Old paradigm (search) vs new (delegation) — the core mindset shift |
| 01-03 | `01-03-evolution-eras.html` | How AI evolved: pattern matching → language → reasoning → agents |
| 01-04 | `01-04-why-it-matters.html` | Why this matters practically |
| 01-05 | `01-05-old-habit.html` | Old habit: single-shot, no context |
| 01-06 | `01-06-modern-habit.html` | New habit: context, iterate, verify |
| 01-07 | `01-07-exercise.html` | Exercise: reflect on current use |
| 01-08 | `01-08-transition.html` | Section transition |

**Trainer note**: Slide 01-02 (old vs new) is the most important in this section. The entire training hinges on "delegation, not questions." Spend extra time here.

---

## Part 2 — Claude & The Landscape (8 slides, ~10 min)

*Deck slides: 02-01 through 02-08*

**Outcome**: Team knows what Claude is, how it compares to ChatGPT, and the 3 modes

| Slide | File | Key Point |
|-------|------|-----------|
| 02-01 | `02-01-title.html` | Section title |
| 02-02 | `02-02-tokens.html` | **What is Claude** — tokens, context window, models (Haiku/Sonnet/Opus) |
| 02-03 | `02-03-context-window.html` | **Claude vs ChatGPT** — comparison, when to use each |
| 02-04 | `02-04-usage-vs-context.html` | 3 ways: Chat (ask), Cowork (work together), Code (advanced) |
| 02-05 | `02-05-beginner-trap.html` | What you can actually do with Claude |
| 02-06 | `02-06-practical-rule.html` | Running example: meeting → email (revisited through training) |
| 02-07 | `02-07-exercise.html` | Exercise: what would you use Claude for? |
| 02-08 | `02-08-transition.html` | Section transition |

**Trainer note**: Slide 02-06 introduces the "running example" (meeting → summary → email) that's referenced later. Make sure it lands — it helps connect abstract concepts to real work.

---

## Part 3 — Prompting (9 slides, ~10 min)

*Deck slides: 03-01 through 03-08*

**Outcome**: Team can write a structured prompt (Role, Context, Task, Constraints, Format, Verify)

| Slide | File | Key Point |
|-------|------|-----------|
| 03-01 | `03-01-title.html` | Section title |
| 03-02 | `03-02-core-explanation.html` | **Core principle**: prompting is delegation, not magic |
| 03-03 | `03-03-model-table.html` | **6-part prompt framework**: Role, Context, Task, Constraints, Format, Verify |
| 03-04 | `03-04-simple-rule.html` | **Rule 1**: Give context — before/after examples |
| 03-05 | `03-05-extended-thinking.html` | **Rule 2**: Give examples — one example > 100 words of instruction |
| 03-06 | `03-06-bad-vs-good.html` | **Bad prompt → good prompt** side by side |
| 03-06b | `03-06-examples-table.html` | Writing with the recurring example |
| 03-07 | `03-07-warning.html` | Warning: verify outputs |
| 03-08 | `03-08-exercise.html` | Exercise: rewrite a weak prompt |

**Trainer note**: Slide 03-03 (the 6-part framework) is the reference slide. During the workshop, people will refer back to it. Consider keeping it visible during the hands-on session.

---

## Part 4 — Your Project Folder (6 slides, ~5 min)

*Deck slides: 04-01 through 04-06*

**→ FIRST OUTCOME: Project folder setup**

**Outcome**: Team understands WHY to work in a folder (context persistence, file access)

| Slide | File | Key Point |
|-------|------|-----------|
| 04-01 | `04-01-title.html` | Section title |
| 04-02 | `04-02-key-reasons.html` | Why work in a folder? Chat = stranger on street, Folder = briefed teammate |
| 04-03 | `04-03-careful-messaging.html` | **Setting up**: create folder, Claude works inside it |
| 04-04 | `04-04-use-case-map.html` | Exercise: create your folder |
| 04-05 | `04-05-exercise.html` | Exercise continued |
| 04-06 | `04-06-transition.html` | Transition |

**→ WORKSHOP BREAK 1: Create your project folder (10 min)**

> Trainer: Pause here. Everyone creates their `claude-projects` folder on their Desktop.
> Open Cowork. Point it at the folder. Confirm Claude can see it.

---

## Part 5 — Context Files (8 slides, ~8 min)

*Deck slides: 05-01 through 05-08*

**→ SECOND OUTCOME: about-me.md setup (introduced here)**

**Outcome**: Team knows the 4 essential context files and what they do

| Slide | File | Key Point |
|-------|------|-----------|
| 05-01 | `05-01-title.html` | Section title |
| 05-02 | `05-02-core-explanation.html` | **Why context files matter** — without vs with, the difference |
| 05-03 | `05-03-mode-table.html` | **4 essential files**: about-me, my-company, writing-rules, decision-rules |
| 05-04 | `05-04-when-chat.html` | **Template: about-me.md** — your role, style, preferences |
| 05-05 | `05-05-when-cowork.html` | **Template: my-company.md** — what your company does |
| 05-06 | `05-06-when-skills.html` | **Template: writing-rules.md** — tone, words to avoid |
| 05-07 | `05-07-exercise.html` | Exercise: write your first context file |
| 05-08 | `05-08-transition.html` | Transition |

**→ WORKSHOP BREAK 2: Write about-me.md (15 min)**

> Trainer: Everyone opens Cowork and runs this prompt (show on screen):
> ```
> I want to create an about-me.md file.
> Interview me one question at a time (use AskUserQuestion).
> Ask about: my role, how I work, communication style, what good looks like, what I hate.
> After ~6-8 questions, compile everything into a concise about-me.md and save it.
> ```
>
> People answer Claude's questions one by one. At the end, they have their about-me.md.

---

## Part 6 — Cowork Mode (10 slides, ~10 min)

*Deck slides: 06-01 through 06-10*

**Outcome**: Team knows what Cowork changes and can do first tasks

| Slide | File | Key Point |
|-------|------|-----------|
| 06-01 | `06-01-title.html` | Section title |
| 06-02 | `06-02-core-principle.html` | **What changes**: Chat (talk only) vs Cowork (reads/writes files) |
| 06-03 | `06-03-prompt-structure.html` | **How it works**: Read, Write, Think, Search |
| 06-04 | `06-04-rule-context.html` | **Read before write** — the golden rule |
| 06-05 | `06-05-rule-examples.html` | What Claude can and cannot do in Cowork |
| 06-06 | `06-06-rule-specify.html` | First safe tasks to try |
| 06-07 | `06-07-rule-format.html` | When to use Chat vs Cowork |
| 06-08 | `06-08-rule-verify.html` | Running example in Cowork |
| 06-09 | `06-09-comparison.html` | Bad vs good prompt |
| 06-10 | `06-10-exercise.html` | Exercise: try Cowork |

---

## Part 7 — Building The Habit (8 slides, ~5 min)

*Deck slides: 07-01 through 07-08*

**Outcome**: Team knows the iteration loop and basic troubleshooting

| Slide | File | Key Point |
|-------|------|-----------|
| 07-01 | `07-01-title.html` | Section title |
| 07-02 | `07-02-folder-structure.html` | **The iteration loop**: Ask → Review → Refine → Repeat |
| 07-03 | `07-03-folder-purpose.html` | When Claude gets it wrong (and why) |
| 07-04 | `07-04-sandbox.html` | Troubleshooting: prompt issues |
| 07-05 | `07-05-global-instructions.html` | Troubleshooting: context issues |
| 07-06 | `07-06-first-task.html` | Troubleshooting: mode and model issues |
| 07-07 | `07-07-exercise.html` | When to start fresh |
| 07-08 | `07-08-transition.html` | Exercise |

---

## Part 8 — Trust & Judgment + File Templates (10 slides, ~10 min)

*Deck slides: 08-01 through 08-10*

**→ THIRD OUTCOME: anti-ai.md**  
**→ FOURTH OUTCOME: CLAUDE.md**

**Outcome**: Team knows how to verify outputs, what not to share, and has templates for their context files

| Slide | File | Key Point |
|-------|------|-----------|
| 08-01 | `08-01-title.html` | Section title |
| 08-02 | `08-02-principle.html` | **Trust, but always verify** — golden rule of AI use |
| 08-03 | `08-03-files-overview.html` | What to verify: facts, tone, assumptions, completeness |
| 08-04 | `08-04-about-me.html` | **about-me.md template** (reference) |
| 08-05 | `08-05-my-company.html` | my-company.md template |
| 08-06 | `08-06-writing-style.html` | writing-rules.md template |
| 08-07 | `08-07-anti-ai.html` | **⭐ anti-ai.md** — words to avoid, AI-isms to kill |
| 08-08 | `08-08-decision-rules.html` | decision-rules.md template |
| 08-09 | `08-09-exercise.html` | Exercise |
| 08-10 | `08-10-transition.html` | Transition |

**→ WORKSHOP BREAK 3: Set up anti-ai.md + CLAUDE.md (15 min)**

> Trainer: Everyone runs two Cowork sessions:
>
> **anti-ai.md**: "Create an anti-ai-writing-style.md for me. Ask me what writing patterns and words I hate. After 5-6 questions, compile into a file."
>
> **CLAUDE.md**: "Create a CLAUDE.md file for this project. It should contain: what this project is for, key conventions, and instructions for Claude. Ask me questions to fill this in."
>
> By the end, everyone has their context folder with about-me.md, anti-ai-writing-style.md, and CLAUDE.md.

---

## Part 9 — Templates & Skills (10 slides, ~5 min)

*Deck slides: 09-01 through 09-10*

**Outcome**: Team knows what templates and skills are (bonus — not required for setup)

| Slide | File | Key Point |
|-------|------|-----------|
| 09-01 | `09-01-title.html` | Section title |
| 09-02 | `09-02-templates-overview.html` | What are templates |
| 09-03 | `09-03-meeting-recap.html` | Meeting recap template |
| 09-04 | `09-04-client-email.html` | Client email template |
| 09-05 | `09-05-project-summary.html` | Project summary template |
| 09-06 | `09-06-skills-overview.html` | What are skills |
| 09-07 | `09-07-good-skill.html` | What makes a good skill |
| 09-08 | `09-08-skill-draft.html` | Skill draft |
| 09-09 | `09-09-exercise.html` | Exercise |
| 09-10 | `09-10-transition.html` | Transition |

**Trainer note**: This section is reference material. If time is short, skim or skip slides 09-03 through 09-08. The key concept is "templates save time on recurring tasks."

---

## Part 10 — Safety & Closing (8 slides, ~5 min)

*Deck slides: 10-01 through 10-08*

**Outcome**: Team knows safety rules and next steps

| Slide | File | Key Point |
|-------|------|-----------|
| 10-01 | `10-01-title.html` | Section title |
| 10-02 | `10-02-trust-verify.html` | **Trust then verify** (reinforced) |
| 10-03 | `10-03-verification-table.html` | Verification examples |
| 10-04 | `10-04-safety-rules.html` | **Safety rules**: what NOT to share with AI |
| 10-05 | `10-05-add-to-rules.html` | Add to your decision-rules.md |
| 10-06 | `10-06-final-test.html` | Final test |
| 10-07 | `10-07-expected-output.html` | Expected output |
| 10-08 | `10-08-closing.html` | Closing — next steps, resources |

**→ FINAL: Test your setup (10 min)**

> Trainer: "Now let's test everything you've set up. Open Cowork on your project folder and run:"
> ```
> Read my about-me.md and anti-ai-writing-style.md.
> Then draft a weekly status update for my team.
> Save it as test-output.md in my project folder.
> ```
>
> If this works, their setup is complete. They have:
> ✓ Project folder with context files
> ✓ about-me.md
> ✓ anti-ai-writing-style.md
> ✓ CLAUDE.md
> ✓ First successful Cowork task

---

## Appendix: Quick Reference

### Timing Cheat Sheet

| Segment | Slides | Lecture | Workshop | Total |
|---------|--------|---------|----------|-------|
| Part 1: Foundations | 8 | 10 min | — | 10 min |
| Part 2: Claude | 8 | 10 min | — | 10 min |
| Part 3: Prompting | 9 | 10 min | — | 10 min |
| Part 4: Folder | 6 | 5 min | 10 min | 15 min |
| Part 5: Context Files | 8 | 8 min | 15 min | 23 min |
| Part 6: Cowork | 10 | 10 min | — | 10 min |
| Part 7: Building Habit | 8 | 5 min | — | 5 min |
| Part 8: Trust + Templates | 10 | 10 min | 15 min | 25 min |
| Part 9: Templates/Skills | 10 | 5 min | — | 5 min |
| Part 10: Closing | 8 | 5 min | 10 min | 15 min |
| **Total** | **85** | **~78 min** | **~50 min** | **~128 min** |

### The 4 Outcomes & Where They Happen

| Outcome | When | Slides | Method |
|---------|------|--------|--------|
| Project folder | After Part 4 | 04-01→04-06 | Create folder, open in Cowork |
| about-me.md | After Part 5 | 05-04 + workshop | Claude interviews you, saves file |
| anti-ai.md | After Part 8 | 08-07 + workshop | Claude interviews you, saves file |
| CLAUDE.md | After Part 8 | 08-08 + workshop | Claude creates from your answers |

### Key Slides to Reference During Workshop

- **03-03**: 6-part prompt framework (keep visible)
- **05-03**: 4 essential context files overview
- **08-07**: anti-ai.md template (words to avoid)
- **08-04**: about-me.md template

### Ruben's Method (adapted from substack articles)

The workshop approach is adapted from Ruben Hassid's Claude setup guide:

1. **Create folder structure**: `_context/`, `_outputs/`, `_templates/` (from Cowork 2.0)
2. **Write about-me.md via interview**: Claude asks questions, compiles file (from Cowork + Project)
3. **Write anti-ai-writing-style.md**: Banned words list, paragraph rules (from Cowork 2.0)
4. **Set up CLAUDE.md**: Project-level instructions Claude reads on every task (from Cowork Project)
5. **Set global instructions**: Settings → Cowork → Edit Global Instructions — tells Claude to read `_context/` before every task
6. **Test with a real task**: Cowork reads files, produces output in your folder
