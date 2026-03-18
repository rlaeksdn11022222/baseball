import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

// ── 상수 ──────────────────────────────────────
const GW = 480        // 게임 너비
const GH = 640        // 게임 높이
const COW_W = 80      // 소 너비 (충돌 판정용)
const COW_H = 65      // 소 높이
const POOP_SIZE = 44  // 똥 크기
const COW_SPEED = 9   // 소 이동 속도

interface Poop {
  id: number
  x: number
  y: number
  rot: number
  speed: number
}

const FUNNY_MESSAGES: Record<string, string[]> = {
  bad:    ['😂 소가 공황장애 걸림', '💀 이게 최선임?', '🐄 소 : 내가 왜 여기 있지'],
  ok:     ['🤣 그래도 좀 버텼네', '😤 아직 멀었다', '🐮 소 : 조금 긴장됨'],
  good:   ['😯 오 꽤 하는데?', '🔥 똥 피하기 재능있음', '💪 소가 진화중'],
  master: ['🏆 똥피하기 마스터!!', '👑 소계의 전설', '🎖️ 똥 닷지 갓'],
}
function getFunnyMsg(score: number) {
  const pool =
    score < 10 ? FUNNY_MESSAGES.bad :
    score < 30 ? FUNNY_MESSAGES.ok  :
    score < 60 ? FUNNY_MESSAGES.good :
    FUNNY_MESSAGES.master
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── 컴포넌트 ──────────────────────────────────
export default function App() {
  const [started, setStarted]     = useState(false)
  const [gameOver, setGameOver]   = useState(false)
  const [score, setScore]         = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [cowX, setCowX]           = useState(GW / 2 - COW_W / 2)
  const [poops, setPoops]         = useState<Poop[]>([])
  const [danger, setDanger]       = useState(false)
  const [funnyMsg, setFunnyMsg]   = useState('')
  const [cowHit, setCowHit]       = useState(false)

  const keys       = useRef(new Set<string>())
  const rafRef     = useRef<number>(0)
  const lastTime   = useRef(0)
  const lastSpawn  = useRef(0)
  const scoreRef   = useRef(0)
  const poopIdRef  = useRef(0)
  const cowXRef    = useRef(cowX)
  const deadRef    = useRef(false)

  cowXRef.current = cowX

  // ── 게임 시작 ──
  const startGame = useCallback(() => {
    deadRef.current = false
    setStarted(true)
    setGameOver(false)
    setCowX(GW / 2 - COW_W / 2)
    setPoops([])
    setScore(0)
    setDanger(false)
    setCowHit(false)
    scoreRef.current = 0
    lastTime.current = 0
    lastSpawn.current = 0
    poopIdRef.current = 0
  }, [])

  // ── 게임 루프 ──
  useEffect(() => {
    if (!started || gameOver) return

    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key)
      // 스페이스로 재시작 방지
      if (e.key === ' ') e.preventDefault()
    }
    const onKeyUp   = (e: KeyboardEvent) => keys.current.delete(e.key)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    const loop = (ts: number) => {
      if (deadRef.current) return
      if (!lastTime.current) lastTime.current = ts
      const dt = ts - lastTime.current
      lastTime.current = ts

      // 소 이동
      const pressing = keys.current
      if (pressing.has('ArrowLeft')  || pressing.has('a') || pressing.has('A')) {
        setCowX(p => Math.max(0, p - COW_SPEED))
      }
      if (pressing.has('ArrowRight') || pressing.has('d') || pressing.has('D')) {
        setCowX(p => Math.min(GW - COW_W, p + COW_SPEED))
      }

      // 점수 업데이트
      scoreRef.current += dt * 0.01
      const s = Math.floor(scoreRef.current)
      setScore(s)
      setDanger(s > 20)

      // 똥 생성 간격: 처음 2000ms → 최소 600ms로 줄어듦
      const diff = Math.min(scoreRef.current / 80, 1)
      const interval = 2000 - diff * 1400

      if (ts - lastSpawn.current > interval) {
        lastSpawn.current = ts
        const spawnCount = s > 40 ? 2 : 1   // 40점 이후 동시에 2개
        for (let i = 0; i < spawnCount; i++) {
          setPoops(p => [...p, {
            id:    poopIdRef.current++,
            x:     Math.random() * (GW - POOP_SIZE),
            y:     -POOP_SIZE,
            rot:   Math.random() * 360,
            speed: 2.5 + diff * 5 + Math.random() * 2,
          }])
        }
      }

      // 똥 이동 + 충돌 체크
      setPoops(prev => {
        const cx  = cowXRef.current
        const cy  = GH - 80 - COW_H   // 소 top 위치 (ground = 80px)

        const next = prev
          .map(p => ({ ...p, y: p.y + p.speed, rot: p.rot + 4 }))
          .filter(p => p.y < GH)

        for (const p of next) {
          // 충돌 판정 (이모지 크기 고려해 약간 여유 줌)
          const hit =
            p.x + 8       < cx + COW_W - 8  &&
            p.x + POOP_SIZE - 8 > cx + 8    &&
            p.y + 8       < cy + COW_H - 8  &&
            p.y + POOP_SIZE - 8 > cy + 8

          if (hit) {
            deadRef.current = true
            setCowHit(true)
            const finalScore = Math.floor(scoreRef.current)
            setGameOver(true)
            setHighScore(h => Math.max(h, finalScore))
            setFunnyMsg(getFunnyMsg(finalScore))
            return []
          }
        }
        return next
      })

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [started, gameOver])

  // ── 터치 조작 ──
  const touchX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchMove  = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchX.current
    touchX.current = e.touches[0].clientX
    setCowX(p => Math.max(0, Math.min(GW - COW_W, p + dx)))
  }

  const cowY = GH - 80 - COW_H

  return (
    <div className="app">
      <div
        className={`game-container${danger && started && !gameOver ? ' danger-flash' : ''}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {/* 배경 오브젝트 */}
        <div className="sun">☀️</div>
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
        <div className="cloud cloud-3">☁️</div>

        {/* 점수 */}
        {started && !gameOver && (
          <div className="score">
            💩 생존: <span>{score}</span>초
          </div>
        )}

        {/* 떨어지는 똥들 */}
        {poops.map(p => (
          <div
            key={p.id}
            className="poop"
            style={{ left: p.x, top: p.y, transform: `rotate(${p.rot}deg)` }}
          >
            💩
          </div>
        ))}

        {/* 소 */}
        {started && (
          <div
            className={`cow${cowHit ? ' hit' : ''}`}
            style={{ left: cowX, top: cowY }}
          >
            🐄
          </div>
        )}

        {/* 땅 */}
        <div className="ground" />

        {/* 시작 화면 */}
        {!started && !gameOver && (
          <div className="overlay">
            <div className="overlay-content">
              <h1>💩 하늘에서 똥이!</h1>
              <p className="subtitle">
                하늘에서 똥이 쏟아진다!<br />
                소를 조종해서 최대한 피하세요 🐄
              </p>
              <div className="controls-info">
                <p>⬅️ ➡️ 방향키 또는 A / D</p>
                <p>📱 모바일 : 화면 드래그</p>
              </div>
              <button className="start-btn" onClick={startGame}>
                🐄 게임 시작!
              </button>
            </div>
          </div>
        )}

        {/* 게임 오버 화면 */}
        {gameOver && (
          <div className="overlay">
            <div className="overlay-content">
              <h1>💩 똥 맞았다!!</h1>
              <p className="score-display">
                생존 시간 : <strong>{score}초</strong>
              </p>
              {highScore > 0 && (
                <p className="high-score">🏆 최고기록 : {highScore}초</p>
              )}
              <p className="funny-msg">{funnyMsg}</p>
              <button className="start-btn" onClick={startGame}>
                🔄 다시 도전!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}