import { useEffect, useRef, useState } from "react";
import "./App.css";

const WEAPONS = [
  { id: 0, name: "글러브",    img: "/glove.png",   damage: 1, price: 0,   desc: "기본 무기" },
  { id: 1, name: "후라이팬",  img: "/weapon1.png", damage: 2, price: 30,  desc: "데미지 x2" },
  { id: 2, name: "좀쌘 망치", img: "/weapon2.png", damage: 4, price: 80,  desc: "데미지 x4" },
  { id: 3, name: "ㅈㄴ쌘거",  img: "/weapon3.png", damage: 8, price: 200, desc: "데미지 x8" },
];

const PHASES        = 3;
const BASE_HP       = 20;
const PLAYER_MAX_HP = 100;
const HP_DRAIN_RATE = 0.01;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showShop,       setShowShop]       = useState(false);
  const [showPhaseBtn,   setShowPhaseBtn]   = useState(false);
  const [coins,          setCoins]          = useState(0);
  const [ownedWeapons,   setOwnedWeapons]   = useState<number[]>([0]);
  const [equippedWeapon, setEquippedWeapon] = useState(0);

  // 게임 루프에서 쓰는 ref들 (setState 호출 없이)
  const equippedRef     = useRef(0);
  const coinsRef        = useRef(0);
  const ownedRef        = useRef<number[]>([0]);
  const phaseBtnRef     = useRef(false);
  const showPhaseBtnSet = useRef(setShowPhaseBtn);

  useEffect(() => { equippedRef.current = equippedWeapon; }, [equippedWeapon]);
  useEffect(() => { ownedRef.current    = ownedWeapons;   }, [ownedWeapons]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const cowImgs    = [new Image(), new Image(), new Image()];
    cowImgs[0].src   = "/cow1.png";
    cowImgs[1].src   = "/cow2.png";
    cowImgs[2].src   = "/cow3.png";
    const weaponImgs = WEAPONS.map(w => { const i = new Image(); i.src = w.img; return i; });
    const coinImg    = new Image(); coinImg.src = "/coin.png";

    let phase      = 0;
    let bossHp     = BASE_HP;
    let bossMaxHp  = BASE_HP;
    let playerHp   = PLAYER_MAX_HP;
    let score      = 0;
    let shake      = 0;
    let mouseX     = 0;
    let mouseY     = 0;
    let laserTimer = 0;
    let dead       = false;
    let bossDead   = false;
    let running    = true;
    let rafId      = 0;

    const particles:   any[] = [];
    const scorePopups: { x: number; y: number; life: number; text: string }[] = [];
    const coinPopups:  { x: number; y: number; life: number }[] = [];
    let phaseAnim     = 0;
    let phaseAnimText = "";

    const cow = { x: canvas.width / 2, y: canvas.height / 2, r: 100, t: 0 };

    const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    const onClick     = (e: MouseEvent) => {
      if (dead || bossDead) return;
      const d = Math.hypot(e.clientX - cow.x, e.clientY - cow.y);
      if (d < cow.r) {
        const dmg = WEAPONS[equippedRef.current].damage;
        score++;
        bossHp     = Math.max(0, bossHp - dmg);
        shake      = 15;
        laserTimer = 10;

        // 코인은 ref만 업데이트 (setState 안 씀!)
        const earned = Math.floor(Math.random() * dmg) + 1;
        coinsRef.current += earned;

        coinPopups.push({ x: cow.x + (Math.random()-0.5)*80, y: cow.y - cow.r - 30, life: 50 });
        scorePopups.push({ x: cow.x + (Math.random()-0.5)*60, y: cow.y - cow.r - 10, life: 40, text: `-${dmg}` });

        for (let i = 0; i < 20; i++) {
          particles.push({ x: cow.x, y: cow.y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 40 });
        }

        if (bossHp <= 0) {
          bossDead = true;
          phaseBtnRef.current = true;
          showPhaseBtnSet.current(true);  // 이건 한 번만 호출
        }
      }
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click",     onClick);

    (window as any).__nextPhase = () => {
      if (!bossDead) return;
      phase++;
      if (phase >= PHASES) {
        alert("모든 보스 처치! 완전 정복 ㅋㅋ");
        location.reload();
        return;
      }
      bossMaxHp     = BASE_HP + phase * 15;
      bossHp        = bossMaxHp;
      bossDead      = false;
      phaseAnim     = 100;
      phaseAnimText = `PHASE ${phase + 1}`;
      phaseBtnRef.current = false;
      showPhaseBtnSet.current(false);
    };

    /* ── 그리기 함수 ── */
    function drawLaser() {
      if (laserTimer <= 0) return;
      ctx.strokeStyle = "red"; ctx.lineWidth = 5;
      ctx.shadowBlur = 20; ctx.shadowColor = "red";
      ctx.beginPath(); ctx.moveTo(cow.x-30, cow.y-20); ctx.lineTo(cow.x-30, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cow.x+30, cow.y-20); ctx.lineTo(cow.x+30, 0); ctx.stroke();
      ctx.shadowBlur = 0;
      laserTimer--;
    }

    function drawBossHpBar() {
      const barW = cow.r * 2.8, barH = 20;
      const barX = cow.x - barW/2, barY = cow.y + cow.r + 16;
      const ratio = Math.max(0, bossHp / bossMaxHp);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath(); ctx.roundRect(barX-2, barY-2, barW+4, barH+4, 10); ctx.fill();
      ctx.fillStyle = `rgb(${Math.floor(255*(1-ratio))},${Math.floor(200*ratio)},40)`;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW*ratio, barH, 8); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`BOSS HP  ${bossHp} / ${bossMaxHp}`, barX+barW/2, barY+14);
      ctx.textAlign = "left";
    }

    function drawPlayerHpBar() {
      const barW = 280, barH = 22, barX = 16, barY = canvas.height - 50;
      const ratio = Math.max(0, playerHp / PLAYER_MAX_HP);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.roundRect(barX-2, barY-2, barW+4, barH+4, 10); ctx.fill();
      ctx.fillStyle = `rgb(${Math.floor(255*(1-ratio))},${Math.floor(200*ratio)},40)`;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW*ratio, barH, 8); ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.stroke();
      ctx.fillStyle = "white"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(`❤️ HP  ${Math.ceil(playerHp)} / ${PLAYER_MAX_HP}`, barX+barW/2, barY+15);
      ctx.textAlign = "left";
    }

    function drawScoreUI() {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(16, 16, 200, 70, 14); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(16, 16, 200, 70, 14); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "14px sans-serif";
      ctx.fillText("SCORE", 32, 36);
      ctx.fillStyle = "#FFD700"; ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${score}`, 32, 72);

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(228, 16, 90, 70, 14); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "13px sans-serif";
      ctx.fillText("PHASE", 242, 36);
      ctx.fillStyle = "#FF6B6B"; ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${phase+1}`, 252, 72);

      // 코인 표시 (ref 값으로)
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(16, 100, 200, 50, 12); ctx.fill();
      ctx.fillStyle = "#FFD700"; ctx.font = "bold 14px sans-serif";
      ctx.fillText(`💰 ${coinsRef.current}코인  ⚔️ ${WEAPONS[equippedRef.current].name}`, 28, 130);
    }

    function drawPhaseAnim() {
      if (phaseAnim <= 0) return;
      const progress = phaseAnim / 100;
      const alpha = progress > 0.7 ? (1-progress)/0.3 : progress > 0.3 ? 1 : progress/0.3;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.scale(1+(1-progress)*0.4, 1+(1-progress)*0.4);
      ctx.fillStyle = `rgba(255,100,0,${alpha*0.15})`;
      ctx.fillRect(-canvas.width,-canvas.height,canvas.width*2,canvas.height*2);
      ctx.font = "bold 100px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.strokeStyle = "black"; ctx.lineWidth = 12; ctx.strokeText(phaseAnimText, 0, 0);
      const grad = ctx.createLinearGradient(0,-50,0,50);
      grad.addColorStop(0,"#FFD700"); grad.addColorStop(1,"#FF6B00");
      ctx.fillStyle = grad; ctx.fillText(phaseAnimText, 0, 0);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.restore();
      phaseAnim--;
    }

    function drawPopups() {
      scorePopups.forEach((p, i) => {
        ctx.save(); ctx.globalAlpha = p.life/40;
        ctx.fillStyle = "#FF4444"; ctx.font = "bold 26px sans-serif"; ctx.textAlign = "center";
        ctx.strokeStyle = "black"; ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x, p.y); ctx.fillText(p.text, p.x, p.y);
        ctx.restore(); p.y -= 1.5; p.life--;
        if (p.life <= 0) scorePopups.splice(i, 1);
      });
      coinPopups.forEach((p, i) => {
        ctx.save(); ctx.globalAlpha = p.life/50;
        ctx.drawImage(coinImg, p.x-12, p.y-12, 24, 24);
        ctx.fillStyle = "#FFD700"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("+코인", p.x+20, p.y+6);
        ctx.restore(); p.y -= 1.2; p.life--;
        if (p.life <= 0) coinPopups.splice(i, 1);
      });
    }

    function drawDead() {
      ctx.fillStyle = "rgba(200,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white"; ctx.font = "bold 80px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("💀 사망!", canvas.width/2, canvas.height/2 - 20);
      ctx.font = "30px sans-serif";
      ctx.fillText("이전 페이즈로 돌아갑니다...", canvas.width/2, canvas.height/2+50);
      ctx.textAlign = "left";
    }

    /* ── 게임 루프 ── */
    const loop = () => {
      if (!running) return;
      ctx.save();
      if (shake > 0) { ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake); shake--; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!dead) {
        playerHp -= HP_DRAIN_RATE;
        if (playerHp <= 0) {
          playerHp = 0; dead = true;
          setTimeout(() => {
            phase     = Math.max(0, phase - 1);
            bossMaxHp = BASE_HP + phase * 15;
            bossHp    = bossMaxHp;
            playerHp  = PLAYER_MAX_HP;
            bossDead  = false;
            dead      = false;
            phaseBtnRef.current = false;
            showPhaseBtnSet.current(false);
          }, 2500);
        }

        const speed = 0.05 + score * 0.001;
        cow.t += speed;
        cow.x = canvas.width/2 + Math.sin(cow.t) * (120 + phase*30);

        const size = cow.r * 2;
        ctx.drawImage(cowImgs[phase % PHASES], cow.x-cow.r, cow.y-cow.r, size, size);
        drawBossHpBar();
        drawLaser();

        particles.forEach((p, i) => {
          p.x += p.vx; p.y += p.vy; p.life--;
          ctx.fillStyle = `rgba(255,220,0,${p.life/40})`;
          ctx.fillRect(p.x, p.y, 5, 5);
          if (p.life <= 0) particles.splice(i, 1);
        });

        drawPopups();
        ctx.drawImage(weaponImgs[equippedRef.current], mouseX-30, mouseY-30, 60, 60);
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
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click",     onClick);
      window.removeEventListener("resize",    resize);
    };
  }, []);

  /* ── 상점 UI ── */
  const openShop = () => {
    setCoins(coinsRef.current);  // 상점 열 때만 동기화!
    setShowShop(true);
  };

  const buyWeapon = (id: number) => {
    const w = WEAPONS[id];
    if (coinsRef.current < w.price || ownedRef.current.includes(id)) return;
    coinsRef.current -= w.price;
    setCoins(coinsRef.current);
    setOwnedWeapons(o => { const n = [...o, id]; ownedRef.current = n; return n; });
  };

  const equipWeapon = (id: number) => {
    if (!ownedRef.current.includes(id)) return;
    equippedRef.current = id;
    setEquippedWeapon(id);
  };

  return (
    <>
      <canvas ref={canvasRef} />

      <button className="open-shop-btn" onClick={openShop}>
        🛒 상점  💰{coins}
      </button>

      {showPhaseBtn && (
        <div className="phase-btn-overlay">
          <button className="phase-btn" onClick={() => (window as any).__nextPhase()}>
            🎉 보스 처치! 다음 페이즈 진행하기
          </button>
        </div>
      )}

      {showShop && (
        <div className="shop-overlay">
          <div className="shop-box">
            <h2>🛒 무기 상점</h2>
            <p className="shop-coin">💰 보유 코인 : {coins}</p>
            <div className="shop-items">
              {WEAPONS.map(w => {
                const owned    = ownedWeapons.includes(w.id);
                const equipped = equippedWeapon === w.id;
                return (
                  <div key={w.id} className={`shop-item ${equipped ? "selected" : ""} ${owned ? "owned" : ""}`}>
                    <img src={w.img} alt={w.name} />
                    <div className="shop-item-info">
                      <h3>{w.name}</h3>
                      <p>{w.desc}  |  {w.price === 0 ? "기본 지급" : `💰 ${w.price} 코인`}</p>
                    </div>
                    {!owned ? (
                      <button className="shop-item-btn buy" disabled={coins < w.price} onClick={() => buyWeapon(w.id)}>구매</button>
                    ) : equipped ? (
                      <button className="shop-item-btn equipped" disabled>장착중</button>
                    ) : (
                      <button className="shop-item-btn equip" onClick={() => equipWeapon(w.id)}>장착</button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="shop-close" onClick={() => setShowShop(false)}>닫기</button>
          </div>
        </div>
      )}
    </>
  );
}