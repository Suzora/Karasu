---
paths:
  - "src/api/**"
  - "src-tauri/src/anilist/**"
  - "src-tauri/src/alerts/**"
  - "src-tauri/src/commands/**"
  - "src/pages/**"
  - "src/components/social/**"
  - "scripts/anilist-query.mjs"
  - "scripts/ratelimit-probe.mjs"
  - "scripts/sample-markdown.mjs"
---

# What AniList's API does, as measured

Moved out of CLAUDE.md word for word; CLAUDE.md still decides wherever the two could disagree.

## Notes that have cost real time

- **Validate AniList fields live before wiring them**, per the convention below,
  with `node scripts/anilist-query.mjs <CONST> '<variables-json>'`. It reads the
  constant off disk, so it checks the query the app actually ships. It runs
  signed out, so for a Viewer-scoped query it proves the query parses and
  nothing more: a nested relation that resolves null on every row passes it.
  Read a signed-in answer, with `--raw`'s eye for the values, before trusting
  one - see the note on activities nested under a notification.
- **`pageInfo.total` is a capped sentinel on most AniList collections, not a
  count.** Anything with many matches reports `total: 5000` with a `lastPage`
  that is just 5000/perPage - measured on user search, activities and threads
  alike. It is honest only for small sets (`User(name: "Kyusetzu")` really is 1,
  and follower/following totals are real). So a "Load N more" label is a lie on
  those three, which is why `UserList` takes a `countRemaining` flag and the
  feeds pass a countless button. A number on a button is a claim about what a
  click costs.
- **Entity search needs three characters, and it was measured per entity.**
  `Page.users(search: "ky")` returns the exact match followed by a fixed set
  of unrelated accounts; characters, staff and studios behave the same way
  (`"ky"` answered Levi and MADHOUSE before real prefix matches appear at
  three). `USER_SEARCH_MIN` gates all four scopes; media search is fine at
  two and keeps it.
- **One not-found root nulls every sibling root.** `{ good: User(id: 153164) bad:
  User(id: 999999999) }` returns HTTP 404 and `{"good": null, "bad": null}` - the
  good one dies with the bad. That is why `FOLLOW_COUNTS_QUERY` may alias two
  `Page` roots (a `Page` cannot 404) and why `User` is never aliased beside
  anything else. `Page.users` also has no `id_in`, so users cannot be batched by
  id at all.
- **`ThreadComment.childComments` is a raw `Json` scalar and costs 13×.** Twelve
  comments measured 52,801 bytes with it and 3,964 without, and the nesting ran
  **48 levels deep**. There is no depth control, so it is all or nothing: the
  query keeps it, pays for it with `perPage: 10`, and `lib/comments` flattens to
  two levels while reporting what it hides. Being untyped, "unexpected shape" is
  a normal outcome there rather than a defensive hypothetical.
- **`text(asHtml: true)` is the API's renderer, not the website's.** The
  site renders markdown in the browser with its own pipeline, and the two
  disagree inside HTML blocks: markdown inside a multi-line `<center>` is
  literal to the API and rendered by the site (`#__[t](u)__` is an `<h1>`
  holding a bold link there, a bare anime URL a media card), and the site's
  heading rule needs no space after the `#` (marked's, not CommonMark's).
  Spoilers and images agreed in every sample measured on 2026-09-10; that is
  why `anilistMarkdown.fixtures.test.ts` grades those two everywhere and
  headings/links only where `scripts/sample-markdown.mjs` says the API can be
  trusted. The oracle is the site's `.markdown` element in a browser, and a
  one-line `<div align="center">- x -</div>` is *not* a list there while a
  multi-line `<center>` block does get its markdown - measured, not derived.
  The sampler's `--rig` transport exists because an outage that refuses
  unauthenticated requests (HTTP 403 "temporarily disabled") still answers
  signed-in ones.
- **The website reaches a forum page Karasu cannot, and that is deliberate.**
  anilist.co renders page 470 of thread 1 because its **Web Worker** posts to
  **`anilist.co/graphql`** - a different endpoint from `graphql.anilist.co` -
  with an `x-csrf-token` bound to a site session. That endpoint does not enforce
  the 5,000-entry page-depth cap; without the header it answers **403
  `Forbidden. (Use graphql subdomain)`**. An account does not lift the cap
  either: the measurement was taken logged *out*, and the site needs the
  separate endpoint for its own signed-in users too. Using it would mean
  scraping a CSRF token and impersonating the website past an explicit access
  control. **Do not.** The supported route is `Thread.replyCommentId` → the root
  `ThreadComment(id:)` field, which is a **LIST rather than a `Page` and so is
  not capped at all**; it resolves any id to the **root of its tree** and returns
  the whole conversation in one request. `lib/threadJump` holds the arithmetic
  and the rejected alternatives - the worker is also why a normal network trace
  of anilist.co shows no GraphQL at all.
- **One not-found root nulls every sibling on `ThreadComment` too.** The trap
  `FOLLOW_COUNTS_QUERY` documents for `User` is not special to `User`: forty
  aliased `ThreadComment(id:)` roots in one request all came back `null` with a
  single `"Not Found."` because one comment had been deleted. Alias-batching
  otherwise works there (20 roots for one request), which is exactly what makes
  it tempting. Deleted comments are ordinary, so any id-walking scheme built on
  it fails most times it runs.
- **`ThreadComment(threadId:, userId:)` and `Page.threadComments(threadId:,
  userId:)` are different resolvers.** The root field returned **1** comment for
  a user in thread 1; the `Page` field returned **144**, because it includes
  their nested replies and the root field does not. Unbounded
  `ThreadComment(threadId:)` with no other filter answers **HTTP 500** - but
  `Page.threadComments(userId:)` with **no `threadId` works**, resolves
  `thread { id title }` per row, reports an honest `total`, and - unlike every
  `threadId` call - **actually honours `sort: [ID_DESC]`** (ids measured
  reversed against the unsorted call). "sort is inert" is a fact about the
  `threadId` shape only; `USER_FORUM_COMMENTS_QUERY` is the one place the app
  passes `sort` to this field, and why.
- **`Page.threadComments` returns `perPage + 1` rows, and the extra one is a
  nested reply served as a root.** At `perPage: 10`, page 1 of thread 1 came
  back as `17,18,19,23,30,`**`2088149`**`,32,40,43,44,53` and page 2 carried
  `1618189` between `163` and `165` - eleven rows both times, while
  `pageInfo` kept reporting `perPage: 10`. Re-measured identically on
  2026-09-03 (page 3 was a clean ten), and the cause narrowed by one more
  request: `ThreadComment(id: 2088149)` resolves to the tree of root comment
  **30**, the root just before it on the page - so the extra row is a reply
  buried inside the preceding root (posted years later), which AniList hands
  out as if it were a root of its own. Each "Load more" therefore draws one
  row that belongs inside another; `lib/comments` degrades gracefully, and
  this is the datum an upstream report needs.
- **A list activity nested under a notification resolves its scalars and
  neither its media nor its user.** Measured on 2026-10-07 with the
  maintainer's token (read-only, `reset: false`): on 13 of 13 activity
  notifications the nested `ListActivity` came back with `__typename`, `id`
  and `status` filled and `media` and `user` null; a nested `TextActivity`'s
  `text` (its `user` was not checked) and a nested `ThreadComment`'s
  `comment` were filled. The twelve activities those rows named, asked for by
  id - `Page(perPage: 50) { activities(id_in:, type_in: [TEXT, ANIME_LIST,
  MANGA_LIST]) }` - all came back with `media` (title, `isAdult`, genres,
  cover) and `user` filled, and `isFollowing` made no difference; an id that
  does not exist simply drops out of that answer, HTTP 200 and no error. So
  the bell from 1.34.0.782 and the toast's caption from 1.35.0.783, both
  until 1.40.7.812, drew no list subject and never had a title, and nothing
  said so: the schema accepts the relation, the query script runs signed
  out, and every fixture - the vitest suites', the Rust tests' and the
  screens harness's - filled in the relations AniList does not send. The
  bell and the toast now ask for the activities by id (their two Conventions
  notes), and a test on each side pins that a nested activity with null
  relations names nothing. Only the nested `__typename` is still read, by the
  toast, to ask for a list activity alone. Whether a
  `MESSAGE` id is kept out by `type_in` could not be measured signed out (no
  public message activity answered); the fragment and the reader guard it.
- **AniList's rate window steps; it does not roll.** Measured twice on
  2026-09-03 with `scripts/ratelimit-probe.mjs` (unauthenticated, the phone in
  airplane mode, two minutes apart, identical both times): a cold client reads
  `remaining: 29` of 30; a burn to 21 then reads 20, 19, 18, 17 at
  +5/+15/+30/+45 s - each sample costing exactly one and nothing returning -
  and 29 at +60 s, 28 at +90 s. Flat, then the whole budget at once, about
  60 s after the first request of the window. `headroom` in
  `anilist/client.rs` models exactly that step and stays as it is; the cost -
  one response reporting `remaining: 0` makes every request in the next
  minute pay the full `MAX_PACE` and go out anyway - is bounded and known. Do
  **not** heal proportionally: right for a rolling window, and for this one it
  hands out budget that does not exist and earns the 429s the limiter exists
  to avoid. **The bucket is per IP, not per token** - measured on
  2026-09-13: the anonymous probe read 17 after a burn, one signed-in
  request through the rig then read 16, and the next anonymous sample 15.
  So the phone and the PC share one budget only on the same network, and
  the rig and the installed app always do. Every request is tagged with a
  source (`AniList::query_from`; the passthrough takes `gql(query, vars,
  { source })`), tallied per source, and reported three ways: the verbose
  line `N requests in the last 5 min: …; 429s n, min remaining m` every
  five minutes, the "AniList requests this run" rows of the diagnostics
  report, and the "Requests by source" table in the sync panel. A cold
  start measured 8 requests in its first 30 s on 2026-09-13 (two lists,
  two recommendation sets, season hero, birthdays, bell count, airing).
- **Everyone's feed has no status-updates-only view, because AniList answers it
  empty.** The activity page's column (`lib/feedView`, since 2026-10-18) asks
  `ACTIVITY_QUERY` for the following feed, everyone's (no `isFollowing`, no
  `userId`) or the viewer's own, with `type_in` from the kind and never
  `MESSAGE`. Measured signed out on 2026-10-18: everyone's feed answered 25
  rows for every kind and pair of kinds, and none at all for `TEXT` alone,
  with or without `isFollowing: false`, while one user's `TEXT` answered.
  So `kindsFor("everyone")` leaves status updates out and the URL falls back
  to everything. Whether a signed-in request answers it was not measured;
  read a signed-in answer before offering it.
- **`weightedScore` is `averageScore` under its new name.** AniList's change of 2026-10-25 renamed the
  site's "Average Score" to "Weighted Score"; measured on 2026-10-24, signed out, both fields answered the
  same number on every title that had one (67/67 where `meanScore` read 68) and null together below the
  popularity floor, and introspection no longer lists `averageScore`. So every query asks
  `averageScore: weightedScore`, an alias that keeps the field name the types, the list cache, the MAL
  export and the statistics read. The same change folded the forum's Misc category (17) into General: it
  answers no threads, so it left `THREAD_CATEGORIES` and an old `?cat=17` reads as all categories. The
  new Events category answered no thread under any id up to 30, so it is not listed until one does. The
  three adult sub-options (`includeAdultContentInSearch`, `includeAdultContentInQuickSearch`,
  `displayAdultActivities`) are AniList's own and change nothing Karasu shows, since every search sends
  `isAdult` from the content filter and the feeds filter locally.
- **`mutualFollowers` means both ways, and answers signed out.** Measured on 2026-10-25 for user
  6421433: its eight rows were exactly the intersection of that user's followers and following, so a
  profile's Mutuals tab is about that profile, not about the viewer, and its total is a real count (8
  against 8). `FOLLOW_COUNTS_QUERY` carries it as a third `Page` alias, which cannot 404. `DeleteFollower`
  was validated by sending it signed out: it parses and answers `Unauthorized`, while a misspelt field
  is refused before that; it has not run against a real account. Removing a follower patches the
  viewer's own lists after AniList answers (`useRemoveFollower`), never optimistically, since a wrong
  guess there cannot be put back.
- **User id 153164 in `scripts/anilist-query.mjs`'s examples is a stranger's
  public account, not the maintainer's.** Kyusetzu is **6421433**. A plan
  built on the wrong one reads someone else's list and then "finds" bugs in
  the offline page for titles that were never on the list.
