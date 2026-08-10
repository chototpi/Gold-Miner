(() => {
  "use strict";

  const W = 800;
  const H = 600;
  const SURFACE_Y = 150;
  const HOOK_PIVOT = { x: 385, y: 134 };
  const HOOK_MAX = 560;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const actionButton = document.getElementById("actionButton");
  const restartButton = document.getElementById("restartButton");

  const ASSET = "./assets/";
  const imageNames = [
    "startMenu.png", "gameover.png", "bg.png", "bg2.png",
    "player.png", "moc.png", "day.png",
    "vang_1.png", "vang_3.png", "vang_4.png",
    "da_1.png", "pig.png", "tnt1.png",
    "gapvang_1.png", "gapvang_3.png", "gapvang_4.png",
    "gapda_1.png", "gappig.png", "gaptnt.png",
    "button_start.png", "button_reset.png"
  ];

  const images = {};
  let loaded = 0;
  let state = "loading";
  let lastTime = 0;
  let score = 0;
  let timeLeft = 60;
  let target = 1000;
  let objects = [];
  let pigDirection = -1;

  const hook = {
    angle: 0,
    angleSpeed: 1.05,
    length: 0,
    maxLength: HOOK_MAX,
    state: "swing",
    speed: 330,
    returnSpeed: 300,
    tipX: HOOK_PIVOT.x,
    tipY: HOOK_PIVOT.y,
    grabbed: null,
    imageKey: "moc.png"
  };

  function loadImages() {
    return Promise.all(imageNames.map(name => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        images[name] = img;
        loaded++;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = ASSET + name;
    })));
  }

  function resetLevel() {
    score = 0;
    timeLeft = 60;
    target = 1000;
    hook.angle = 0;
    hook.length = 0;
    hook.state = "swing";
    hook.grabbed = null;
    hook.imageKey = "moc.png";
    pigDirection = -1;

    objects = [
      makeObject("gold", 48, 410, "vang_1.png", 500, 1.0),
      makeObject("gold", 500, 355, "vang_3.png", 250, 1.0),
      makeObject("gold", 295, 205, "vang_3.png", 250, 1.0),
      makeObject("gold", 742, 495, "vang_4.png", 100, 1.0),
      makeObject("rock", 300, 505, "da_1.png", 20, 1.8),
      makeObject("tnt", 400, 310, "tnt1.png", 0, 1.0),
      makeObject("pig", 350, 450, "pig.png", 1000, 0.9)
    ];
  }

  function makeObject(type, x, y, image, value, weight) {
    return {
      type, x, y, image, value, weight,
      alive: true,
      grabbed: false,
      vx: type === "pig" ? -55 : 0,
      vy: 0
    };
  }

  function startGame() {
    resetLevel();
    state = "playing";
    actionButton.hidden = false;
    restartButton.hidden = true;
  }

  function gameOver() {
    state = "gameover";
    hook.state = "swing";
    hook.length = 0;
    hook.grabbed = null;
    actionButton.hidden = true;
    restartButton.hidden = false;
  }

  function dropHook() {
    if (state === "menu") {
      startGame();
      return;
    }
    if (state === "gameover") {
      startGame();
      return;
    }
    if (state !== "playing") return;

    if (hook.state === "swing") {
      hook.state = "out";
    }
  }

  function update(dt) {
    if (state !== "playing") return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver();
      return;
    }

    // Pig movement, matching the original Java behavior.
    for (const o of objects) {
      if (!o.alive || o.grabbed) continue;
      if (o.type === "pig") {
        o.x += o.vx * dt;
        if (o.x < -10) o.x = 810;
      }
    }

    if (hook.state === "swing") {
      hook.angle += hook.angleSpeed * dt;
      const maxA = 1.18;
      if (hook.angle > maxA) {
        hook.angle = maxA;
        hook.angleSpeed = -Math.abs(hook.angleSpeed);
      }
      if (hook.angle < -maxA) {
        hook.angle = -maxA;
        hook.angleSpeed = Math.abs(hook.angleSpeed);
      }
    }

    if (hook.state === "out") {
      hook.length += hook.speed * dt;
      if (hook.length >= hook.maxLength) {
        hook.length = hook.maxLength;
        hook.state = "in";
      }
      updateHookTip();
      tryGrab();
    }

    if (hook.state === "in") {
      const pull = hook.grabbed ? hook.returnSpeed / hook.grabbed.weight : hook.returnSpeed;
      hook.length -= pull * dt;
      if (hook.grabbed) {
        hook.grabbed.x = hook.tipX - hook.grabbed.w / 2;
        hook.grabbed.y = hook.tipY - hook.grabbed.h / 2;
      }

      if (hook.length <= 0) {
        hook.length = 0;
        if (hook.grabbed) {
          const grabbed = hook.grabbed;
          score += grabbed.value;
          grabbed.alive = false;
          grabbed.grabbed = false;
          hook.grabbed = null;
          hook.imageKey = "moc.png";
        }
        hook.state = "swing";
      }
      updateHookTip();
    }

    objects = objects.filter(o => o.alive);

    if (score >= target) {
      // Classic-style progression: increase target and replenish the field.
      target += 750;
      timeLeft = 60;
      addNextWave();
    }

    if (!hook.grabbed && objects.filter(o => o.type === "gold" || o.type === "rock").length === 0 && hook.state === "swing") {
      gameOver();
    }
  }

  function addNextWave() {
    const wave = [
      makeObject("gold", 70, 390, "vang_1.png", 500, 1.0),
      makeObject("gold", 180 + Math.random() * 430, 270 + Math.random() * 170, "vang_3.png", 250, 1.0),
      makeObject("gold", 680, 430, "vang_4.png", 100, 1.0),
      makeObject("rock", 360, 500, "da_1.png", 20, 1.8),
      makeObject("tnt", 560, 350, "tnt1.png", 0, 1.0)
    ];
    objects.push(...wave);
  }

  function updateHookTip() {
    hook.tipX = HOOK_PIVOT.x + Math.sin(hook.angle) * hook.length;
    hook.tipY = HOOK_PIVOT.y + Math.cos(hook.angle) * hook.length;
  }

  function tryGrab() {
    if (hook.grabbed) return;

    const tip = { x: hook.tipX, y: hook.tipY };
    for (const o of objects) {
      if (!o.alive || o.grabbed) continue;
      const img = images[o.image];
      if (!img) continue;

      const w = img.width;
      const h = img.height;
      const box = { x: o.x, y: o.y, w, h };

      if (tip.x >= box.x && tip.x <= box.x + box.w &&
          tip.y >= box.y && tip.y <= box.y + box.h) {
        o.grabbed = true;
        hook.grabbed = o;

        if (o.type === "gold") {
          hook.imageKey =
            o.image === "vang_1.png" ? "gapvang_1.png" :
            o.image === "vang_3.png" ? "gapvang_3.png" :
            "gapvang_4.png";
        } else if (o.type === "rock") {
          hook.imageKey = "gapda_1.png";
        } else if (o.type === "pig") {
          hook.imageKey = "gappig.png";
        } else if (o.type === "tnt") {
          hook.imageKey = "gaptnt.png";
        }

        hook.state = "in";
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (state === "loading") {
      drawLoading();
      return;
    }

    if (state === "menu") {
      drawMenu();
      return;
    }

    drawGame();

    if (state === "gameover") {
      drawGameOver();
    }
  }

  function drawLoading() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Loading... ${loaded}/${imageNames.length}`, W / 2, H / 2);
  }

  function drawMenu() {
    const bg = images["startMenu.png"];
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    else {
      ctx.fillStyle = "#9a5b18";
      ctx.fillRect(0, 0, W, H);
    }

    const start = images["button_start.png"];
    if (start) {
      ctx.drawImage(start, 50, 50);
    }

    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(0, 535, W, 65);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CLICK START OR PRESS SPACE", W / 2, 575);
  }

  function drawGame() {
    const bg2 = images["bg2.png"];
    const bg = images["bg.png"];

    if (bg2) ctx.drawImage(bg2, 0, 0, W, 150);
    else {
      ctx.fillStyle = "#d59b49";
      ctx.fillRect(0, 0, W, 150);
    }

    if (bg) {
      // The original Java draws bg at y=150. Scale it into the 800x450 play area.
      ctx.drawImage(bg, 0, 150, W, H - 150);
    } else {
      ctx.fillStyle = "#8a5523";
      ctx.fillRect(0, 150, W, H - 150);
    }

    // Player
    const player = images["player.png"];
    if (player) {
      ctx.drawImage(player, 300, 24);
    }

    // Objects
    for (const o of objects) {
      if (!o.alive || o.grabbed) continue;
      const img = images[o.image];
      if (img) ctx.drawImage(img, o.x, o.y);
    }

    drawHook();
    drawHud();
  }

  function drawHook() {
    updateHookTip();

    ctx.save();
    ctx.translate(HOOK_PIVOT.x, HOOK_PIVOT.y);
    ctx.rotate(hook.angle);

    ctx.fillStyle = "#222";
    ctx.fillRect(-1, 0, 2, hook.length);

    ctx.restore();

    const hookImg = images[hook.imageKey] || images["moc.png"];
    if (hookImg) {
      const x = hook.tipX - hookImg.width / 2;
      const y = hook.tipY - hookImg.height / 2;
      ctx.drawImage(hookImg, x, y);
    }

    if (hook.grabbed) {
      const o = hook.grabbed;
      const img = images[o.image];
      if (img) {
        ctx.drawImage(img, hook.tipX - img.width / 2, hook.tipY - img.height / 2);
      }
    }
  }

  function drawHud() {
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.fillRect(8, 8, 250, 58);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`GOLD: ${score}`, 18, 31);
    ctx.fillText(`GOAL: ${target}`, 18, 54);

    ctx.textAlign = "right";
    ctx.fillText(`TIME: ${Math.ceil(timeLeft)}`, 245, 31);

    ctx.fillStyle = timeLeft <= 10 ? "#ff5252" : "#fff";
    ctx.fillText(`LEVEL: ${Math.floor((target - 1000) / 750) + 1}`, 245, 54);
  }

  function drawGameOver() {
    const overlay = images["gameover.png"];
    if (overlay) {
      ctx.drawImage(overlay, 0, 0, W, H);
    } else {
      ctx.fillStyle = "rgba(0,0,0,.72)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 52px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", W / 2, 250);
    }

    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(175, 330, 450, 105);
    ctx.fillStyle = "#ffd54a";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Score: ${score} / ${target}`, W / 2, 370);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Press PLAY AGAIN or SPACE", W / 2, 408);
  }

  function loop(now) {
    const dt = Math.min((now - lastTime) / 1000 || 0, 0.033);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dropHook();
  });

  actionButton.addEventListener("click", dropHook);
  restartButton.addEventListener("click", startGame);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      dropHook();
    }
  });

  (async () => {
    await loadImages();
    state = "menu";
    draw();
    requestAnimationFrame(loop);
  })();
})();
