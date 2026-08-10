# Gold Miner - HTML5 Web Version

This project is a web port based on the Gold Miner game source and image assets supplied for this project.

## Structure

```text
Gold-Miner/
├── index.html
├── style.css
├── game.js
├── assets/
│   ├── bg.png
│   ├── bg2.png
│   ├── player.png
│   ├── moc.png
│   ├── day.png
│   ├── vang_*.png
│   ├── da_*.png
│   ├── pig.png
│   ├── tnt1.png
│   ├── gap*.png
│   ├── button_start.png
│   └── gameover.png
└── README.md
```

## Run locally

No Node.js or build step is required.

Open `index.html` in a static web server, or deploy the repository directly to Vercel.

For Vercel:
- Framework Preset: Other
- Build Command: empty
- Output Directory: `.`
- Root Directory: project root

## Controls

- Click/tap the game area to drop the hook.
- Press Space to drop the hook.
- On mobile, use the DROP HOOK button.

## Next development steps

The current version preserves the classic 800x600 Gold Miner style and the main gameplay loop from the supplied Java source. It can later be expanded with more levels, shop/upgrades, sound, leaderboard and Pi Network integration.
