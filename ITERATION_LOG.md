# Math for AI — Innovation loop log (Iters 2–10)

Local: http://127.0.0.1:5190/  
Verification: `npx tsc --noEmit` ✅ · `npm run check` ✅  
No commits / pushes.

---

## Iteration 2 — Forward/Backward Pipeline Walk
- **Shipped:** Tiny-net flowchart theater (`src/pipeline.tsx`). Step through forward nodes (x→z→h→ŷ→L) then backprop (∂L/∂ŷ…∂L/∂w₁). Tap node → lesson hash. Uses `backprop` + story cast.
- **Try:** http://127.0.0.1:5190/#pipeline
- **Risks:** SVG hit targets on small screens; ReLU-shut path is visible but not dramatized beyond gate label.

## Iteration 3 — Loss Landscape Journey
- **Shipped:** 2D elliptic bowl hike (`src/landscape.tsx`) with contours, GD trail, gradient arrow. η from cast; links to `#partials` `#descent` `#curvature`. Syncs Studio bowl weight on each step.
- **Try:** http://127.0.0.1:5190/#landscape
- **Risks:** Landscape axes (u,v) are a pedagogical bowl, not the full tiny-net (w₁,w₂) surface — intentional MVP.

## Iteration 4 — Attention Spotlight Stage
- **Shipped:** Dark stage with q lamp and three keys (`src/spotlight.tsx`). Beam/brightness = softmax(q·k [/√d]). Toggle √d; links `#dot` `#norm` `#multiply` `#softmax`.
- **Try:** http://127.0.0.1:5190/#spotlight
- **Risks:** k₁/k₂ are permutations of cast k (same-run continuity without expanding cast schema).

## Iteration 5 — Matrix as Machine
- **Shipped:** Row-worker UI (`src/matrixMachine.tsx`) with forward / transpose / rank modes. Editable W from cast; det of top-left 2×2 for dependence. Links linear-layer/multiply/transpose/rank/jacobian.
- **Try:** http://127.0.0.1:5190/#machine
- **Risks:** Rank mode uses a 2×2 block hint, not full SVD of 2×3 W.

## Iteration 6 — Twin Models Before/After
- **Shipped:** Side-by-side twins (`src/twins.tsx`): untrained / dead ReLU / bad η / honest. Honest update button on cast w₁,w₂; bowl trail compare for η. Links `#chain` `#descent` `#curvature`.
- **Try:** http://127.0.0.1:5190/#twins
- **Risks:** “Honest” twin reads live cast — after updates left/right can converge if both set to honest.

## Iteration 7 — Cross-map transfers
- **Shipped:** `TRANSFERS` in `mapGraph.ts` + dashed labeled arcs on Idea subway (`map.tsx`). Toggle **Transfers** for cosine ↔ ÷√d ↔ scores→bets ↔ QKᵀ row. Hover shows the conceptual difference.
- **Try:** http://127.0.0.1:5190/ (map) → toggle Transfers; arcs into softmax / norm.
- **Risks:** Arc bend packing can crowd when Attention route is focused; tip line replaces station tip while hovering a transfer.

## Iteration 8 — Story replay
- **Shipped:** Time scrub (`src/replay.tsx`) lerps cast through keyframes; pipeline chapter chips light in order; Play/Pause. Writes shared cast (Studio/lessons see it).
- **Try:** http://127.0.0.1:5190/#replay
- **Risks:** Scrub overwrites local cast edits; Reset restores DEFAULT_CAST.

## Iteration 9 — Interview mode as route
- **Shipped:** Curated whiteboard asks (`src/interview.tsx`) → ordered station walks only (UX route, no new math). Open lab per stop.
- **Try:** http://127.0.0.1:5190/#interview
- **Risks:** Route list is curated, not auto-derived from every curriculum ask.

## Iteration 10 — Synthesis wall
- **Shipped:** One screen (`src/synthesis.tsx`) linking subway preview · pipeline cast read · mini landscape · spotlight bars on the same cast. Jump buttons to other surfaces.
- **Try:** http://127.0.0.1:5190/#synthesis
- **Risks:** Previews are compact; full surfaces remain the source of interaction depth.

---

## App wiring
- Hash routes for surfaces: `pipeline` `landscape` `spotlight` `machine` `twins` `replay` `interview` `synthesis` (`src/surfaces.ts`, `App.tsx`).
- Home: **Innovation surfaces** strip under Studio.
- Design tokens preserved; `math.ts` remains sole numeric engine; `aimath:*` marks untouched.

## Tour order
1. `/` — map + Transfers + Studio  
2. `#pipeline` → `#landscape` → `#spotlight` → `#machine` → `#twins`  
3. `/` Transfers again → `#replay` → `#interview` → `#synthesis`

---

## Agent1 Review Cycle 1/10

### Critical review
**What helps learning**
- Shared story cast + Studio is the real glue: one run of numbers crossing lessons and surfaces.
- Pipeline walk and Matrix Machine turn formulas into spatial procedures (forward path, row-workers).
- Spotlight + subway Transfers make attention’s “score → bet” story memorable.
- Twins and the chain lesson’s dead-unit Goal make failure modes concrete, not just captions.

**What is still shallow / textbook-like / broken**
- Landscape is a *different* elliptic bowl from the tiny-net / Studio losses — three “training terrains,” so hiking does not teach the actual L(w₁,w₂) the pipeline blames.
- Spotlight never delivers the **score matrix** the map transfer “QKᵀ row” advertises; attention stays one lamp + three glows.
- Synthesis is a chip dashboard of previews, not a linked stage; Interview is a curated TOC playlist.
- Replay lerps unrelated cast fields into a faux arc; map stations stay static lesson pins with no live shapes/numbers.
- Rank mode / pedagogical shortcuts still read as demos beside the curriculum rather than one compute passport.

Focus for next build: **new stages that make shapes and score grids the math**, not caption/η polish.

### Agent 2 brief — Score Matrix Arena
- **Goal:** Ship a new innovation surface where attention is a **QKᵀ heat stage**: rows = queries derived from the shared cast (cast `x` plus two deterministic permutations), cols = keys (cast `k` + permutations as today). Cell heat = `q·k` (toggle `/√d`). Tap a cell → expand that single dot product and light the matching column’s softmax weights. This is the missing stage the multiply↔softmax transfer claims.
- **Files allowed:** `src/scoreMatrix.tsx` (new), `src/surfaces.ts`, `src/App.tsx`, `src/mapGraph.ts` and/or `src/map.tsx` (optional transfer/label cue only), `src/plots.tsx` (heat helper reuse only). Do **not** edit lessons, story copy, or Studio narrative.
- **Acceptance checks:**
  1. Hash `#scores` opens the arena; listed in Innovation surfaces strip.
  2. Changing cast `x` / `k` (via existing cast store) visibly recolors the grid; √d toggle changes gaps before softmax.
  3. Selecting one cell shows the numeric q·k[/√d] and that row’s softmax vector; links open `#dot` `#norm` `#multiply` `#transpose` `#softmax`.
  4. `npx tsc --noEmit` and `npm run check` pass; `math.ts` remains sole numeric engine.
- **Try:** http://127.0.0.1:5190/#scores

### Agent 3 brief — Failure Beat Story Circuit
- **Goal:** Add named **failure beats** in the shared narrative (dead ReLU gate-shut, bad η overshoot, honest recovery) that *set the cast* and cue which surface/lesson to open — so Studio, replay, chain, and interview walk one failure story instead of disconnected demos.
- **Files allowed:** `src/story.ts`, `src/storyChapters.ts`, `src/studio.tsx`, `src/replay.tsx`, `src/interview.tsx`, `src/lessons/calculus.tsx` (chain / descent wiring only). Do **not** invent new visual surfaces or edit map/plots/App routes beyond what story strip already uses.
- **Acceptance checks:**
  1. Learner can trigger beats (Studio controls and/or replay keyframes) that write cast into dead-ReLU (`w₁x < 0` → gate 0, `∂L/∂w₁ = 0`) and bad-η, then honest recovery.
  2. `#chain` lab and `#interview` backprop route surface the active beat (“say aloud: gate shut ⇒ no blame on w₁”) with a one-click jump to `#pipeline` or `#twins`.
  3. Replay scrub includes an explicit gate-shut beat (not just “Blame path” with open gate); Reset restores `DEFAULT_CAST`.
  4. `npx tsc --noEmit` and `npm run check` pass; no new hash surfaces.
- **Try:** http://127.0.0.1:5190/#replay (scrub to gate-shut) → `#chain` → `#interview` (backprop ask) → Studio on `/`

### Ranked priorities (for dispatch)
1. **Agent 2 — Score Matrix Arena** (`#scores`) — fills the largest attention-math hole.
2. **Agent 3 — Failure Beat Story Circuit** — unifies existing pipeline/twins/chain into one teachable failure narrative.

**ready for Agent 2 and Agent 3**

---

## Agent1 Review Cycle 2/10

### Critical review
**Cycle 1 shipped**
- `#scores` is a real QKᵀ heat stage (cast-driven cells, √d, cell→dot expand, row softmax) and the map transfer now points at it.
- Failure beats (`dead-relu` / `bad-eta` / `honest`) write cast + say-aloud cues across Studio, replay, `#chain`, `#interview`.

**What still fails to teach AI math innovatively**
- Training still lies with **three terrains**: Studio bowl `L(w)`, landscape elliptic `(u,v)`, and tiny-net `L(w₁,w₂)` from pipeline/chain — hiking never teaches the loss the blame path actually computes; gate-shut is a caption, not a flat plateau you can walk onto.
- Attention still stops at **scores→weights**; there is no stage where softmax weights mix **values** into an output vector, so “attention is a weighted sum” stays textbook next to `#scores` / `#spotlight`.
- Studio strip labels cast `scores` as classifier logits `z` while `#scores` / spotlight compute a different score world from `x`·`k` — same word, two origins; softmax lesson never forces the learner to name which origin they are on.
- Map stations remain inert pins; Synthesis is still a preview chip wall (and ignores `#scores`); failure beats set knobs but do not stamp a single computed **loss passport** (`L`, gate, `∂L/∂w₁`) that every training surface must echo.

Focus for next build: **true tiny-net contours as the hike**, and a **named dual-origin score ledger** in the narrative — not η polish or more jump buttons.

### Agent 2 brief — Tiny-Net Contour Arena
- **Goal:** Ship a new innovation surface where the hike axes **are** cast `w₁`,`w₂` and cell/contour height **is** the tiny-net loss `L = (ŷ − t)²` with `z = w₁ x₁`, `h = ReLU(z)`, `ŷ = w₂ h` (via `math.ts` / `backprop` only). Render the **gate-shut half-plane** (`w₁ x₁ ≤ 0`) as a visibly flat plateau (loss independent of `w₁`); current cast point + ∇L arrow; step patches cast `w₁`,`w₂`. This replaces the pedagogical lie of the elliptic `(u,v)` bowl as “the” training terrain.
- **Files allowed:** `src/terrain.tsx` (new), `src/surfaces.ts`, `src/App.tsx`, `src/mapGraph.ts` and/or `src/map.tsx` (optional cue/link only), `src/plots.tsx` (heat/contour helpers only). Do **not** edit lessons, story copy, Studio narrative, or delete `#landscape` (leave old bowl as contrast if linked).
- **Acceptance checks:**
  1. Hash `#terrain` opens the arena; listed in Innovation surfaces strip.
  2. Moving / stepping on the grid updates cast `w₁`,`w₂`; with default gate-shut beat numbers (`w₁ x₁ < 0`) the surface shows flat ∂L/∂w₁ (= 0) across the shut region; opening the gate (positive `w₁ x₁`) restores a slope in `w₁`.
  3. Live readout shows `L`, gate, `∂L/∂w₁`, `∂L/∂w₂` matching `backprop(cast.x[0], cast.w1, cast.w2, cast.target)`; links open `#chain` `#partials` `#descent` `#pipeline` `#twins`.
  4. `npx tsc --noEmit` and `npm run check` pass; `math.ts` remains sole numeric engine.
- **Try:** http://127.0.0.1:5190/#terrain (also trigger gate-shut from Studio, then reopen `#terrain`)

### Agent 3 brief — Softmax Origin Ledger
- **Goal:** Teach that **softmax is one machine with two score origins** on this site: (A) **classifier logits** = cast `scores`, (B) **attention scores** = live `q·k[/√d]` row from cast `x`,`k` (same numbers `#scores` uses). Wire Studio, story chapters, replay, interview, and the softmax lesson so the learner must **name the origin** before reading probabilities — killing the “z bars vs spotlight” conflation without a new visual surface.
- **Files allowed:** `src/story.ts`, `src/storyChapters.ts`, `src/studio.tsx`, `src/replay.tsx`, `src/interview.tsx`, `src/lessons/calculus.tsx` (softmax + any StoryStrip/origin cue only), `src/ui.tsx` (StoryStrip / caption helpers only if needed). Do **not** invent new hash surfaces or edit map/plots/App routes.
- **Acceptance checks:**
  1. Studio shows both origins side-by-side: editable cast logits → softmax **and** a read-only attention score triple from cast `x`,`k` (with √d note) → its softmax; labels cannot both say only “scores”.
  2. `#softmax` lab and StoryStrip require an explicit origin toggle/callout (“classifier logits” vs “attention dots”); interview gains one ask that walks logits→softmax and one that walks `#scores`/`dot`→softmax with different station lists.
  3. Replay includes a keyframe/caption that switches origin emphasis (logits peaking vs attention row peaking) without inventing new cast fields beyond existing `x`,`k`,`scores`; Reset restores `DEFAULT_CAST`.
  4. `npx tsc --noEmit` and `npm run check` pass; no new hash surfaces.
- **Try:** http://127.0.0.1:5190/ (Studio origin ledger) → `#softmax` → `#interview` (both score-origin asks) → `#replay`

### Ranked priorities (for dispatch)
1. **Agent 2 — Tiny-Net Contour Arena** (`#terrain`) — makes the blame-path loss the thing you hike.
2. **Agent 3 — Softmax Origin Ledger** — separates classifier vs attention score worlds that the site currently conflates.

**ready for Agent 2 and Agent 3**

---

## Agent1 Innovate Cycle 1

### Two innovation ideas
1. **Value Mixer Stage (`#mixer`)** — After scores and softmax weights, a pour/scale theater shows three value vectors mixed by attention α into one output vector, so “attention is a weighted sum” becomes a machine you watch, not a caption beside `#scores` / `#spotlight`.
2. **Loss Passport Circuit** — One computed stamp card (`L`, `ŷ`, gate, `∂L/∂w₁`, `∂L/∂w₂` from `backprop` on the shared cast) that Studio, `#pipeline`, `#twins`, `#chain`, `#replay`, and `#synthesis` must echo identically — one run, one passport, no silent terrain drift.

### Agent 2 brief — Value Mixer Stage
- **Goal:** Ship a new innovation surface `#mixer`: three value rods (derived as cyclic permutations of cast `x`, same no-new-field pattern as keys from `k`) are each scaled by attention weight `αᵢ = softmax(attentionScoreRow(cast))ᵢ`, then added into one output vector `o = Σᵢ αᵢ vᵢ` via `math.ts` (`dot` / `softmax` / `scale` / `add` only). Animate or step pour → scale → stack; toggling √d must match `#scores` / `attentionScoreRow`. Live readout shows raw scores, α, each `αᵢ vᵢ`, and `o`. This is the missing third act after heat scores and spotlight brightness.
- **Files allowed:** `src/mixer.tsx` (new), `src/surfaces.ts`, `src/App.tsx`, `src/mapGraph.ts` and/or `src/map.tsx` (optional transfer/cue to `#mixer` only), `src/story.ts` (read-only helpers reuse / tiny shared `attentionValuesFromCast` if needed — **no** new `StoryCast` fields). Do **not** edit lessons, Studio narrative copy, interview asks, or delete `#spotlight` / `#scores`.
- **Acceptance checks:**
  1. Hash `#mixer` opens the stage; listed in Innovation surfaces strip with tokens `#172554` / `#1d4ed8` / `#b45309` / `#059669`.
  2. With default cast, α matches `softmax(attentionScoreRow(cast))` and `o` matches the hand `scale`+`add` mix; changing cast `x` or `k` (via existing cast write elsewhere, then reopen) visibly reweights which value rod dominates `o`.
  3. √d toggle flips scores the same way as `#scores`; links open `#scores` `#spotlight` `#softmax` `#dot` `#combine`.
  4. `npx tsc --noEmit` and `npm run check` pass; `math.ts` remains sole numeric engine; no new curriculum fields/formulas; no commit.
- **Try:** http://127.0.0.1:5190/#mixer (then `#scores` → `#spotlight` → `#mixer`)

### Agent 3 brief — Loss Passport Circuit
- **Goal:** Wire a single **Loss Passport** strip: numbers `L`, `ŷ`, gate (`h>0` / shut), `∂L/∂w₁`, `∂L/∂w₂` computed only via `backprop(cast.x[0], cast.w1, cast.w2, cast.target)` (and existing story helpers), shown with the same labels on Studio, `#pipeline`, `#twins`, `#chain`, `#replay`, and `#synthesis`. Failure beats must refresh the passport in place so gate-shut shows `∂L/∂w₁ = 0` everywhere at once — killing three silent “training worlds.” No new hash surface.
- **Files allowed:** `src/story.ts`, `src/storyChapters.ts`, `src/studio.tsx`, `src/pipeline.tsx`, `src/twins.tsx`, `src/replay.tsx`, `src/synthesis.tsx`, `src/interview.tsx`, `src/lessons/calculus.tsx` (chain / descent StoryStrip or passport mount only), `src/ui.tsx` (shared `LossPassport` component only). Do **not** invent new hash surfaces or edit map/plots/`math.ts` formulas; do **not** add curriculum fields.
- **Acceptance checks:**
  1. A shared passport UI appears on Studio `/` and on `#pipeline` `#twins` `#chain` `#replay` `#synthesis` with identical values for the same cast.
  2. Triggering dead-ReLU beat makes every mounted passport show gate shut and `∂L/∂w₁ = 0`; honest beat restores nonzero `∂L/∂w₁` when `w₁ x₁ > 0`; interview backprop ask names the passport fields to say aloud.
  3. `#synthesis` passport sits beside its previews (not a dead chip); Reset / `DEFAULT_CAST` restores passport to default backprop numbers.
  4. `npx tsc --noEmit` and `npm run check` pass; no new hash routes; no commit.
- **Try:** http://127.0.0.1:5190/ (Studio passport) → trigger Gate shut → `#pipeline` → `#twins` → `#chain` → `#synthesis` → `#replay`

### Ranked priorities (for dispatch)
1. **Agent 2 — Value Mixer Stage** (`#mixer`) — finishes attention as a weighted sum of values.
2. **Agent 3 — Loss Passport Circuit** — one backprop stamp echoed across every training surface.

**ready for Agent 2 and Agent 3**

## Agent1 Innovate Cycle 2/10

### Two innovation ideas
1. **Jacobian Stretch Loom (`#loom`)** — A loom stage where each column of cast `W` is a colored warp thread: tugging input fiber `xᵢ` stretches the output fabric by that column, so `y = Wx + b` and “the Jacobian is W” become a machine you pull, not a matrix definition on the Shapes route.
2. **CE Blame Stamp Circuit** — Classifier twin of the Loss Passport: one stamp of logits `z`, probs `p`, cross-entropy `L`, and blame `∂L/∂z = p − eᵧ` from `softmaxLossGrad(cast.scores, cast.correct)` echoed on Studio, `#softmax`, interview, and synthesis — so the classifier world finally has one honest run of numbers (attention already got scores→spotlight→mixer).

### Agent 2 brief — Jacobian Stretch Loom
- **Goal:** Ship a new innovation surface `#loom`: render cast `W` (2×3) as three vertical warp threads (columns) plus bias pins `b`; forward readout `y = Wx + b` via `matvec` / `add` only. Mode **Pull fiber i**: show Δx on basis `eᵢ` and Δy ≈ `W`’s i-th column (exact for linear maps); highlight that column as the Jacobian thread `∂y/∂xᵢ`. Mode **All threads**: draw both output components as stacked stretch meters. Live numbers must match `matvec(cast.W, cast.x) + cast.b`. Optional scrub of one `xᵢ` writes through the shared cast. This is the missing Shapes-route machine after Matrix-as-Machine’s row-workers (rows vs columns dual).
- **Files allowed:** `src/loom.tsx` (new), `src/surfaces.ts`, `src/App.tsx`, `src/mapGraph.ts` and/or `src/map.tsx` (optional transfer/cue to `#loom` only), `src/plots.tsx` (shared SVG/meter helpers only if needed). Do **not** edit lessons, Studio narrative copy, interview asks, `#machine`, or `math.ts` formulas; **no** new `StoryCast` fields.
- **Acceptance checks:**
  1. Hash `#loom` opens the loom; listed in Innovation surfaces strip with tokens `#172554` / `#1d4ed8` / `#b45309` / `#059669`.
  2. With default cast, on-stage `y` equals `add(matvec(W,x), b)`; selecting fiber `i` highlights column `i` and shows Δy matching that column when Δxᵢ = 1.
  3. Changing cast `W` / `x` / `b` (via existing cast write elsewhere, then reopen) visibly rethreads the loom; links open `#linear-layer` `#jacobian` `#transpose` `#machine` `#combine`.
  4. `npx tsc --noEmit` and `npm run check` pass; `math.ts` remains sole numeric engine; no new curriculum fields/formulas; no commit.
- **Try:** http://127.0.0.1:5190/#loom (then `#machine` → `#linear-layer` → `#jacobian`)

### Agent 3 brief — CE Blame Stamp Circuit
- **Goal:** Wire a shared **CE Blame Stamp** (classifier passport): numbers `z` (= `cast.scores`), `p = softmax(z)`, `L` (cross-entropy), and per-logit blame `g = ∂L/∂z = p − eᵧ` computed only via `softmaxLossGrad(cast.scores, cast.correct)` (and existing story helpers), shown with the same labels on Studio `/`, `#softmax`, `#interview`, and `#synthesis`. Changing `correct` or `scores` must refresh every mounted stamp at once — killing the silent gap where attention has a full theater but classifier loss is still caption-only. Name the stamp “CE Blame” so it is not confused with the tiny-net Loss Passport. No new hash surface.
- **Files allowed:** `src/story.ts`, `src/storyChapters.ts`, `src/studio.tsx`, `src/synthesis.tsx`, `src/interview.tsx`, `src/lessons/calculus.tsx` (softmax lesson StoryStrip / stamp mount only), `src/ui.tsx` (shared `CEBlameStamp` component only). Do **not** invent new hash surfaces or edit map/plots/`math.ts` formulas; do **not** replace or remove Loss Passport; do **not** add curriculum fields.
- **Acceptance checks:**
  1. A shared CE Blame stamp UI appears on Studio `/` and on `#softmax` `#interview` `#synthesis` with identical `z`, `p`, `L`, `g` for the same cast.
  2. Flipping `correct` (Studio) moves the one-hot and visibly rewrites `g` on every mounted stamp; interview gains one ask that names `p − eᵧ` aloud; softmax chapter blurb points at the stamp.
  3. Stamp sits beside Loss Passport without merging fields; Reset / `DEFAULT_CAST` restores default `softmaxLossGrad` numbers.
  4. `npx tsc --noEmit` and `npm run check` pass; no new hash routes; no commit.
- **Try:** http://127.0.0.1:5190/ (Studio CE Blame) → change correct class → `#softmax` → `#synthesis` → `#interview`

### Ranked priorities (for dispatch)
1. **Agent 2 — Jacobian Stretch Loom** (`#loom`) — turns Wx+b / Jacobian into a pullable column machine.
2. **Agent 3 — CE Blame Stamp Circuit** — one classifier softmax+CE gradient stamp across Studio and softmax surfaces.

**ready for Agent 2 and Agent 3**

---

## Agent1 Problem+Method Cycle

*Mandate shift: invent the conceptual difficulty + the understanding method. Prefer deepening existing surfaces over new hash gadgets. Method > problem statement.*

### Problem A — Softmax Peak Illusion (√d)
- **Name:** Softmax Peak Illusion
- **Misunderstanding:** Learners treat `÷√d` as optional polish, or reverse its effect — they think raw dots make attention “flat / undecided,” so scaling must *sharpen* the bets. In reality, unscaled `q·k` gaps grow like √d and drive softmax toward a near one-hot; `÷√d` *restores a usable blend*.
- **Why it blocks AI math:** Attention’s whole point is a soft weighted sum of values. If the learner’s mental model of √d is backwards, `#scores` / `#spotlight` / `#mixer` look like three demos of the same formula instead of one causal story: score gap size → α sharpness → whether `o` is a mix or a copy of one `v`.

### Method A (PRIMARY) — Same-Cast Peak↔Blend Ritual
- **How the learner understands it:**
  1. **Lock one cast** (shared Studio numbers for `x`, `k`). Do not invent a second toy dataset.
  2. On `#scores`, enable an explicit **A|B compare**: left = raw `q·k` heat + that row’s softmax; right = same cells with `÷√d` + its softmax. Same row selected on both. Read aloud max(α) and the gap between top-2 scores on each side.
  3. Jump to `#spotlight` with the **same A|B**: one lamp, three keys — brightness without √d vs with √d side-by-side (or a single stage with a sticky “compare latch” that freezes the OFF frame while ON is live). Feel which key eats the beam when unscaled.
  4. Finish on `#mixer` pour→scale→stack under both regimes: without √d, watch `o` collapse onto the winning value rod; with √d, watch multiple rods still contribute. The click is bodily: *scaling is what keeps the mix alive*.
  5. Optional close: map transfer **÷√d** + `#norm` bars — name the reversed misconception out loud (“raw is sharp, not flat”).
- **Why this method works:** The confusion is about *direction of effect*, not the formula text. Simultaneous same-cast contrast kills the reversed story; ending in the mixer makes √d consequential for the output vector, not a caption on scores.
- **Reuse vs build:** Reuse `#scores`, `#spotlight`, `#mixer`, map transfer `norm-sqrtd`, `#norm`, shared cast. **Build:** A|B compare / compare-latch interaction *inside those surfaces* (and a thin Studio cue) — **not** a new hash.

### Problem B — Transpose as “Flip Theater,” Not Blame Routing
- **Name:** Blame Needs the Flip
- **Misunderstanding:** Learners treat transpose as an algebra party trick (swap rows/cols) and treat “backward uses Wᵀ” as a second unrelated rule memorized next to “forward uses W.” They do not feel that blaming input `j` *is* “dot upstream `g` with column `j` of W,” which is exactly row `j` of Wᵀ.
- **Why it blocks AI math:** Every linear layer’s backward pass is this dual. Without it, `#jacobian`, `#machine` transpose mode, and shapes-route map edges stay three disconnected lessons; attention’s `Kᵀ` in QKᵀ also floats as “just how you write the product.”

### Method B — Forward-Then-Flip Dual on One W
- **How the learner understands it:**
  1. On `#machine` **forward** mode with cast `W`, `x`, `b`: watch row-workers form `y = Wx+b`. Freeze those numbers.
  2. Introduce one upstream blame vector `g` (from existing CE Blame stamp / classifier grad on cast scores, or a small fixed `g` derived only via existing `math.ts` helpers — no new formulas). Ask: “how much is each input to blame?”
  3. Flip to **transpose** mode on the *same* W: highlight column `j` becoming the worker that dots with `g`; show `(Wᵀ g)ⱼ` equals that column·g. The numbers do not change — only which way the table faces.
  4. Open `#jacobian` with the same cast W / upstream g echoed in StoryStrip: long sum Σᵢ gᵢ Wᵢⱼ vs product Wᵀg must match. Say aloud: *forward faces rows; blame faces columns = Wᵀ rows*.
  5. Interview/story beat walks `#machine` → `#transpose` → `#jacobian` (shapes route) with the say-aloud cue; optional glance at attention: Kᵀ faces keys as columns for the same facing reason — not a new mechanism.
- **Why this method works:** One matrix, two jobs, same entries. The method forces the learner to *reuse* the forward numbers as blame routers instead of learning a second slogan.
- **Reuse vs build:** Reuse `#machine`, `#jacobian`, `#transpose`, shapes map edges, CE Blame / Studio cast, interview. **Build:** wiring + StoryStrip/interview beat + machine↔jacobian shared highlight of column↔Wᵀ row — **no** new `#loom` / hash.

### Agent 2 brief — Peak↔Blend Compare (Method A visual)
- **Goal:** Help the learner understand the Softmax Peak Illusion by performing the same-cast Peak↔Blend ritual across `#scores` → `#spotlight` → `#mixer`.
- **Files allowed:** `src/scoreMatrix.tsx`, `src/spotlight.tsx`, `src/mixer.tsx`, `src/ui.tsx` (shared compare-latch / A|B chrome only), `src/studio.tsx` (one short cue pointing at the ritual only), `src/mapGraph.ts` and/or `src/map.tsx` (optional clarify of `÷√d` transfer diff text only). Do **not** add a new hash surface; do **not** edit curriculum formulas in `math.ts`; do **not** invent new StoryCast fields.
- **Acceptance:**
  1. On `#scores`, learner can view raw vs `÷√d` for the **same** cast row at once (A|B); max α / top-2 gap readout updates from cast.
  2. `#spotlight` and `#mixer` honor the same compare intent (A|B or compare-latch) so unscaled vs scaled brightness / `o` collapse are visible without changing cast between views.
  3. Confusion dissolves when learner can say: raw dots → peaked α → `o`≈one `v`; `÷√d` → softer α → real mix. Links still open `#norm` `#dot` `#softmax`.
  4. `npx tsc --noEmit` and `npm run check` pass; design tokens; local only; no commit.
- **Try:** http://127.0.0.1:5190/#scores (A|B) → `#spotlight` → `#mixer`

### Agent 3 brief — Forward-Then-Flip Wiring (Method B narrative)
- **Goal:** Help the learner understand “Blame Needs the Flip” by wiring the forward-then-flip dual across `#machine`, `#jacobian`, `#transpose`, Studio/StoryStrip, and interview — same cast W, same upstream g.
- **Files allowed:** `src/matrixMachine.tsx` (transpose/forward dual cues + shared g readout only), `src/story.ts`, `src/storyChapters.ts`, `src/studio.tsx`, `src/interview.tsx`, `src/lessons/calculus.tsx` (jacobian StoryStrip / echo only), `src/lessons/algebra.tsx` (transpose lesson StoryStrip cue only), `src/ui.tsx` (shared strip/badge only if needed), `src/synthesis.tsx` (optional echo). Do **not** invent `#loom` or any new hash; do **not** edit `math.ts` formulas; do **not** add curriculum fields.
- **Acceptance:**
  1. Learner can run forward on `#machine`, then flip to transpose and see each input blame as column·g = (Wᵀg)ⱼ with numbers matching `#jacobian` for the same cast.
  2. Interview gains / adjusts one ask that walks machine → transpose → jacobian with say-aloud “forward W, blame Wᵀ — same entries.”
  3. StoryStrip on `#jacobian` (and transpose) names the dual; Reset restores `DEFAULT_CAST`.
  4. `npx tsc --noEmit` and `npm run check` pass; no new hash routes; no commit.
- **Try:** http://127.0.0.1:5190/#machine (forward → transpose) → `#jacobian` → `#interview` → `#transpose`

### Ranked priorities (for dispatch)
1. **Agent 2 — Peak↔Blend Compare** (Method A) — dissolves the reversed √d story where attention actually lives.
2. **Agent 3 — Forward-Then-Flip Wiring** (Method B) — makes Wᵀ the blame face of the same W, not a second rule.

**ready for Agent 2 and Agent 3**
