# Vokercast
Тренажёр заклинаний Invoker: 10 случайных кастов, секундомер, условные звания и сборки.

Сайт: https://wehay322.github.io/vokercast/

Запуск: откройте index.html в браузере или запустите статический HTTP-сервер.


## Hero phrase game
Solo practice or a two-player duel with 20/40/60/90/120-second rounds. Both players receive the same shuffled sequence; each advances independently. Correct answers earn 1 point; wrong answers and skips earn 0. Host tab controls the round deadline and score. Players need no accounts.

## Multiplayer transport
Both games relay messages through Supabase database RPC, polling every 500 ms. Room creation and joining issue separate random participant tokens, kept in browser memory. Tables have RLS enabled and no direct access for public roles. The public API key is safe to publish; never put a secret or service_role key in the site.

Rooms hold two players, expire after two hours, and close when either player leaves. A disconnected player is detected after 30 seconds without a heartbeat. Expired rooms and messages are removed on subsequent room creation. These friend games trust the host for game rules and scoring. The free project is subject to Supabase usage limits and inactivity pausing.

Short hero response excerpts sourced from https://github.com/dota2tools/dtrspnsy (per-hero source URLs retained in quotes.js). Russian preferred, English fallback. Hero responses belong to Valve; no full response transcripts or voice recordings are bundled. Some silent/new heroes are not represented in the question pool.
