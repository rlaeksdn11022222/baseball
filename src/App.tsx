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

    /* ===== 이미지 ===== */
    const cows = [
      new Image(),
      new Image(),
      new Image(),
    ];
    cows[0].src = "/cow1.png";
    cows[1].src = "/cow2.png";
    cows[2].src = "/cow3.png";

    const glove = new Image();
    glove.src = "/glove.png";

    /* ===== 상태 ===== */
    let score = 0;
    let shake = 0;
    let mouseX = 0;
    let mouseY = 0;

    let phase = 0;
    let hp = 20;

    let laserTimer = 0;

    const particles: any[] = [];

    const cow = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: 100,
      t: 0,
    };

    /* ===== 마우스 ===== */
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

        for (let i = 0; i < 25; i++) {
          particles.push({
            x: cow.x,
            y: cow.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40,
          });
        }

        /* 페이즈 변경 */
        if (hp <= 0) {
          phase++;
          hp = 20 + phase * 10;

          if (phase >= cows.length) {
            alert("소여준 완전 정복 ㅋㅋ");
            location.reload();
          }
        }
      }
    });

    /* ===== 레이저 ===== */
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

    /* ===== 루프 ===== */
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

      /* 속도 증가 */
      const speed = 0.05 + score * 0.002;
      cow.t += speed;
      cow.x = canvas.width / 2 + Math.sin(cow.t) * (120 + phase * 30);

      /* 얼굴 */
      const size = cow.r * 2;
      ctx.drawImage(
        cows[phase],
        cow.x - cow.r,
        cow.y - cow.r,
        size,
        size
      );

      /* 레이저 */
      drawLaser();

      /* 파티클 */
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = "yellow";
        ctx.fillRect(p.x, p.y, 4, 4);

        if (p.life <= 0) particles.splice(i, 1);
      });

      /* 주먹 */
      ctx.drawImage(glove, mouseX - 30, mouseY - 30, 60, 60);

      /* UI */
      ctx.fillStyle = "white";
      ctx.font = "28px sans-serif";
      ctx.fillText("점수: " + score, 20, 40);
      ctx.fillText("HP: " + hp, 20, 80);
      ctx.fillText("단계: " + (phase + 1), 20, 120);

      ctx.restore();
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