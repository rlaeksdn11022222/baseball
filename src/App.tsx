import { useEffect, useRef, useState } from "react";
import "./App.css";

const WEAPONS = [
  { id: 0, name: "글러브", img: "/glove.png", damage: 1, price: 0, desc: "기본 무기" },
  { id: 1, name: "후라이팬", img: "/weapon1.png", damage: 2, price: 30, desc: "데미지 x2" },
  { id: 2, name: "좀쌘 망치", img: "/weapon2.png", damage: 4, price: 80, desc: "데미지 x4" },
  { id: 3, name: "ㅈㄴ쌘거", img: "/weapon3.png", damage: 8, price: 200, desc: "데미지 x8" },
];

const PHASES = 3;
const BASE_HP = 20;
const PLAYER_MAX_HP = 100;
const HP_DRAIN_RATE = 0.01;

type Particle = { x: number; y: number; vx: number; vy: number; life: number };
type Popup = { x: number; y: number; life: number; text: string };
type CoinPopup = { x: number; y: number; life: number };

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showShop, setShowShop] = useState(false);
  const [showPhaseBtn, setShowPhaseBtn] = useState(false);
  const [coins, setCoins] = useState(0);
  const [ownedWeapons, setOwnedWeapons] = useState<number[]>([0]);
  const [equippedWeapon, setEquippedWeapon] = useState(0);

  const coinsRef = useRef(0);
  const ownedRef = useRef<number[]>([0]);
  const equippedRef = useRef(0);
  const showShopRef = useRef(false);
  const nextPhaseRef = useRef<() => void>(() => {});

  useEffect(() => {
    coinsRef.current = coins;
  }, [coins]);

  useEffect(() => {
    ownedRef.current = ownedWeapons;
  }, [ownedWeapons]);

  useEffect(() => {
    equippedRef.current = equippedWeapon;
  }, [equippedWeapon]);

  useEffect(() => {
    showShopRef.current = showShop;
  }, [showShop]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const cowImgs = [new Image(), new Image(), new Image()];
    cowImgs[0].src = "/cow1.png";
    cowImgs[1].src = "/cow2.png";
    cowImgs[2].src = "/cow3.png";

    const weaponImgs = WEAPONS.map((w) => {
      const img = new Image();
      img.src = w.img;
      return img;
    });

    const coinImg = new Image();
    coinImg.src = "/coin.png";

    let phase = 0;
    let bossHp = BASE_HP;
    let bossMaxHp = BASE_HP;
    let playerHp = PLAYER_MAX_HP;
    let score = 0;
    let shake = 0;
    let mouseX = 0;
    let mouseY = 0;
    let laserTimer = 0;
    let dead = false;
    let bossDead = false;
    let running = true;
    let rafId = 0;
    let deathTimeout: number | undefined;

    const particles: Particle[] = [];
    const scorePopups: Popup[] = [];
    const coinPopups: CoinPopup[] = [];
    let phaseAnim = 0;
    let phaseAnimText = "";

    const cow = { x: canvas.width / 2, y: canvas.height / 2, r: 100, t: 0 };

    const syncPhaseButton = () => {
      setShowPhaseBtn(bossDead);
    };

    nextPhaseRef.current = () => {
      if (!bossDead) return;

      phase++;
      if (phase >= PHASES) {
        alert("모든 보스 처치! 완전 정복 ㅋㅋ");
        location.reload();
        return;
      }

      bossMaxHp = BASE_HP + phase * 15;
      bossHp = bossMaxHp;
      bossDead = false;
      phaseAnim = 100;
      phaseAnimText = `PHASE ${phase + 1}`;
      syncPhaseButton();
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onClick = (e: MouseEvent) => {
      if (dead || bossDead || showShopRef.current) return;

      const d = Math.hypot(e.clientX - cow.x, e.clientY - cow.y);
      if (d >= cow.r) return;

      const dmg = WEAPONS[equippedRef.current].damage;
      score++;
      bossHp = Math.max(0, bossHp - dmg);
      shake = 15;
      laserTimer = 10;

      const earned = Math.floor(Math.random() * dmg) + 1;
      coinsRef.current += earned;
      coinsRef.current = Math.max(0, coinsRef.current);
      setCoins(coinsRef.current);

      coinPopups.push({
        x: cow.x + (Math.random() - 0.5) * 80,
        y: cow.y - cow.r - 30,
        life: 50,
      });

      scorePopups.push({
        x: cow.x + (Math.random() - 0.5) * 60,
        y: cow.y - cow.r - 10,
        life: 40,
        text: `-${dmg}`,
      });

      for (let i = 0; i < 20; i++) {
        particles.push({
          x: cow.x,
          y: cow.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 40,
        });
      }

      if (bossHp <= 0) {
        bossDead = true;
        syncPhaseButton();
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

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

    function drawBossHpBar() {
      const barW = cow.r * 2.8;
      const barH = 20;
      const barX = cow.x - barW / 2;
      const barY = cow.y + cow.r + 16;
      const ratio = Math.max(0, bossHp / bossMaxHp);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundedRectPath(ctx, barX - 2, barY - 2, barW + 4, barH + 4, 10);
      ctx.fill();

      ctx.fillStyle = `rgb(${Math.floor(255 * (1 - ratio))},${Math.floor(200 * ratio)},40)`;
      roundedRectPath(ctx, barX, barY, barW * ratio, barH, 8);
      ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      roundedRectPath(ctx, barX, barY, barW, barH, 8);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`BOSS HP  ${bossHp} / ${bossMaxHp}`, barX + barW / 2, barY + 14);
      ctx.textAlign = "left";
    }

    function drawPlayerHpBar() {
      const barW = 280;
      const barH = 22;
      const barX = 16;
      const barY = canvas.height - 50;
      const ratio = Math.max(0, playerHp / PLAYER_MAX_HP);

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      roundedRectPath(ctx, barX - 2, barY - 2, barW + 4, barH + 4, 10);
      ctx.fill();

      ctx.fillStyle = `rgb(${Math.floor(255 * (1 - ratio))},${Math.floor(200 * ratio)},40)`;
      roundedRectPath(ctx, barX, barY, barW * ratio, barH, 8);
      ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      roundedRectPath(ctx, barX, barY, barW, barH, 8);
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`❤️ HP  ${Math.ceil(playerHp)} / ${PLAYER_MAX_HP}`, barX + barW / 2, barY + 15);
      ctx.textAlign = "left";
    }

    function drawScoreUI() {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundedRectPath(ctx, 16, 16, 200, 70, 14);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1.5;
      roundedRectPath(ctx, 16, 16, 200, 70, 14);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px sans-serif";
      ctx.fillText("SCORE", 32, 36);

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${score}`, 32, 72);

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundedRectPath(ctx, 228, 16, 90, 70, 14);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "13px sans-serif";
      ctx.fillText("PHASE", 242, 36);

      ctx.fillStyle = "#FF6B6B";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${phase + 1}`, 252, 72);

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundedRectPath(ctx, 16, 100, 220, 50, 12);
      ctx.fill();

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`⚔️ ${WEAPONS[equippedRef.current].name}  (x${WEAPONS[equippedRef.current].damage} 데미지)`, 28, 130);
    }

    function drawPhaseAnim() {
      if (phaseAnim <= 0) return;

      const progress = phaseAnim / 100;
      const alpha = progress > 0.7 ? (1 - progress) / 0.3 : progress > 0.3 ? 1 : progress / 0.3;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(1 + (1 - progress) * 0.4, 1 + (1 - progress) * 0.4);

      ctx.fillStyle = `rgba(255,100,0,${alpha * 0.15})`;
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

    function drawPopups() {
      for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        ctx.save();
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = "#FF4444";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();

        p.y -= 1.5;
        p.life--;
        if (p.life <= 0) scorePopups.splice(i, 1);
      }

      for (let i = coinPopups.length - 1; i >= 0; i--) {
        const p = coinPopups[i];
        ctx.save();
        ctx.globalAlpha = p.life / 50;
        if (coinImg.complete) {
          ctx.drawImage(coinImg, p.x - 12, p.y - 12, 24, 24);
        } else {
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+코인", p.x + 20, p.y + 6);
        ctx.restore();

        p.y -= 1.2;
        p.life--;
        if (p.life <= 0) coinPopups.splice(i, 1);
      }
    }

    function drawDead() {
      ctx.fillStyle = "rgba(200,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 80px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💀 사망!", canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = "30px sans-serif";
      ctx.fillText("이전 페이즈로 돌아갑니다...", canvas.width / 2, canvas.height / 2 + 50);
      ctx.textAlign = "left";
    }

    const loop = () => {
      if (!running) return;

      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        shake--;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!dead) {
        playerHp -= HP_DRAIN_RATE;
        if (playerHp <= 0) {
          playerHp = 0;
          dead = true;

          deathTimeout = window.setTimeout(() => {
            phase = Math.max(0, phase - 1);
            bossMaxHp = BASE_HP + phase * 15;
            bossHp = bossMaxHp;
            playerHp = PLAYER_MAX_HP;
            bossDead = false;
            dead = false;
            setShowPhaseBtn(false);
          }, 2500);
        }

        const speed = 0.05 + score * 0.001;
        cow.t += speed;
        cow.x = canvas.width / 2 + Math.sin(cow.t) * (120 + phase * 30);

        const size = cow.r * 2;
        const currentCow = cowImgs[phase % PHASES];
        if (currentCow.complete) {
          ctx.drawImage(currentCow, cow.x - cow.r, cow.y - cow.r, size, size);
        } else {
          ctx.fillStyle = "#ff9fb3";
          ctx.beginPath();
          ctx.arc(cow.x, cow.y, cow.r, 0, Math.PI * 2);
          ctx.fill();
        }

        drawBossHpBar();
        drawLaser();

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life--;

          ctx.fillStyle = `rgba(255,220,0,${p.life / 40})`;
          ctx.fillRect(p.x, p.y, 5, 5);

          if (p.life <= 0) particles.splice(i, 1);
        }

        drawPopups();

        const weaponImg = weaponImgs[equippedRef.current];
        if (weaponImg.complete) {
          ctx.drawImage(weaponImg, mouseX - 30, mouseY - 30, 60, 60);
        } else {
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(mouseX, mouseY, 18, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        drawScoreUI();
        drawPhaseAnim();
        drawPlayerHpBar();
      } else {
        ctx.restore();
        drawDead();
      }

      rafId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      if (deathTimeout) window.clearTimeout(deathTimeout);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const openShop = () => setShowShop(true);
  const closeShop = () => setShowShop(false);

  const buyWeapon = (id: number) => {
    const w = WEAPONS[id];
    if (coinsRef.current < w.price || ownedRef.current.includes(id)) return;

    coinsRef.current -= w.price;
    setCoins(coinsRef.current);

    const nextOwned = [...ownedRef.current, id];
    ownedRef.current = nextOwned;
    setOwnedWeapons(nextOwned);
  };

  const equipWeapon = (id: number) => {
    if (!ownedRef.current.includes(id)) return;
    equippedRef.current = id;
    setEquippedWeapon(id);
  };

  return (
    <>
      <canvas ref={canvasRef} />

      <button id="shop-btn" className="open-shop-btn" onClick={openShop}>
        🛒 상점  💰{coins}
      </button>

      {showPhaseBtn && (
        <div id="phase-btn" className="phase-btn-overlay">
          <button className="phase-btn" onClick={() => nextPhaseRef.current()}>
            🎉 보스 처치! 다음 페이즈 진행하기
          </button>
        </div>
      )}

      {showShop && (
        <div id="shop-modal" className="shop-overlay">
          <div className="shop-box">
            <h2>🛒 무기 상점</h2>
            <p id="shop-coin-display" className="shop-coin">
              💰 보유 코인 : {coins}
            </p>

            <div id="shop-items" className="shop-items">
              {WEAPONS.map((w) => {
                const isOwned = ownedWeapons.includes(w.id);
                const isEquipped = equippedWeapon === w.id;

                return (
                  <div
                    key={w.id}
                    className={`shop-item${isEquipped ? " selected" : ""}${isOwned ? " owned" : ""}`}
                  >
                    <img src={w.img} alt={w.name} />
                    <div className="shop-item-info">
                      <h3>{w.name}</h3>
                      <p>
                        {w.desc} | {w.price === 0 ? "기본 지급" : `💰 ${w.price} 코인`}
                      </p>
                    </div>

                    {!isOwned ? (
                      <button
                        className="shop-item-btn buy"
                        disabled={coins < w.price}
                        onClick={() => buyWeapon(w.id)}
                      >
                        구매
                      </button>
                    ) : isEquipped ? (
                      <button className="shop-item-btn equipped" disabled>
                        장착중
                      </button>
                    ) : (
                      <button className="shop-item-btn equip" onClick={() => equipWeapon(w.id)}>
                        장착
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button id="shop-close" className="shop-close" onClick={closeShop}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}