import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bluetooth, BluetoothOff, Play, RotateCcw, CheckCircle2, XCircle, Zap, ShieldAlert, ArrowLeft, Settings } from 'lucide-react';
import { useAbacusBLE } from './hooks/useAbacusBLE';
import { generateChapterProblem, Problem, ChapterType } from './utils/problemGenerator';

export default function App() {
  const { connect, disconnect, connectDummy, setDummyNumber, isConnected, status, lastData } = useAbacusBLE();
  
  // App Phase State
  const [appPhase, setAppPhase] = useState<'title' | 'setup' | 'battle'>('title');
  
  // Setup State
  const [chapter, setChapter] = useState<ChapterType>(9);
  const [termCount, setTermCount] = useState(3);
  const [totalProblems, setTotalProblems] = useState(10);
  
  // Battle State
  const [gameState, setGameState] = useState<'idle' | 'input' | 'result'>('idle');
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(1);
  const [dinoHp, setDinoHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [battleAction, setBattleAction] = useState<'none' | 'playerAttack' | 'bossAttack'>('none');
  const isAttacking = battleAction !== 'none';

  const audioRef = useRef<{ 
    player_attack: HTMLAudioElement, 
    boss_attack: HTMLAudioElement, 
    win: HTMLAudioElement, 
    idle: HTMLAudioElement, 
    bgm: HTMLAudioElement 
  } | null>(null);

  useEffect(() => {
    audioRef.current = {
      player_attack: new Audio('/player_attack.mp3'),
      boss_attack: new Audio('/boss_attack.mp3'),
      win: new Audio('/dino_win.mp3'),
      idle: new Audio('/dino_idle.mp3'),
      bgm: new Audio('/title_bgm.mp3') // 타이틀 BGM
    };
    if (audioRef.current.bgm) {
      audioRef.current.bgm.loop = true;
      audioRef.current.bgm.volume = 0.5;
    }
    if (audioRef.current.idle) {
      audioRef.current.idle.loop = true;
      audioRef.current.idle.volume = 0.7;
    }

    const handleInitialInteraction = () => {
      if (audioRef.current?.bgm && audioRef.current.bgm.paused) {
        audioRef.current.bgm.play().then(() => {
          // Play successful, remove listeners
          document.removeEventListener('click', handleInitialInteraction);
          document.removeEventListener('touchstart', handleInitialInteraction);
        }).catch(e => console.log('BGM Autoplay prevented:', e));
      }
    };

    // Try to play immediately (might work if user already interacted with the app preview)
    handleInitialInteraction();

    // If blocked, wait for any click or touch on the screen
    document.addEventListener('click', handleInitialInteraction);
    document.addEventListener('touchstart', handleInitialInteraction);

    return () => {
      document.removeEventListener('click', handleInitialInteraction);
      document.removeEventListener('touchstart', handleInitialInteraction);
    };
  }, []);

  // Idle sound loop logic
  useEffect(() => {
    if (!audioRef.current?.idle) return;
    
    const idleAudio = audioRef.current.idle;
    
    // Play idle if we are in battle, waiting for input, and no attack is happening
    const shouldPlayIdle = appPhase === 'battle' && gameState === 'input' && battleAction === 'none';

    if (shouldPlayIdle) {
      if (idleAudio.paused) {
        idleAudio.play().catch(e => console.log('Idle Autoplay prevented:', e));
      }
    } else {
      idleAudio.pause();
    }
  }, [appPhase, gameState, battleAction]);

  const playBGM = () => {
    if (audioRef.current?.bgm && audioRef.current.bgm.paused) {
      audioRef.current.bgm.play().catch(e => console.log('BGM Autoplay prevented:', e));
    }
  };

  const playSound = (type: 'player_attack' | 'boss_attack' | 'win' | 'idle') => {
    if (audioRef.current?.[type]) {
      audioRef.current[type].currentTime = 0;
      audioRef.current[type].play().catch(() => {});
    }
  };

  const nextProblem = useCallback((idx?: number) => {
    const prob = generateChapterProblem(chapter, termCount);
    setCurrentProblem(prob);
    setGameState('input');
    setShowAnswer(false);
    setFeedback(null);
    if (idx !== undefined) setProblemIndex(idx);
  }, [chapter, termCount]);

  const startNewGame = useCallback(() => {
    setDinoHp(100);
    setPlayerHp(100);
    setScore(0);
    setGameState('idle');
    setCurrentProblem(null);
    setFeedback(null);
    setBattleAction('none');
    nextProblem(1);
  }, [nextProblem]);

  const handleCorrect = useCallback(() => {
    if (gameState !== 'input') return;
    
    setBattleAction('playerAttack');
    
    // Player attack sound
    playSound('player_attack');
    
    setScore(s => s + 10);
    
    const damage = 100 / totalProblems;
    const newHp = dinoHp - damage;
    setDinoHp(Math.max(0, newHp));
    setFeedback({ type: 'success', message: '정답! 플레이어의 공격!' });
    
    setTimeout(() => {
      setBattleAction('none');
      setFeedback(null);
      if (problemIndex >= totalProblems || newHp <= 0.1) {
        playSound('win');
        setGameState('result');
      } else {
        setProblemIndex(i => i + 1);
        nextProblem();
      }
    }, 2000); // 2초 유지하여 전투 연출 시간 확보
  }, [gameState, dinoHp, problemIndex, totalProblems, nextProblem]);

  const handleWrong = useCallback(() => {
    setBattleAction('bossAttack');
    
    // Boss attack sound
    playSound('boss_attack');

    setPlayerHp(h => Math.max(0, h - 10));
    setFeedback({ type: 'error', message: '오답! 보스의 반격!' });
    
    setTimeout(() => {
      setBattleAction('none');
      setFeedback(null);
    }, 2000); // 2초 유지
  }, []);

  const checkAnswer = useCallback(() => {
    if (gameState !== 'input' || !currentProblem || !lastData) return;

    if (lastData.number === currentProblem.answer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  }, [gameState, currentProblem, lastData, handleCorrect, handleWrong]);

  // BLE 입력 감지 (버튼 눌림 체크)
  useEffect(() => {
    if (gameState === 'input' && lastData?.isConfirmed) {
      checkAnswer();
    }
  }, [lastData, gameState, checkAnswer]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          {appPhase === 'battle' && (
            <button 
              onClick={() => setAppPhase('setup')}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors mr-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div className="bg-cyan-500 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            ABACUS DINO BATTLE
          </h1>
        </div>

        {appPhase === 'battle' && (
          <div className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isConnected ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
            {isConnected ? <Bluetooth className="w-4 h-4" /> : <BluetoothOff className="w-4 h-4" />}
            <span className="text-sm font-medium">{status}</span>
          </div>
        )}
      </header>

      {/* Phase 1: Title Screen */}
      {appPhase === 'title' && (
        <div 
          className="w-full max-w-4xl h-[75vh] min-h-[500px] max-h-[800px] flex flex-col justify-end items-center rounded-3xl overflow-hidden shadow-2xl relative border-2 border-slate-700 animate-in fade-in zoom-in duration-500 bg-slate-950"
        >
          {/* Constrained Image Layer */}
          <div className="absolute inset-0 flex items-start justify-center pt-8 px-4">
            <img 
              src="/title_image.png" 
              alt="Abacus Dino Battle" 
              className="w-full h-full max-h-[65vh] object-contain object-top filter drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 w-full p-6 md:p-8 flex flex-col items-center">
            
            <button
              onClick={() => {
                if (audioRef.current?.bgm) {
                  audioRef.current.bgm.pause();
                  audioRef.current.bgm.currentTime = 0;
                }
                setAppPhase('setup');
              }}
              className="mt-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-12 py-5 rounded-full font-black text-3xl shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all active:scale-95 flex items-center justify-center gap-3 border-[3px] border-cyan-400/50 hover:scale-105"
            >
              Game Start <Play className="w-8 h-8 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Setup Screen */}
      {appPhase === 'setup' && (
        <div className="w-full max-w-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
          
          {/* BLE Connection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
              <Bluetooth className="w-6 h-6" /> 1. 기기 연결
            </h2>
            <div className="flex flex-col gap-4">
              <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-all ${isConnected ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
                {isConnected ? <Bluetooth className="w-5 h-5" /> : <BluetoothOff className="w-5 h-5" />}
                <span className="font-medium">{status}</span>
              </div>
              {!isConnected ? (
                <div className="flex gap-3">
                  <button onClick={connect} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-600/30 transition-all active:scale-95">
                    주판 연결
                  </button>
                  <button onClick={connectDummy} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold transition-all">
                    더미 연결 (테스트)
                  </button>
                </div>
              ) : (
                <button onClick={disconnect} className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all">
                  연결 해제
                </button>
              )}
            </div>
          </div>

          {/* Chapter Selection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
              <Settings className="w-6 h-6" /> 2. 단원 선택 (10의 보수)
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {([9, 8, 7, 6, 5, 4, 3, 2, 1] as ChapterType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChapter(c)}
                  className={`py-3 rounded-xl font-bold transition-all ${chapter === c ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                >
                  {c}의 덧셈
                </button>
              ))}
            </div>
          </div>

          {/* Term Count Selection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
              <Settings className="w-6 h-6" /> 3. 한 문제당 숫자 개수
            </h2>
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  onClick={() => setTermCount(n)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${termCount === n ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {n}개
                </button>
              ))}
            </div>
          </div>

          {/* Total Problems Selection */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
              <Settings className="w-6 h-6" /> 4. 총 기출 문제 수
            </h2>
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
              {[10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setTotalProblems(n)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${totalProblems === n ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {n}문제
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setAppPhase('battle');
              startNewGame();
            }}
            className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white py-5 rounded-2xl font-black text-2xl shadow-2xl shadow-cyan-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <Play className="w-8 h-8" />
            전투 시작!
          </button>
        </div>
      )}

      {/* Phase 2: Battle Screen */}
      {appPhase === 'battle' && (
        <main className={`w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          
          {/* Left: Problem Area (Col Span 3) */}
          <div className={`${isAttacking ? 'hidden' : 'lg:col-span-3 flex flex-col gap-6'}`}>
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center shadow-inner relative flex-1 min-h-[400px]">
              <AnimatePresence mode="wait">
                {gameState === 'input' && currentProblem && (
                  <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center">
                    <div className="flex flex-col items-center w-full mb-6 gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">주판으로 계산하세요</span>
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-3 py-1 rounded-full">
                        문제 {problemIndex} / {totalProblems}
                      </span>
                    </div>
                    
                    {/* Vertical Problem Display */}
                    <div className="flex flex-col items-end text-6xl font-black font-mono gap-3 w-full max-w-[200px]">
                      {currentProblem.terms.map((term, idx) => (
                        <div key={idx} className="flex gap-6 w-full justify-between items-center">
                          <span className="text-4xl text-slate-500">{idx > 0 ? (term > 0 ? '+' : '-') : ''}</span>
                          <span className={term > 0 ? 'text-white' : 'text-red-400'}>{Math.abs(term)}</span>
                        </div>
                      ))}
                      <div className="w-full h-1 bg-slate-600 rounded-full my-2"></div>
                      <div className="flex gap-6 w-full justify-between items-center text-cyan-500">
                        <span className="text-4xl">=</span>
                        <span>?</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Info Card */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-xl shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">학습 팁: {chapter}의 덧셈</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentProblem?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Input & Controls (Col Span 4) */}
          <div className={`${isAttacking ? 'hidden' : 'lg:col-span-4 flex flex-col gap-6'}`}>
            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center shadow-inner relative flex-1 min-h-[400px]">
              <AnimatePresence mode="wait">
                {gameState === 'input' && (
                  <motion.div key="input-controls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-6">
                    <div className="w-full grid grid-cols-1 gap-4">
                      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 text-center shadow-lg">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">현재 주판 값</p>
                        <p className="text-7xl font-black text-cyan-400">{lastData?.number ?? 0}</p>
                      </div>
                      <button 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="bg-slate-900 p-4 rounded-3xl border border-slate-700 text-center hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-widest">정답 확인</p>
                        <p className="text-4xl font-black text-white">{showAnswer ? currentProblem?.answer : '??'}</p>
                      </button>
                    </div>

                    <button 
                      onClick={checkAnswer}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-cyan-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      정답 제출 (OK)
                    </button>
                  </motion.div>
                )}

                {gameState === 'result' && (
                  <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <div className="bg-green-500/20 text-green-400 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black mb-2">VICTORY!</h2>
                    <p className="text-slate-400 text-sm mb-6">공룡을 물리쳤습니다!</p>
                    <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 inline-block w-full">
                      <p className="text-sm font-bold text-slate-500 uppercase mb-2 tracking-widest">최종 점수</p>
                      <p className="text-6xl font-black text-cyan-400">{score}</p>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={startNewGame}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-5 h-5" /> 다시 도전
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Battle Area (Col Span 5 or Full) */}
          <div className={`${isAttacking ? 'lg:col-span-12 h-[80vh] fixed inset-4 md:inset-8 z-50 bg-[#0f172a] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl p-4' : 'lg:col-span-5'} flex flex-col gap-6 transition-all duration-500`}>
            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-between flex-1 bg-[url('/battle_bg.png')] bg-cover bg-center bg-no-repeat bg-blend-overlay">
              {/* Boss HP Bar */}
              <div className="w-full px-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-black text-red-500 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">BOSS T-REX</span>
                  <span className="text-sm font-black text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">{dinoHp}%</span>
                </div>
                <div className="h-6 md:h-8 bg-slate-950 rounded-xl overflow-hidden border-[3px] border-slate-800 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=')] opacity-30 z-10 pointer-events-none mix-blend-overlay"></div>
                  <motion.div 
                    animate={{ width: `${dinoHp}%` }}
                    className="h-full bg-gradient-to-b from-red-400 via-red-600 to-red-800 relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-xl"></div>
                    <div className="absolute inset-0 shadow-[0_0_15px_rgba(239,68,68,0.6)] mix-blend-screen"></div>
                  </motion.div>
                </div>
              </div>

              {/* Battle Stage */}
              <div className="flex-1 w-full flex items-center justify-around relative">
                {/* Player Dino */}
                <motion.div
                  animate={
                    battleAction === 'playerAttack' ? { x: isAttacking ? [0, 700, 0] : [0, 300, 0], scale: [1, 1.3, 1] } :
                    battleAction === 'bossAttack' ? { x: [0, -30, 30, -30, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } :
                    { y: [0, -5, 0] }
                  }
                  transition={{ duration: battleAction === 'none' ? 2 : 0.6, repeat: battleAction === 'none' ? Infinity : 0 }}
                  className={`relative flex items-center justify-center transition-all duration-500 ${isAttacking ? 'w-64 h-64 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px]' : 'w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64'}`}
                >
                  <img 
                    src={
                      gameState === 'result' && dinoHp <= 0 ? '/player_win.png' : // Win (바위 위)
                      battleAction === 'playerAttack' ? '/player_attack.png' :      // Attack (달려가는 모습)
                      battleAction === 'bossAttack' ? '/player_hit.png' :        // Hit (맞는 모습)
                      '/player_idle.png'                                          // Idle (기본 서있는 모습)
                    }
                    alt="Player Dinosaur"
                    className="w-full h-full object-contain filter drop-shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-cyan-400 bg-slate-900/80 px-2 py-1 rounded border border-cyan-500/30 whitespace-nowrap z-10">
                    PLAYER
                  </div>
                </motion.div>

                {/* VS Icon */}
                <div className="text-slate-700 font-black text-2xl md:text-4xl italic opacity-30 z-0">VS</div>

                {/* Boss Dino */}
                <motion.div
                  animate={
                    battleAction === 'bossAttack' ? { x: isAttacking ? [0, -700, 0] : [0, -300, 0], scale: [1, 1.3, 1] } :
                    battleAction === 'playerAttack' ? { x: [0, 30, -30, 30, 0], filter: ['brightness(1)', 'brightness(2)', 'brightness(1)'] } :
                    { y: [0, 5, 0] }
                  }
                  transition={{ duration: battleAction === 'none' ? 2.5 : 0.6, repeat: battleAction === 'none' ? Infinity : 0 }}
                  className={`relative flex items-center justify-center transition-all duration-500 ${isAttacking ? 'w-64 h-64 md:w-96 md:h-96 lg:w-[450px] lg:h-[450px]' : 'w-40 h-40 md:w-56 md:h-56 lg:w-64 lg:h-64'}`}
                >
                  <img 
                    src={
                      gameState === 'result' && playerHp <= 0 ? '/boss_win.png' : // Win
                      battleAction === 'bossAttack' ? '/boss_attack.png' :      // Attack
                      battleAction === 'playerAttack' ? '/boss_hit.png' :        // Hit
                      '/boss_idle.png'                                          // Idle
                    }
                    alt="Boss Dinosaur"
                    className="w-full h-full object-contain filter drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-red-500 bg-slate-900/80 px-2 py-1 rounded border border-red-500/30 whitespace-nowrap z-10">
                    BOSS
                  </div>
                </motion.div>
              </div>

              {/* Player HP Bar */}
              <div className="w-full px-2 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-black text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">PLAYER</span>
                  <span className="text-sm font-black text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">{playerHp}%</span>
                </div>
                <div className="h-6 md:h-8 bg-slate-950 rounded-xl overflow-hidden border-[3px] border-slate-800 shadow-[inset_0_4px_8px_rgba(0,0,0,0.6)] relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4=')] opacity-30 z-10 pointer-events-none mix-blend-overlay"></div>
                  <motion.div 
                    animate={{ width: `${playerHp}%` }}
                    className="h-full bg-gradient-to-b from-cyan-300 via-cyan-500 to-cyan-700 relative"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-xl"></div>
                    <div className="absolute inset-0 shadow-[0_0_15px_rgba(6,182,212,0.6)] mix-blend-screen"></div>
                  </motion.div>
                </div>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-3 rounded-2xl font-black text-lg shadow-2xl z-10 whitespace-nowrap ${feedback.type === 'success' ? 'bg-cyan-500 text-white' : 'bg-red-500 text-white'}`}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      )}

      {/* Footer / Debug */}
      <footer className="mt-auto pt-12 text-slate-600 text-xs font-medium uppercase tracking-widest flex flex-col items-center gap-4">
        {isConnected && status.includes("더미") && (
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center gap-4">
            <p className="text-cyan-400 font-bold">디버그: 주판 값 조절</p>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" 
                max="99" 
                value={lastData?.number ?? 0}
                onChange={(e) => setDummyNumber(parseInt(e.target.value), false)}
                className="w-64 accent-cyan-500"
              />
              <button 
                onClick={() => setDummyNumber(lastData?.number ?? 0, true)}
                className="bg-cyan-600 text-white px-4 py-2 rounded-xl font-bold text-xs"
              >
                기기 OK 버튼 시뮬레이션
              </button>
            </div>
            <p className="text-white text-lg font-black">{lastData?.number ?? 0}</p>
          </div>
        )}
        <p>© 2024 ABACUS DINO BATTLE - EDUCATIONAL EDITION</p>
        {isConnected && lastData && (
          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-[10px] font-mono">
            RAW: {lastData.rawHex} | TENS: {lastData.tens} | ONES: {lastData.ones}
          </div>
        )}
      </footer>
    </div>
  );
}
