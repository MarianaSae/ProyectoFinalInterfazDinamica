// js/game.js

class DinoPlayer {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.baseY = y;
    this.color = color || "#ffb703";
    this.velY = 0;
    this.gravity = 0.6;
    this.jumpStrength = -11;
    this.isOnGround = true;
  }

  jump() {
    if (this.isOnGround) {
      this.velY = this.jumpStrength;
      this.isOnGround = false;
    }
  }

  update() {
    this.y += this.velY;
    this.velY += this.gravity;

    if (this.y >= this.baseY) {
      this.y = this.baseY;
      this.velY = 0;
      this.isOnGround = true;
    }
  }

  draw(ctx) {
    // cuerpo principal como una bolita
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const radius = Math.min(this.width, this.height) / 2;

    // cuerpo
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, radius, 0, Math.PI * 2);
    ctx.fill();

    // patas
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - radius / 2, this.y + this.height);
    ctx.lineTo(cx - radius / 2, this.y + this.height + 8);
    ctx.moveTo(cx + radius / 2, this.y + this.height);
    ctx.lineTo(cx + radius / 2, this.y + this.height + 8);
    ctx.stroke();

    // ojito
    ctx.fillStyle = "#22223b";
    ctx.beginPath();
    ctx.arc(cx + radius / 3, cy - 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    };
  }
}

class Obstacle {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
  }

  update() {
    this.x -= this.speed;
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  draw(ctx) {
    // Dibuja una banana caricaturesca
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(-0.4);
    ctx.strokeStyle = "#f4b41a";
    ctx.lineWidth = Math.max(6, this.height / 4);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, this.height / 2, 0.3 * Math.PI, 1.3 * Math.PI);
    ctx.stroke();

    // puntitas más oscuras
    ctx.strokeStyle = "#e09f14";
    ctx.beginPath();
    ctx.arc(0, 0, this.height / 2, 0.3 * Math.PI, 0.45 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, this.height / 2, 1.15 * Math.PI, 1.3 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      w: this.width,
      h: this.height
    };
  }
}

class DinoGame {
  constructor(canvas, { onScoreChange, onLivesChange, onLevelChange, onGameOver }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onScoreChange = onScoreChange;
    this.onLivesChange = onLivesChange;
    this.onLevelChange = onLevelChange;
    this.onGameOver = onGameOver;

    this.player = null;
    this.obstacles = [];
    this.isRunning = false;
    this.score = 0;
    this.lives = 3;
    this.level = 1;

    this.groundY = canvas.height - 70;
    this.baseObstacleSpeed = 6.5;
    this.spawnInterval = 85;
    this.frameCount = 0;
    this.animationFrameId = null;
    this.playerColor = "#ffb703";
  }

  setPlayerColor(color) {
    this.playerColor = color || "#ffb703";
  }

  start() {
    this.reset();
    this.isRunning = true;
    this.loop();
  }

  reset() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.obstacles = [];
    this.frameCount = 0;
    this.player = new DinoPlayer(90, this.groundY - 42, 42, 42, this.playerColor);
    this.notifyHUD();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  notifyHUD() {
    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onLivesChange) this.onLivesChange(this.lives);
    if (this.onLevelChange) this.onLevelChange(this.level);
  }

  handleInput() {
    if (!this.isRunning) return;
    this.player.jump();
  }

  updateDifficulty() {
    if (this.score > 500 && this.level === 1) {
      this.level = 2;
      this.baseObstacleSpeed = 8;
      this.spawnInterval = 70;
    } else if (this.score > 1000 && this.level === 2) {
      this.level = 3;
      this.baseObstacleSpeed = 10;
      this.spawnInterval = 55;
    }
  }

  spawnObstacle() {
    const height = 40 + Math.random() * 26;
    const width = 26 + Math.random() * 20;
    const x = this.canvas.width + 30;
    const y = this.groundY - height + 10;
    const speed = this.baseObstacleSpeed + Math.random() * 2;
    this.obstacles.push(new Obstacle(x, y, width, height, speed));
  }

  checkCollisions() {
    const p = this.player.getBounds();
    for (const obs of this.obstacles) {
      const o = obs.getBounds();
      const intersect =
        p.x < o.x + o.w &&
        p.x + p.w > o.x &&
        p.y < o.y + o.h &&
        p.y + p.h > o.y;

      if (intersect) {
        return true;
      }
    }
    return false;
  }

  renderGround() {
    const ctx = this.ctx;

    // línea de suelo
    ctx.strokeStyle = "#c2cbdc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY + 0.5);
    ctx.lineTo(this.canvas.width, this.groundY + 0.5);
    ctx.stroke();

    // pequeñas marcas tipo pasto/piedras
    ctx.strokeStyle = "#d6deef";
    for (let i = 0; i < this.canvas.width; i += 28) {
      ctx.beginPath();
      ctx.moveTo(i, this.groundY + 3);
      ctx.lineTo(i + 10, this.groundY + 10);
      ctx.stroke();
    }
  }

  loop = () => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    // UPDATE
    this.frameCount++;
    this.score += 1;
    this.updateDifficulty();

    if (this.frameCount % this.spawnInterval === 0) {
      this.spawnObstacle();
    }

    this.player.update();
    this.obstacles.forEach((o) => o.update());
    this.obstacles = this.obstacles.filter((o) => !o.isOffScreen());

    if (this.checkCollisions()) {
      this.lives -= 1;
      this.obstacles = [];
      this.player.y = this.player.baseY;
      this.player.velY = 0;
      this.player.isOnGround = true;

      if (this.lives <= 0) {
        this.notifyHUD();
        this.stop();
        const result = this.score >= 1000 ? "ganó" : "perdió";
        if (this.onGameOver) {
          this.onGameOver(this.score, result);
        }
        return;
      }
    }

    this.notifyHUD();

    // DRAW
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // cielo suave
    const grd = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grd.addColorStop(0, "#f4f9ff");
    grd.addColorStop(1, "#fdf6e9");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderBackgroundDecor();
    this.renderGround();
    this.player.draw(ctx);
    this.obstacles.forEach((o) => o.draw(ctx));
  };

  renderBackgroundDecor() {
    const ctx = this.ctx;

    // colinas suaves
    ctx.fillStyle = "#ddebf8";
    ctx.beginPath();
    ctx.moveTo(0, this.groundY + 5);
    ctx.quadraticCurveTo(
      this.canvas.width * 0.25,
      this.groundY - 40,
      this.canvas.width * 0.5,
      this.groundY + 10
    );
    ctx.quadraticCurveTo(
      this.canvas.width * 0.75,
      this.groundY - 35,
      this.canvas.width,
      this.groundY + 5
    );
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.lineTo(0, this.canvas.height);
    ctx.closePath();
    ctx.fill();

    // sol
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    ctx.arc(this.canvas.width - 80, 60, 30, 0, Math.PI * 2);
    ctx.fill();

    // nubecitas
    ctx.fillStyle = "#ffffffee";
    const clouds = [
      { x: 120, y: 60, r: 18 },
      { x: 150, y: 55, r: 14 },
      { x: 180, y: 62, r: 16 },
      { x: 260, y: 40, r: 15 },
      { x: 285, y: 38, r: 12 },
      { x: 305, y: 46, r: 13 }
    ];
    clouds.forEach((c) => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
