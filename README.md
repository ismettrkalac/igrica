# Fireboy & Watergirl – Forest Temple (fan recreation)

A browser recreation of *Fireboy & Watergirl in the Forest Temple* (Oslo Albet, 2009), built with
Phaser 3 + Vite. Everything is redrawn from scratch to match screenshots of the original: no original
assets are used. For personal, non-commercial use only.

## Run it

```bash
npm install
npm run dev          # game at http://localhost:5173
```

Controls (as in the original): **Fireboy** ← ↑ →, **Watergirl** A W D. Esc/P pauses, R restarts.

Handy URLs: `?level=1` jumps straight into a level, `?scene=Menu` opens a scene, and `?touch=1` or
`?touch=0` forces the on-screen controls on or off.

## Online duo (two devices)

Play together on two devices: one player picks **Online Duo → Create Room** and shares the 4-letter
code, the other picks **Join Room**. The host's browser runs the physics. The guest sends key
presses and draws the host's snapshots, so each player controls one character.

```bash
npm run server       # relay on :8787 (dev server proxies /ws to it)
npm run dev          # in a second terminal
```

- **Same Wi-Fi:** open `http://<your-computer-ip>:5173` on both devices.
- **One process for production:** `npm start` builds the game and serves it with the relay on
  `PORT` (default 8787).
- **Over the internet:** deploy `npm start` to any Node host that supports WebSockets, or expose
  port 8787 with a tunnel. A different relay can be chosen with `?server=wss://host/ws`.

## Deploy free on Render

`render.yaml` sets up one free web service that serves the game and runs the online rooms.

1. Push this folder to a **private** GitHub repository. It contains screenshots of the original
   game in `reference/`, so keep it private.
2. On [render.com](https://render.com), choose **New → Blueprint** and pick the repository, then
   **Apply**. Render reads `render.yaml`: build `npm ci --include=dev && npm run build`, start
   `node server/server.js`, health check `/healthz`, free plan.
3. When the deploy finishes, open the `https://<name>.onrender.com` link. Share it with your partner:
   one player creates a room under **Online Duo**, the other joins with the code.

Every push to the repository redeploys automatically. On the free plan the server sleeps after
15 minutes with no traffic, so the first visit afterwards takes about a minute to load. While a room
is open, the game sends a keep-alive every 30 s, so it stays awake during play.

## Mobile

The game scales to fit the screen. Phones show a "rotate to landscape" prompt in portrait. Touch
devices get on-screen buttons placed in the side bars beside the 4:3 game:

- **Same device:** left cluster = Watergirl, right cluster = Fireboy.
- **Online:** ◀ ▶ on the left, jump on the right, for your own character.

## Project layout

```
reference/          screenshots of the original + NOTES.md (measured sizes, physics, colours)
server/server.js    static server + WebSocket room relay
src/config.js       stage size (640x480), physics constants, palette
src/levels/         coordinate-based level data (polygons, pools, gems, doors, mechanisms)
src/game/World.js   deterministic simulation (pixel-mask collision, slopes, boxes, elevators)
src/game/           input (keyboard + touch), sound effects
src/art/            procedural canvas art: level stone/bricks, characters, objects, menus
src/scenes/         Boot, Title, Menu, LevelSelect, Game, Lobby
src/net/            WebSocket client
```

## Status

- Level 1 is recreated from the reference and is completable. The other 31 map nodes are shown but
  locked until their levels are captured and traced.
- Some details could not be checked against the original. See `reference/NOTES.md`.
