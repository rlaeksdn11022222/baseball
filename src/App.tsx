import { useState } from 'react';

// 랜덤 숫자 4개 추출 함수
function getNumbers() {
  const candidates = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const array = [];
  for (let i = 0; i < 4; i += 1) {
    const chosen = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
    array.push(chosen);
  }
  return array;
}

function App() {
  const [answer, setAnswer] = useState(getNumbers());
  const [value, setValue] = useState('');
  const [result, setResult] = useState('행운을 빌어요!');
  const [tries, setTries] = useState<{ try: string; result: string }[]>([]);

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length !== 4) return;

    if (value === answer.join('')) {
      setResult('🎉 홈런! 정답입니다!');
      alert('새 게임을 시작합니다!');
      setValue('');
      setAnswer(getNumbers());
      setTries([]);
    } else {
      const answerArray = value.split('').map((v) => parseInt(v));
      let strike = 0;
      let ball = 0;

      for (let i = 0; i < 4; i += 1) {
        if (answerArray[i] === answer[i]) strike += 1;
        else if (answer.includes(answerArray[i])) ball += 1;
      }
      
      setTries((prev) => [...prev, { try: value, result: `${strike}S ${ball}B` }]);
      setValue('');
      setResult(strike === 0 && ball === 0 ? '아웃(OUT) ❌' : `${strike} 스트라이크, ${ball} 볼입니다.`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>BASEBALL GAME</h1>
        <p style={styles.subtitle}>중복 없는 4자리 숫자를 입력하세요</p>
        
        <div style={styles.resultBadge}>{result}</div>

        <form onSubmit={onSubmitForm} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            maxLength={4}
            placeholder="????"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))} 
          />
          <button type="submit" style={styles.button}>입력</button>
        </form>

        <div style={styles.status}>
          시도 횟수: <span style={styles.highlight}>{tries.length} / 10</span>
        </div>

        <div style={styles.logContainer}>
          {tries.length === 0 ? (
            <p style={styles.emptyMsg}>기록이 여기에 표시됩니다.</p>
          ) : (
            tries.map((item, index) => (
              <div key={index} style={styles.logItem}>
                <span style={styles.round}>{index + 1}회차</span>
                <span style={styles.userTry}>{item.try}</span>
                <span style={item.result.includes('S') ? styles.scoreS : styles.scoreB}>{item.result}</span>
              </div>
            )).reverse() // 최신 기록이 위로 오도록
          )}
        </div>
      </div>
    </div>
  );
}

// Inline CSS 스타일
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    fontSize: '28px',
    color: '#1a73e8',
    margin: '0 0 10px 0',
    letterSpacing: '2px',
  },
  subtitle: {
    color: '#5f6368',
    fontSize: '14px',
    marginBottom: '20px',
  },
  resultBadge: {
    backgroundColor: '#e8f0fe',
    color: '#1967d2',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: 'bold',
    marginBottom: '25px',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '18px',
    borderRadius: '8px',
    border: '2px solid #ddd',
    textAlign: 'center',
    outline: 'none',
  },
  button: {
    padding: '0 20px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  status: {
    fontSize: '15px',
    color: '#3c4043',
    marginBottom: '15px',
  },
  highlight: {
    color: '#d93025',
    fontWeight: 'bold',
  },
  logContainer: {
    borderTop: '1px solid #eee',
    paddingTop: '15px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  logItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #fafafa',
  },
  round: { color: '#9aa0a6', fontSize: '13px' },
  userTry: { fontWeight: 'bold', letterSpacing: '3px' },
  scoreS: { color: '#1e8e3e', fontWeight: 'bold' },
  scoreB: { color: '#f9ab00', fontWeight: 'bold' },
  emptyMsg: { color: '#dadce0', fontSize: '14px', marginTop: '20px' },
};

export default App;