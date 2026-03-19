import { useEffect, useRef } from "react";
import "./App.css";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cows = [new Image(), new Image(), new Image()];
    cows[0].src = "/cow1.png";
    cows[1].src = "/cow2.png";
    cows[2].src = "/cow3.png";

    const glove = new Image();
    glove.src = "/glove.png";

    let score = 0;
    let shake = 0;
    let mouseX = 0;
    let mouseY = 0;
    let phase = 0;
    let hp = 20;
    let maxHp = 20;
    let laserTimer = 0;
    const particles: any[] = [];
    let phaseAnim = 0;
    let phaseAnimText = "";
    const scorePopups: { x: number; y: number; life: number }[] = [];

    const cow = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: 100,
      t: 0,
    };

    canvas.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    canvas.addEventListener("click", (e) => {
      const d = Math.hypot(e.clientX - cow.x, e.clientY - cow.y);
      if (d < cow.r) {
        score++;
        hp--;
        shake = 15;
        laserTimer = 10;

        scorePopups.push({
          x: cow.x + (Math.random() - 0.5) * 60,
          y: cow.y - cow.r - 10,
          life: 40,
        });

        for (let i = 0; i < 25; i++) {
          particles.push({
            x: cow.x,
            y: cow.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40,
          });
        }

        if (hp <= 0) {
          phase++;
          maxHp = 20 + phase * 10;
          hp = maxHp;

          if (phase >= cows.length) {
            alert("소여준 완전 정복 ㅋㅋ");
            location.reload();
          } else {
            phaseAnim = 90;
            phaseAnimText = `PHASE ${phase + 1}`;
          }
        }
      }
    });

    function drawLaser() {
      if (laserTimer <= 0) return;
      ctx.strokeStyle = "red";
      ctx.lineWidth = 5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "red";
      ctx.beginPath();
      ctx.moveTo(cow.x - 30, cow.y - 20);
      ctx.lineTo(cow.x - 30, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cow.x + 30, cow.y - 20);
      ctx.lineTo(cow.x + 30, 0);
      ctx.stroke();
      ctx.shadowBlur = 0;
      laserTimer--;
    }

    function drawHpBar() {
      const barW = cow.r * 2.5;
      const barH = 18;
      const barX = cow.x - barW / 2;
      const barY = cow.y + cow.r + 16;
      const ratio = Math.max(0, hp / maxHp);

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath();
      ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 10);
      ctx.fill();

      const r = Math.floor(255 * (1 - ratio));
      const g = Math.floor(200 * ratio);
      ctx.fillStyle = `rgb(${r},${g},40)`;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * ratio, barH, 8);
      ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 8);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`HP ${hp} / ${maxHp}`, barX + barW / 2, barY + 13);
      ctx.textAlign = "left";
    }

    function drawScoreUI() {
      const panelW = 200;
      const panelH = 70;
      const panelX = 16;
      const panelY = 16;

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 14);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 14);
      ctx.stroke();

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${score}`, panelX + 16, panelY + 46);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px sans-serif";
      ctx.fillText("SCORE", panelX + 16, panelY + 20);

      const badgeX = panelX + panelW + 12;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.roundRect(badgeX, panelY, 90, panelH, 14);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "13px sans-serif";
      ctx.fillText("PHASE", badgeX + 14, panelY + 20);

      ctx.fillStyle = "#FF6B6B";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${phase + 1}`, badgeX + 22, panelY + 46);
    }

    function drawPhaseAnim() {
      if (phaseAnim <= 0) return;

      const progress = phaseAnim / 90;
      let alpha;
      if (progress > 0.7) alpha = (1 - progress) / 0.3;
      else if (progress > 0.3) alpha = 1;
      else alpha = progress / 0.3;

      const scale = 1 + (1 - progress) * 0.5;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);

      ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.15})`;
      ctx.fillRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2);

      ctx.font = "bold 100px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 12;
      ctx.strokeText(phaseAnimText, 0, 0);

      const grad = ctx.createLinearGradient(0, -50, 0, 50);
      grad.addColorStop(0, "#FFD700");
      grad.addColorStop(1, "#FF6B00");
      ctx.fillStyle = grad;
      ctx.fillText(phaseAnimText, 0, 0);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.restore();

      phaseAnim--;
    }

    function drawScorePopups() {
      scorePopups.forEach((p, i) => {
        const alpha = p.life / 40;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 28px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText("+1", p.x, p.y);
        ctx.fillText("+1", p.x, p.y);
        ctx.restore();
        p.y -= 1.5;
        p.life--;
        if (p.life <= 0) scorePopups.splice(i, 1);
      });
    }

    const loop = () => {
      ctx.save();
      if (shake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * shake,
          (Math.random() - 0.5) * shake
        );
        shake--;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const speed = 0.05 + score * 0.002;
      cow.t += speed;
      cow.x = canvas.width / 2 + Math.sin(cow.t) * (120 + phase * 30);

      const size = cow.r * 2;
      ctx.drawImage(cows[phase], cow.x - cow.r, cow.y - cow.r, size, size);

      drawHpBar();
      drawLaser();

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = `rgba(255, 220, 0, ${p.life / 40})`;
        ctx.fillRect(p.x, p.y, 5, 5);
        if (p.life <= 0) particles.splice(i, 1);
      });

      drawScorePopups();

      ctx.drawImage(glove, mouseX - 30, mouseY - 30, 60, 60);
      ctx.restore();

      drawScoreUI();
      drawPhaseAnim();

      requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

export default App;