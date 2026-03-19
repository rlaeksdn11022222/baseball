import { useEffect, useRef, useState } from "react";
import "./App.css";

/* ── 무기 정의 ── */
const WEAPONS = [
  { id: 0, name: "글러브",   img: "/glove.png",   damage: 1, price: 0,   desc: "기본 무기" },
  { id: 1, name: "후라이팬",   img: "/weapon1.png", damage: 2, price: 30,  desc: "데미지 x2" },
  { id: 2, name: "좀쌘 망치",     img: "/weapon2.png", damage: 4, price: 80,  desc: "데미지 x4" },
  { id: 3, name: "ㅈㄴ쌘거",   img: "/weapon3.png", damage: 8, price: 200, desc: "데미지 x8" },
];

const PHASES = 3;
const BASE_HP = 20;
const PLAYER_MAX_HP = 100;
const HP_DRAIN_RATE = 0.01; // 초당 감소량 (rAF 기준)

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* ── React 상태 (UI용) ── */
  const [showShop, setShowShop]         = useState(false);
  const [showPhaseBtn, setShowPhaseBtn] = useState(false);
  const [coins, setCoins]               = useState(0);
  const [ownedWeapons, setOwnedWeapons] = useState<number[]>([0]);
  const [equippedWeapon, setEquippedWeapon] = useState(0);

  /* ── ref로 게임 루프에 최신값 공유 ── */
  const equippedRef   = useRef(0);
  const coinsRef      = useRef(0);
  const phaseBtnRef   = useRef(false);

  useEffect(() => { equippedRef.current = equippedWeapon; }, [equippedWeapon]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);
  useEffect(() => { phaseBtnRef.current = showPhaseBtn; }, [showPhaseBtn]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── 이미지 로드 ── */
    const cowImgs = [new Image(), new Image(), new Image()];
    cowImgs[0].src = "/cow1.png";
    cowImgs[1].src = "/cow2.png";
    cowImgs[2].src = "/cow3.png";

    const weaponImgs = WEAPONS.map(w => { const i = new Image(); i.src = w.img; return i; });
    const coinImg = new Image(); coinImg.src = "/coin.png";

    /* ── 게임 상태 ── */
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
    let bossDead   = false;  // 보스 처치 후 버튼 대기 상태

    const particles:   any[] = [];
    const scorePopups: { x: number; y: number; life: number; text: string }[] = [];
    let phaseAnim     = 0;
    let phaseAnimText = "";

    /* 코인 파티클 */
    const coinPopups: { x: number; y: number; life: number }[] = [];

    const cow = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      r: 100,
      t: 0,
    };

    /* ── 마우스 ── */
    canvas.addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

    canvas.addEventListener("click", (e) => {
      if (dead || bossDead) return;

      const d = Math.hypot(e.clientX - cow.x, e.clientY - cow.y);
      if (d < cow.r) {
        const dmg = WEAPONS[equippedRef.current].damage;
        score++;
        bossHp = Math.max(0, bossHp - dmg);
        shake      = 15;
        laserTimer = 10;

        // 코인 획득 (데미지만큼 확률적으로)
        const earned = Math.floor(Math.random() * dmg) + 1;
        coinsRef.current += earned;
        setCoins(c => c + earned);
        coinPopups.push({ x: cow.x + (Math.random()-0.5)*80, y: cow.y - cow.r - 30, life: 50 });

        scorePopups.push({
          x: cow.x + (Math.random()-0.5)*60,
          y: cow.y - cow.r - 10,
          life: 40,
          text: `-${dmg}`,
        });

        for (let i = 0; i < 20; i++) {
          particles.push({
            x: cow.x, y: cow.y,
            vx: (Math.random()-0.5)*8,
            vy: (Math.random()-0.5)*8,
            life: 40,
          });
        }

        // 보스 처치
        if (bossHp <= 0) {
          bossDead = true;
          setShowPhaseBtn(true);
        }
      }
    });

    /* ── 페이즈 넘어가기 (React에서 호출) ── */
    (window as any).__nextPhase = () => {
      if (!bossDead) return;
      phase++;
      if (phase >= PHASES) {
        alert("모든 보스 처치! 완전 정복 ㅋㅋ");
        location.reload();
        return;
      }
      bossMaxHp  = BASE_HP + phase * 15;
      bossHp     = bossMaxHp;
      bossDead   = false;
      phaseAnim  = 100;
      phaseAnimText = `PHASE ${phase + 1}`;
      setShowPhaseBtn(false);
    };

    /* ── 그리기 함수들 ── */
    function drawLaser() {
      if (laserTimer <= 0) return;
      ctx.strokeStyle = "red";
      ctx.lineWidth   = 5;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = "red";
      ctx.beginPath(); ctx.moveTo(cow.x-30, cow.y-20); ctx.lineTo(cow.x-30, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cow.x+30, cow.y-20); ctx.lineTo(cow.x+30, 0); ctx.stroke();
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
      ctx.beginPath(); ctx.roundRect(barX-2, barY-2, barW+4, barH+4, 10); ctx.fill();

      const r = Math.floor(255*(1-ratio));
      const g = Math.floor(200*ratio);
      ctx.fillStyle = `rgb(${r},${g},40)`;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW*ratio, barH, 8); ctx.fill();

      ctx.strokeStyle = "white"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`BOSS HP  ${bossHp} / ${bossMaxHp}`, barX + barW/2, barY+14);
      ctx.textAlign = "left";
    }

    function drawPlayerHpBar() {
      const barW = 280;
      const barH = 22;
      const barX = 16;
      const barY = canvas.height - 50;
      const ratio = Math.max(0, playerHp / PLAYER_MAX_HP);

      // 배경
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.beginPath(); ctx.roundRect(barX-2, barY-2, barW+4, barH+4, 10); ctx.fill();

      // 바
      const r = Math.floor(255*(1-ratio));
      const g = Math.floor(200*ratio);
      ctx.fillStyle = `rgb(${r},${g},40)`;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW*ratio, barH, 8); ctx.fill();

      ctx.strokeStyle = "white"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`❤️ 플레이어 HP  ${Math.ceil(playerHp)} / ${PLAYER_MAX_HP}`, barX + barW/2, barY+15);
      ctx.textAlign = "left";
    }

    function drawScoreUI() {
      // 점수 패널
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(16, 16, 200, 70, 14); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(16, 16, 200, 70, 14); ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px sans-serif";
      ctx.fillText("SCORE", 32, 36);

      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${score}`, 32, 72);

      // 페이즈 뱃지
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(228, 16, 90, 70, 14); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "13px sans-serif";
      ctx.fillText("PHASE", 242, 36);
      ctx.fillStyle = "#FF6B6B";
      ctx.font = "bold 36px sans-serif";
      ctx.fillText(`${phase+1}`, 252, 72);

      // 장착 무기 표시
      const w = WEAPONS[equippedRef.current];
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath(); ctx.roundRect(16, 100, 200, 50, 12); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "13px sans-serif";
      ctx.fillText(`⚔️ ${w.name}  (x${w.damage} 데미지)`, 28, 130);
    }

    function drawPhaseAnim() {
      if (phaseAnim <= 0) return;
      const progress = phaseAnim / 100;
      let alpha = progress > 0.7 ? (1-progress)/0.3 : progress > 0.3 ? 1 : progress/0.3;
      const scale = 1 + (1-progress)*0.4;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.scale(scale, scale);
      ctx.fillStyle = `rgba(255,100,0,${alpha*0.15})`;
      ctx.fillRect(-canvas.width,-canvas.height,canvas.width*2,canvas.height*2);
      ctx.font = "bold 100px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "black"; ctx.lineWidth = 12;
      ctx.strokeText(phaseAnimText, 0, 0);
      const grad = ctx.createLinearGradient(0,-50,0,50);
      grad.addColorStop(0,"#FFD700"); grad.addColorStop(1,"#FF6B00");
      ctx.fillStyle = grad;
      ctx.fillText(phaseAnimText, 0, 0);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.restore();
      phaseAnim--;
    }

    function drawPopups() {
      // 데미지 팝업
      scorePopups.forEach((p, i) => {
        ctx.save();
        ctx.globalAlpha = p.life/40;
        ctx.fillStyle = "#FF4444";
        ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center";
        ctx.strokeStyle = "black"; ctx.lineWidth = 4;
        ctx.strokeText(p.text, p.x, p.y);
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
        p.y -= 1.5; p.life--;
        if (p.life <= 0) scorePopups.splice(i, 1);
      });

      // 코인 팝업
      coinPopups.forEach((p, i) => {
        ctx.save();
        ctx.globalAlpha = p.life/50;
        ctx.drawImage(coinImg, p.x-12, p.y-12, 24, 24);
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("+코인", p.x+20, p.y+6);
        ctx.restore();
        p.y -= 1.2; p.life--;
        if (p.life <= 0) coinPopups.splice(i, 1);
      });
    }

    function drawDead() {
      ctx.fillStyle = "rgba(200,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 80px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💀 사망!", canvas.width/2, canvas.height/2 - 20);
      ctx.font = "30px sans-serif";
      ctx.fillText(`이전 페이즈로 돌아갑니다...`, canvas.width/2, canvas.height/2+50);
      ctx.textAlign = "left";
    }

    /* ── 게임 루프 ── */
    const loop = () => {
      ctx.save();
      if (shake > 0) {
        ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);
        shake--;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!dead) {
        // 플레이어 HP 자동 감소
        playerHp -= HP_DRAIN_RATE;
        if (playerHp <= 0) {
          playerHp = 0;
          dead = true;

          // 이전 페이즈로
          setTimeout(() => {
            phase  = Math.max(0, phase - 1);
            bossMaxHp = BASE_HP + phase * 15;
            bossHp = bossMaxHp;
            playerHp = PLAYER_MAX_HP;
            bossDead = false;
            dead = false;
            setShowPhaseBtn(false);
          }, 2500);
        }

        // 보스 이동
        const speed = 0.05 + score * 0.001;
        cow.t += speed;
        cow.x = canvas.width/2 + Math.sin(cow.t) * (120 + phase*30);

        // 보스 그리기
        const size = cow.r * 2;
        ctx.drawImage(cowImgs[phase % PHASES], cow.x-cow.r, cow.y-cow.r, size, size);

        drawBossHpBar();
        drawLaser();

        // 파티클
        particles.forEach((p, i) => {
          p.x += p.vx; p.y += p.vy; p.life--;
          ctx.fillStyle = `rgba(255,220,0,${p.life/40})`;
          ctx.fillRect(p.x, p.y, 5, 5);
          if (p.life <= 0) particles.splice(i, 1);
        });

        drawPopups();

        // 무기 커서
        ctx.drawImage(weaponImgs[equippedRef.current], mouseX-30, mouseY-30, 60, 60);

        ctx.restore();

        drawScoreUI();
        drawPhaseAnim();
        drawPlayerHpBar();
      } else {
        ctx.restore();
        drawDead();
      }

      requestAnimationFrame(loop);
    };

    loop();
    return () => { window.removeEventListener("resize", resize); };
  }, []);

  /* ── 상점 UI ── */
  const buyWeapon = (id: number) => {
    const w = WEAPONS[id];
    if (coins < w.price || ownedWeapons.includes(id)) return;
    setCoins(c => { coinsRef.current = c - w.price; return c - w.price; });
    setOwnedWeapons(o => [...o, id]);
  };

  const equipWeapon = (id: number) => {
    if (!ownedWeapons.includes(id)) return;
    setEquippedWeapon(id);
    equippedRef.current = id;
  };

  return (
    <>
      <canvas ref={canvasRef} />

      {/* 상점 버튼 */}
      <button className="open-shop-btn" onClick={() => setShowShop(true)}>
        🛒 상점  💰{coins}
      </button>

      {/* 페이즈 넘어가기 버튼 */}
      {showPhaseBtn && (
        <div className="phase-btn-overlay">
          <button className="phase-btn" onClick={() => (window as any).__nextPhase()}>
            🎉 보스 처치! 다음 페이즈 진행하기
          </button>
        </div>
      )}

      {/* 상점 오버레이 */}
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
                  <div
                    key={w.id}
                    className={`shop-item ${equipped ? "selected" : ""} ${owned ? "owned" : ""}`}
                  >
                    <img src={w.img} alt={w.name} />
                    <div className="shop-item-info">
                      <h3>{w.name}</h3>
                      <p>{w.desc}  |  {w.price === 0 ? "기본 지급" : `💰 ${w.price} 코인`}</p>
                    </div>
                    {!owned ? (
                      <button
                        className="shop-item-btn buy"
                        disabled={coins < w.price}
                        onClick={() => buyWeapon(w.id)}
                      >
                        구매
                      </button>
                    ) : equipped ? (
                      <button className="shop-item-btn equipped" disabled>장착중</button>
                    ) : (
                      <button className="shop-item-btn equip" onClick={() => equipWeapon(w.id)}>
                        장착
                      </button>
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