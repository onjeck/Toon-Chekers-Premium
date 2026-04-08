import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ToonPiece from './components/ToonPiece';
import { Piece, Position, Move, Player, GameState, Particle, GameMode, Difficulty, Theme, GameRules, PieceModelId, DeathEffectId, CustomBoard, CustomPiece } from './types';
import { playSound } from './utils/audio';

// --- Models ---
const PIECE_MODELS: { id: PieceModelId, name: string, icon: string, desc: string }[] = [
  { id: 'classic', name: 'Gorducho', icon: '🔴', desc: 'Clássico e Fofo' },
  { id: 'robot', name: 'Botz', icon: '🤖', desc: 'Metálico e LED' },
  { id: 'slime', name: 'Gelinho', icon: '💧', desc: 'Geleia e Brilho' },
  { id: 'alien', name: 'Zorg', icon: '👁️', desc: 'Um olho só' },
  { id: 'vampy', name: 'Vampy', icon: '🧛', desc: 'Sombrio e Feroz' },
  { id: 'ghosty', name: 'Ghosty', icon: '👻', desc: 'Sutil e Etéreo' },
  { id: 'ninja', name: 'Ninja', icon: '🥷', desc: 'Rápido e Sigiloso' },
  { id: 'bear', name: 'Urso', icon: '🐻', desc: 'Fofo e Robusto' },
  { id: 'dragon', name: 'Drago', icon: '🐉', desc: 'Mítico e Escamoso' },
  { id: 'dino', name: 'Rex', icon: '🦖', desc: 'Pré-histórico' },
  { id: 'knight', name: 'Cavaleiro', icon: '🛡️', desc: 'Blindado e Leal' },
  { id: 'zumbi', name: 'Zumbi', icon: '🧟', desc: 'Lento e Faminto' },
  { id: 'monstros', name: 'Monstro', icon: '👹', desc: 'Assustador e Feroz' }
];

// --- Death Effects ---
const DEATH_EFFECTS: { id: DeathEffectId, name: string, icon: string, desc: string }[] = [
  { id: 'auto', name: 'Auto', icon: '✨', desc: 'Baseado no modelo' },
  { id: 'poof', name: 'Fumaça', icon: '💨', desc: 'Sumir em poof' },
  { id: 'melt', name: 'Melt', icon: '🫠', desc: 'Derreter no chão' },
  { id: 'glitch', name: 'Erro', icon: '👾', desc: 'Falha digital' },
  { id: 'beam', name: 'Abdução', icon: '🛸', desc: 'Levado por feixe' },
  { id: 'ghost', name: 'Alma', icon: '👻', desc: 'Transparência suave' }
];

// --- Themes ---
const THEMES: Theme[] = [
  {
    id: 'classic',
    name: 'Clássico',
    icon: '🔴',
    boardDark: '#1e293b',
    boardLight: '#e2e8f0',
    red: { from: '#f43f5e', via: '#e11d48', to: '#be123c', side: '#9f1239' },
    blue: { from: '#38bdf8', via: '#0ea5e9', to: '#0284c7', side: '#0369a1' }
  },
  {
    id: 'candy',
    name: 'Doces',
    icon: '🍭',
    boardDark: '#5c2d2d',
    boardLight: '#fff5f5',
    red: { from: '#fb7185', via: '#f43f5e', to: '#db2777', side: '#9d174d' },
    blue: { from: '#2dd4bf', via: '#14b8a6', to: '#0d9488', side: '#115e59' }
  },
  {
    id: 'forest',
    name: 'Floresta',
    icon: '🌲',
    boardDark: '#2d3319',
    boardLight: '#e9edc9',
    red: { from: '#fb923c', via: '#f97316', to: '#ea580c', side: '#9a3412' },
    blue: { from: '#a3e635', via: '#84cc16', to: '#65a30d', side: '#3f6212' }
  },
  {
    id: 'cyber',
    name: 'Cyber',
    icon: '⚡',
    boardDark: '#0a0a0a',
    boardLight: '#262626',
    red: { from: '#ff00ff', via: '#d946ef', to: '#a21caf', side: '#701a75' },
    blue: { from: '#00ffff', via: '#06b6d4', to: '#0891b2', side: '#155e75' }
  },
  {
    id: 'volcano',
    name: 'Vulcão',
    icon: '🌋',
    boardDark: '#18181b',
    boardLight: '#4a0404',
    red: { from: '#ef4444', via: '#b91c1c', to: '#7f1d1d', side: '#450a0a' },
    blue: { from: '#fb923c', via: '#ea580c', to: '#c2410c', side: '#7c2d12' }
  },
  {
    id: 'fire_sky',
    name: 'Céu em Chamas',
    icon: '🔥',
    boardDark: '#450a0a',
    boardLight: '#fca5a5',
    red: { from: '#dc2626', via: '#b91c1c', to: '#991b1b', side: '#7f1d1d' },
    blue: { from: '#f59e0b', via: '#d97706', to: '#b45309', side: '#92400e' }
  }
];

const BOARD_SIZE = 8;
const INITIAL_PIECES = 12;
const AI_PLAYER: Player = 'blue';
const HUMAN_PLAYER: Player = 'red';

const TAUNTS_SIMPLE = ["Tchau!", "Ops!", "Já era", "Vaza", "Perdeu", "Eita...", "Xiu!", "Fácil", "Kkkk", "Falou!"];
const TAUNTS_EPIC = ["SOLADO!", "AULA!", "RECEBA!", "QUE ISSO?", "SEGURA!", "NEM VIU", "DESTRUIÇÃO", "CHORA MAIS"];

const BattleBar: React.FC<{ player: Player, score: number, roundWins: number, theme: Theme, reverse?: boolean, active: boolean }> = ({ player, score, roundWins, theme, reverse, active }) => {
  const percentage = (score / INITIAL_PIECES) * 100;
  const color = player === 'red' ? theme.red.from : theme.blue.from;
  const [shaking, setShaking] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score < prevScore.current) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
    prevScore.current = score;
  }, [score]);

  return (
    <div className={`flex flex-col w-full px-2 ${reverse ? 'items-end' : 'items-start'} ${shaking ? 'animate-shake' : ''}`}>
      <div className={`flex items-center gap-2 mb-1 ${reverse ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden transition-all ${active ? 'scale-110 ring-2 ring-yellow-400' : 'opacity-60 grayscale scale-90'}`} style={{ background: color }}>
          <span className="text-sm font-black text-white drop-shadow-sm">{score}</span>
        </div>
        <div className={`flex flex-col ${reverse ? 'items-end' : 'items-start'}`}>
          <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>
            {player === 'red' ? 'P1' : 'P2'}
          </span>
          <div className="flex gap-1 mt-0.5">
            {[1, 2].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full border border-white/20 ${i <= roundWins ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </div>
      <div className={`relative h-2 md:h-3 w-full max-w-[140px] md:max-w-[180px] bg-slate-800 rounded-full border border-slate-950 overflow-hidden shadow-inner`}>
        <div className="absolute inset-0 bg-red-900/40 transition-all duration-700 ease-out" style={{ width: `${percentage}%`, [reverse ? 'right' : 'left']: 0 }} />
        <div className="absolute inset-0 transition-all duration-300 ease-out flex items-center justify-end px-1" 
             style={{ width: `${percentage}%`, background: `linear-gradient(${reverse ? 'to left' : 'to right'}, ${color}, ${player === 'red' ? theme.red.via : theme.blue.via})`, [reverse ? 'right' : 'left']: 0 }}>
          <div className="h-full w-1/4 bg-white/20 blur-sm rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

// --- Dynamic Background Component ---
const DynamicBackground: React.FC<{ theme: Theme, isPlaying: boolean }> = ({ theme, isPlaying }) => {
  const pieces = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      icon: PIECE_MODELS[Math.floor(Math.random() * PIECE_MODELS.length)].icon,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1.5}rem`,
      delay: `${Math.random() * 8}s`,
      duration: `${Math.random() * 12 + 10}s`,
      opacity: Math.random() * 0.25 + 0.05,
      blur: `${Math.random() * 6}px`,
      type: Math.random() > 0.6 ? 'slow' : 'distant'
    }));
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 8 + 3}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${Math.random() * 4 + 3}s`,
      color: Math.random() > 0.5 ? theme.red.from : theme.blue.from
    }));
  }, [theme]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${isPlaying ? 'opacity-40' : 'opacity-100'}`}>
      {/* Background Pieces */}
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`absolute flex items-center justify-center transition-all ${p.type === 'slow' ? 'animate-float-slow' : 'animate-float-distant'}`}
          style={{
            top: p.top,
            left: p.left,
            fontSize: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            opacity: p.opacity,
            filter: `blur(${p.blur})`,
          }}
        >
          {p.icon}
        </div>
      ))}
      
      {/* Glow Particles */}
      {particles.map((pa) => (
        <div
          key={pa.id}
          className="absolute rounded-full animate-particle"
          style={{
            top: pa.top,
            left: pa.left,
            width: pa.size,
            height: pa.size,
            backgroundColor: pa.color,
            animationDelay: pa.delay,
            animationDuration: pa.duration,
            boxShadow: `0 0 15px ${pa.color}`,
          }}
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('login');
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<Theme>(THEMES[0]);
  const [nickname, setNickname] = useState<string>('');
  
  const [rules, setRules] = useState<GameRules>(() => {
    const saved = localStorage.getItem('toon_checkers_rules');
    return saved ? { ...JSON.parse(saved), is25D: JSON.parse(saved).is25D ?? true } : { 
      flyingKings: true, 
      backwardCapture: true, 
      forcedCapture: true, 
      pieceModel: 'classic',
      deathEffect: 'auto',
      is25D: true
    };
  });
  const [customAssets, setCustomAssets] = useState<{
    boardBg: string, 
    homeBg: string, 
    loginBg: string, 
    logoUrl: string,
    welcomeText: string,
    arcadeButtonLabel: string,
    versusButtonLabel: string,
    storeButtonLabel: string,
    settingsButtonLabel: string,
    primaryColor: string,
    accentColor: string,
    backgroundOpacity: number,
    buttonStyle: 'rounded' | 'square',
    showCoins: boolean,
    showFooter: boolean,
    arcadeButtonImage: string,
    versusButtonImage: string,
    storeButtonImage: string,
    settingsButtonImage: string,
    redPieceImage: string,
    bluePieceImage: string,
    redKingPieceImage: string,
    blueKingPieceImage: string
  }>(() => {
    const saved = localStorage.getItem('toon_checkers_assets');
    const parsed = saved ? JSON.parse(saved) : {};
    return { 
      boardBg: '', 
      homeBg: '', 
      loginBg: '', 
      logoUrl: '', 
      welcomeText: 'Bem-vindo, {nickname}!',
      arcadeButtonLabel: 'MODO ARCADE',
      versusButtonLabel: 'MODO VERSUS',
      storeButtonLabel: 'LOJA DE TABULEIROS',
      settingsButtonLabel: 'REGRAS & TEMAS',
      primaryColor: '#3b82f6',
      accentColor: '#facc15',
      backgroundOpacity: 0.2,
      buttonStyle: 'rounded',
      showCoins: true,
      showFooter: true,
      arcadeButtonImage: '',
      versusButtonImage: '',
      storeButtonImage: '',
      settingsButtonImage: '',
      redPieceImage: '',
      bluePieceImage: '',
      redKingPieceImage: '',
      blueKingPieceImage: '',
      ...parsed 
    };
  });

  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('toon_checkers_coins');
    return saved ? parseInt(saved) : 0;
  });

  const [unlockedBoards, setUnlockedBoards] = useState<string[]>(() => {
    const saved = localStorage.getItem('toon_checkers_unlocked_boards');
    return saved ? JSON.parse(saved) : ['classic'];
  });

  const [customStoreBoards, setCustomStoreBoards] = useState<CustomBoard[]>(() => {
    const saved = localStorage.getItem('toon_checkers_custom_store_boards');
    return saved ? JSON.parse(saved) : [];
  });

  const [customStorePieces, setCustomStorePieces] = useState<CustomPiece[]>(() => {
    const saved = localStorage.getItem('toon_checkers_custom_store_pieces');
    return saved ? JSON.parse(saved) : [];
  });

  const [unlockedPieces, setUnlockedPieces] = useState<string[]>(() => {
    const saved = localStorage.getItem('toon_checkers_unlocked_pieces');
    return saved ? JSON.parse(saved) : ['classic'];
  });

  const [equippedPieceId, setEquippedPieceId] = useState<string>(() => {
    const saved = localStorage.getItem('toon_checkers_equipped_piece_id');
    return saved ? saved : 'classic';
  });

  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardUrl, setNewBoardUrl] = useState('');
  const [newBoardPrice, setNewBoardPrice] = useState(100);

  const [newPieceName, setNewPieceName] = useState('');
  const [newRedPieceImage, setNewRedPieceImage] = useState('');
  const [newBluePieceImage, setNewBluePieceImage] = useState('');
  const [newRedKingPieceImage, setNewRedKingPieceImage] = useState('');
  const [newBlueKingPieceImage, setNewBlueKingPieceImage] = useState('');
  const [newPiecePrice, setNewPiecePrice] = useState(100);

  const [adminTab, setAdminTab] = useState<'Tabuleiros' | 'Sons' | 'Home' | 'Login' | 'Peças'>('Tabuleiros');
  const [storeTab, setStoreTab] = useState<'Tabuleiros' | 'Peças'>('Tabuleiros');

  useEffect(() => {
    localStorage.setItem('toon_checkers_assets', JSON.stringify(customAssets));
  }, [customAssets]);

  useEffect(() => {
    localStorage.setItem('toon_checkers_coins', coins.toString());
    localStorage.setItem('toon_checkers_unlocked_boards', JSON.stringify(unlockedBoards));
    localStorage.setItem('toon_checkers_custom_store_boards', JSON.stringify(customStoreBoards));
    localStorage.setItem('toon_checkers_custom_store_pieces', JSON.stringify(customStorePieces));
    localStorage.setItem('toon_checkers_unlocked_pieces', JSON.stringify(unlockedPieces));
    localStorage.setItem('toon_checkers_equipped_piece_id', equippedPieceId);
  }, [coins, unlockedBoards, customStoreBoards, customStorePieces, unlockedPieces, equippedPieceId]);

  const [saveFeedback, setSaveFeedback] = useState(false);

  const [board, setBoard] = useState<(Piece | null)[][]>([]);
  const [dyingPieces, setDyingPieces] = useState<Piece[]>([]);
  const [scaredPieceId, setScaredPieceId] = useState<string | null>(null);
  const [turn, setTurn] = useState<Player>('red');
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [forcedCapture, setForcedCapture] = useState<string | null>(null);
  const [scores, setScores] = useState({ red: INITIAL_PIECES, blue: INITIAL_PIECES });
  const [roundWins, setRoundWins] = useState({ red: 0, blue: 0 });
  const [currentRound, setCurrentRound] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [activeMoveTarget, setActiveMoveTarget] = useState<Position | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isRoundTransition, setIsRoundTransition] = useState(false);
  
  // Start sequence state
  const [showIntro, setShowIntro] = useState(false);
  const [introStep, setIntroStep] = useState<'round' | 'fight' | 'none'>('none');

  const handleSaveSettings = () => {
    localStorage.setItem('toon_checkers_rules', JSON.stringify(rules));
    setSaveFeedback(true);
    playSound.king();
    setTimeout(() => {
      setSaveFeedback(false);
      setGameState('menu');
    }, 800);
  };

  const initGame = (mode: GameMode, diff: Difficulty = 'medium') => {
    setRoundWins({ red: 0, blue: 0 });
    setCurrentRound(1);
    startRound(1, mode, diff);
  };

  const startRound = (round: number, mode: GameMode = gameMode, diff: Difficulty = difficulty) => {
    const newBoard: (Piece | null)[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    let idCounter = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) {
          if (row < 3) newBoard[row][col] = { id: `blue-r${round}-${idCounter++}`, player: 'blue', isKing: false, position: { row, col }, isCaptured: false };
          else if (row > 4) newBoard[row][col] = { id: `red-r${round}-${idCounter++}`, player: 'red', isKing: false, position: { row, col }, isCaptured: false };
        }
      }
    }
    setBoard(newBoard);
    setDyingPieces([]);
    setScaredPieceId(null);
    setTurn('red');
    setGameMode(mode);
    setDifficulty(diff);
    setScores({ red: INITIAL_PIECES, blue: INITIAL_PIECES });
    setGameState('playing');
    setWinner(null);
    setForcedCapture(null);
    setSelectedPieceId(null);
    setValidMoves([]);
    setComboCount(0);
    setActiveMoveTarget(null);
    setIsAIThinking(false);
    setShowDifficultySelect(false);
    setCurrentRound(round);
    setIsRoundTransition(false);

    // Trigger Fighting Intro
    setShowIntro(true);
    setIntroStep('round');
    playSound.fightIntro();
    
    setTimeout(() => {
      setIntroStep('fight');
      playSound.fightGo();
    }, 1200);

    setTimeout(() => {
      setShowIntro(false);
      setIntroStep('none');
    }, 2200);
  };

  const getPieceAt = (b: (Piece | null)[][], pos: Position) => {
    if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) return null;
    return b[pos.row][pos.col];
  };

  const calculateValidMoves = (piece: Piece, currentBoard: (Piece | null)[][]): Move[] => {
    const moves: Move[] = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    if (piece.isKing && rules.flyingKings) {
      directions.forEach(([dr, dc]) => {
        let r = piece.position.row + dr;
        let c = piece.position.col + dc;
        let enemyFound: Piece | null = null;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const targetPiece = currentBoard[r][c];
          if (!targetPiece) {
            if (!enemyFound) moves.push({ from: piece.position, to: { row: r, col: c }, isJump: false });
            else moves.push({ from: piece.position, to: { row: r, col: c }, isJump: true, capturedPieceId: enemyFound.id, jumpedPosition: enemyFound.position });
          } else {
            if (targetPiece.player === piece.player) break;
            if (enemyFound) break;
            enemyFound = targetPiece;
          }
          r += dr; c += dc;
        }
      });
    } else {
      directions.forEach(([dr, dc]) => {
        const isForward = piece.player === 'red' ? dr < 0 : dr > 0;
        const canMoveDir = piece.isKing || isForward;
        const canJumpDir = piece.isKing || isForward || rules.backwardCapture;
        const targetPos = { row: piece.position.row + dr, col: piece.position.col + dc };
        const jumpPos = { row: piece.position.row + dr * 2, col: piece.position.col + dc * 2 };
        if (canMoveDir && targetPos.row >= 0 && targetPos.row < BOARD_SIZE && targetPos.col >= 0 && targetPos.col < BOARD_SIZE && !getPieceAt(currentBoard, targetPos)) {
            moves.push({ from: piece.position, to: targetPos, isJump: false });
        }
        if (canJumpDir && jumpPos.row >= 0 && jumpPos.row < BOARD_SIZE && jumpPos.col >= 0 && jumpPos.col < BOARD_SIZE) {
          const midPiece = getPieceAt(currentBoard, targetPos);
          if (midPiece && midPiece.player !== piece.player && !getPieceAt(currentBoard, jumpPos)) {
            moves.push({ from: piece.position, to: jumpPos, isJump: true, capturedPieceId: midPiece.id, jumpedPosition: targetPos });
          }
        }
      });
    }
    return moves;
  };

  const getAllValidMovesForPlayer = (player: Player, currentBoard: (Piece | null)[][]) => {
    let allMoves: { pieceId: string, move: Move }[] = [];
    let hasJump = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const p = currentBoard[r][c];
        if (p && p.player === player && !p.isCaptured) {
          const moves = calculateValidMoves(p, currentBoard);
          moves.forEach(m => {
            if (m.isJump) hasJump = true;
            allMoves.push({ pieceId: p.id, move: m });
          });
        }
      }
    }
    if (hasJump && rules.forcedCapture) allMoves = allMoves.filter(m => m.move.isJump);
    return { allMoves, hasJump };
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState !== 'playing' || showIntro || (gameMode === 'pve' && turn === AI_PLAYER)) return;
    const clickedPiece = board[row][col];
    if (clickedPiece?.player === turn) {
      if (forcedCapture && forcedCapture !== clickedPiece.id) { playSound.error(); return; }
      const { allMoves, hasJump } = getAllValidMovesForPlayer(turn, board);
      if (hasJump && rules.forcedCapture && !allMoves.some(m => m.pieceId === clickedPiece.id && m.move.isJump)) { playSound.error(); return; }
      setSelectedPieceId(clickedPiece.id);
      setValidMoves(allMoves.filter(m => m.pieceId === clickedPiece.id).map(m => m.move));
      playSound.move();
    } else if (!clickedPiece && selectedPieceId) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) executeMove(move);
      else { setSelectedPieceId(null); setValidMoves([]); }
    }
  };

  const executeMove = async (move: Move) => {
    const piece = getPieceAt(board, move.from);
    if (!piece) return;

    if (move.isJump && move.jumpedPosition) {
      const captured = board[move.jumpedPosition.row][move.jumpedPosition.col];
      if (captured) {
        setScaredPieceId(captured.id);
        await new Promise(resolve => setTimeout(resolve, 350));
        setScaredPieceId(null);
      }
    }

    setActiveMoveTarget(move.to);
    setTimeout(() => setActiveMoveTarget(null), 600);
    const newBoard = board.map(row => row.map(p => p ? { ...p } : null));
    const movedPiece = newBoard[move.from.row][move.from.col]!;
    newBoard[move.from.row][move.from.col] = null;
    newBoard[move.to.row][move.to.col] = movedPiece;
    movedPiece.position = move.to;

    let justCaptured = false;
    if (move.isJump && move.jumpedPosition) {
      const captured = newBoard[move.jumpedPosition.row][move.jumpedPosition.col];
      if (captured) {
        setDyingPieces(prev => [...prev, captured]);
        setTimeout(() => {
          setDyingPieces(prev => prev.filter(p => p.id !== captured.id));
        }, 800);
      }
      newBoard[move.jumpedPosition.row][move.jumpedPosition.col] = null;
      setScores(prev => ({ ...prev, [turn === 'red' ? 'blue' : 'red']: Math.max(0, prev[turn === 'red' ? 'blue' : 'red'] - 1) }));
      justCaptured = true;
      setComboCount(c => c + 1);
      spawnParticles(move.to.row, move.to.col, comboCount > 0 ? TAUNTS_EPIC[Math.floor(Math.random()*TAUNTS_EPIC.length)] : TAUNTS_SIMPLE[Math.floor(Math.random()*TAUNTS_SIMPLE.length)], comboCount > 0);
      playSound.capture();
    } else { setComboCount(0); playSound.move(); }

    if (!movedPiece.isKing) {
      if ((movedPiece.player === 'red' && move.to.row === 0) || (movedPiece.player === 'blue' && move.to.row === BOARD_SIZE - 1)) {
        movedPiece.isKing = true;
        playSound.king();
        spawnParticles(move.to.row, move.to.col, "REI!", true);
      }
    }
    setBoard(newBoard);
    setSelectedPieceId(null);
    setValidMoves([]);
    if (justCaptured) {
      const nextMoves = calculateValidMoves(movedPiece, newBoard).filter(m => m.isJump);
      if (nextMoves.length > 0) {
        setForcedCapture(movedPiece.id);
        if (movedPiece.player === HUMAN_PLAYER || gameMode === 'pvp') {
          setSelectedPieceId(movedPiece.id);
          setValidMoves(nextMoves);
        }
        return;
      }
    }
    endTurn(newBoard, movedPiece.player);
  };

  const endTurn = (currentBoard: (Piece | null)[][], currentPlayer: Player) => {
    setForcedCapture(null);
    setComboCount(0);
    const nextPlayer = currentPlayer === 'red' ? 'blue' : 'red';
    const { allMoves } = getAllValidMovesForPlayer(nextPlayer, currentBoard);
    
    if (allMoves.length === 0) {
      handleRoundEnd(currentPlayer);
    } else { 
      setTurn(nextPlayer); 
    }
  };

  const handleRoundEnd = (roundWinner: Player) => {
    const updatedWins = { ...roundWins, [roundWinner]: roundWins[roundWinner] + 1 };
    setRoundWins(updatedWins);
    setIsRoundTransition(true);
    playSound.win();
    
    setTimeout(() => {
        if (updatedWins[roundWinner] >= 2) {
          setWinner(roundWinner);
          setGameState('winner');
          setIsRoundTransition(false);
          // Reward coins
          if (roundWinner === 'red') {
            setCoins(c => c + 100); // 100 coins for winning
          } else {
            setCoins(c => c + 20); // 20 coins for participating/losing
          }
        } else {
          startRound(currentRound + 1);
        }
    }, 2000);
  };

  const isScared = (p: Piece, currentBoard: (Piece | null)[][]) => {
    if (scaredPieceId === p.id) return true;
    if (p.isKing) return false;
    const adj = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];
    return adj.some(([dr, dc]) => {
        const nr = p.position.row + dr;
        const nc = p.position.col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const piece = currentBoard[nr][nc];
            return piece && piece.player !== p.player && piece.isKing;
        }
        return false;
    });
  };

  useEffect(() => {
    if (gameState !== 'playing' || showIntro || gameMode !== 'pve' || turn !== AI_PLAYER) return;
    setIsAIThinking(true);
    const timer = setTimeout(async () => {
      const { allMoves } = getAllValidMovesForPlayer(AI_PLAYER, board);
      const candidates = forcedCapture ? allMoves.filter(m => m.pieceId === forcedCapture) : allMoves;
      if (candidates.length > 0) {
        const best = candidates.sort((a,b) => (b.move.isJump ? 10 : 0) - (a.move.isJump ? 10 : 0))[0];
        executeMove(best.move);
      }
      setIsAIThinking(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [turn, gameState, gameMode, forcedCapture, showIntro]);

  const spawnParticles = (row: number, col: number, text?: string, gold: boolean = false) => {
    const id = Date.now().toString() + Math.random();
    setParticles(prev => [...prev, { id, row, col, color: gold ? '#FFD700' : '#FFF', text }]);
    setTimeout(() => { setParticles(prev => prev.filter(p => p.id !== id)); }, 1200);
  };

  const renderSquare = (row: number, col: number) => {
    const isBlack = (row + col) % 2 === 1;
    const piece = board[row][col];
    const dyingPiece = dyingPieces.find(p => p.position.row === row && p.position.col === col);
    const isPossibleMove = validMoves.some(m => m.to.row === row && m.to.col === col);
    
    return (
      <div key={`${row}-${col}`} onClick={() => handleSquareClick(row, col)} className="relative w-full h-full flex items-center justify-center transition-colors duration-500" 
           style={{ 
             backgroundColor: customAssets.boardBg ? (isBlack ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.2)') : (isBlack ? currentTheme.boardDark : currentTheme.boardLight), 
             boxShadow: isBlack ? 'inset 0 0 8px rgba(0,0,0,0.5)' : 'inset 0 0 8px rgba(255,255,255,0.5)' 
           }}>
        {isPossibleMove && <div className="absolute inset-1 bg-green-400 rounded-full animate-pulse opacity-40"></div>}
        {piece && <ToonPiece 
          piece={piece} 
          isSelected={selectedPieceId === piece.id} 
          canMove={turn === piece.player && !showIntro && !(gameMode === 'pve' && turn === AI_PLAYER)} 
          focusTarget={activeMoveTarget} 
          onClick={() => handleSquareClick(row, col)} 
          theme={piece.player === 'red' ? currentTheme.red : currentTheme.blue} 
          model={rules.pieceModel}
          isScared={isScared(piece, board)}
          customAssets={customAssets}
          equippedPieceId={equippedPieceId}
          customStorePieces={customStorePieces}
        />}
        {dyingPiece && <ToonPiece 
          piece={dyingPiece} 
          isSelected={false}
          canMove={false}
          focusTarget={null}
          onClick={() => {}}
          theme={dyingPiece.player === 'red' ? currentTheme.red : currentTheme.blue}
          model={rules.pieceModel}
          isDying={true}
          deathEffect={rules.deathEffect}
          customAssets={customAssets}
          equippedPieceId={equippedPieceId}
          customStorePieces={customStorePieces}
        />}
        {particles.filter(p => p.row === row && p.col === col).map(p => (
           <div key={p.id} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-pop">
              <span className="text-xl md:text-2xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,1)]" style={{ color: p.color }}>{p.text}</span>
           </div>
        ))}
      </div>
    );
  };

  const Toggle: React.FC<{ label: string, desc: string, active: boolean, onToggle: () => void }> = ({ label, desc, active, onToggle }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700 w-full hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all">
      <div className="flex flex-col">
        <span className="font-black text-white">{label}</span>
        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{desc}</span>
      </div>
      <button onClick={onToggle} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${active ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-600'}`}>
        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${active ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen h-[100dvh] bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden select-none touch-none">
      {/* Dynamic Arena Background - Always visible but dimmed during playing */}
      <DynamicBackground theme={currentTheme} isPlaying={gameState === 'playing'} />
      
      {/* Custom Backgrounds */}
      {gameState === 'login' && customAssets.loginBg && (
        <div className="absolute inset-0 z-[75] bg-cover bg-center" style={{ backgroundImage: `url(${customAssets.loginBg})` }} />
      )}
      {gameState === 'menu' && customAssets.homeBg && (
        <div className="absolute inset-0 z-[5] bg-cover bg-center" style={{ backgroundImage: `url(${customAssets.homeBg})` }} />
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black pointer-events-none z-0" style={{ opacity: customAssets.backgroundOpacity }} />

      {/* Intro Overlay Sequence */}
      {showIntro && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-black/40 animate-screen-flash"></div>
          
          {introStep === 'round' && (
             <div className="relative animate-slide-round flex flex-col items-center">
                <div className="text-white text-3xl md:text-5xl font-black italic tracking-tighter drop-shadow-2xl">
                  {currentRound === 3 ? 'ULTIMATE CLASH' : `GET READY`}
                </div>
                <div className="text-yellow-400 text-6xl md:text-9xl font-black italic tracking-tighter drop-shadow-2xl -mt-2">
                   {currentRound === 3 ? 'FINAL ROUND' : `ROUND ${currentRound}`}
                </div>
             </div>
          )}
          
          {introStep === 'fight' && (
             <div className="relative animate-zoom-fight flex flex-col items-center">
                <div className="text-rose-500 text-8xl md:text-[12rem] font-black italic tracking-tighter drop-shadow-[0_10px_0_rgba(0,0,0,1)] flex flex-col items-center leading-none">
                   <span className="text-white text-2xl md:text-4xl not-italic mb-2">ARE YOU READY?</span>
                   FIGHT!
                </div>
             </div>
          )}
        </div>
      )}

      {/* Loading Screen */}
      {gameState === 'loading' && (
        <div className="absolute inset-0 z-[90] bg-slate-950 flex flex-col items-center justify-center animate-fade-in">
           <div className="w-24 h-24 border-8 border-slate-800 border-t-yellow-400 rounded-full animate-spin mb-8"></div>
           <h2 className="text-4xl font-black text-white tracking-tighter animate-pulse">CARREGANDO...</h2>
        </div>
      )}

      {/* Login Screen */}
      {gameState === 'login' && (
        <div className="absolute inset-0 z-[80] login-gradient flex flex-col items-center justify-center p-6 animate-fade-in">
           <div className="relative z-10 w-full max-sm:max-w-[340px] max-w-sm flex flex-col items-center bg-slate-900/90 backdrop-blur-2xl p-10 rounded-[2rem] border border-slate-700 shadow-2xl animate-pop">
              <div className="text-center mb-10 animate-logo">
                 <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 tracking-tighter drop-shadow-lg">TOON</h1>
                 <h2 className="text-4xl font-black text-white tracking-tighter -mt-2 drop-shadow-md">CHECKERS</h2>
              </div>

              <div className="w-full space-y-6">
                 <div className="relative">
                    <input 
                       type="text" 
                       placeholder="Digite seu apelido..." 
                       value={nickname}
                       onChange={(e) => setNickname(e.target.value.substring(0, 12))}
                       className="w-full bg-slate-950/50 border-2 border-slate-700 rounded-2xl py-4 px-6 font-bold text-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                    />
                 </div>

                 <button 
                    disabled={!nickname.trim()}
                    onClick={() => {
                       playSound.fightGo();
                       setGameState('loading');
                       setTimeout(() => setGameState('menu'), 2000);
                    }}
                    className={`group relative w-full py-5 rounded-2xl font-black text-3xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${nickname.trim() ? 'bg-green-500 hover:bg-green-400 border-b-8 border-green-700 hover:border-b-4 hover:translate-y-1' : 'bg-slate-700 border-b-8 border-slate-900 cursor-not-allowed'}`}
                 >
                    <span className="relative z-10 text-white drop-shadow-md group-hover:scale-110 inline-block transition-transform">JOGAR!</span>
                    {nickname.trim() && (
                       <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    )}
                 </button>
              </div>

              <div className="mt-8 flex items-center gap-4">
                 <div className="w-8 h-8 md:w-10 md:h-10 text-2xl animate-bounce">👇</div>
                 <div className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center">Batalhe contra a CPU ou<br/>amigos localmente!</div>
              </div>
           </div>
           
           <div className="absolute bottom-8 text-slate-600 font-black text-xs uppercase tracking-[0.2em] animate-pulse">
              © 2025 PREMIUM TOON GAMES
           </div>
        </div>
      )}

      {/* Header Battle UI */}
      {gameState === 'playing' && (
        <div className="relative w-full max-w-4xl flex items-center justify-between p-3 md:p-6 z-20 flex-shrink-0">
          <BattleBar player="blue" score={scores.blue} roundWins={roundWins.blue} theme={currentTheme} active={turn === 'blue'} />
          <div className="flex flex-col items-center mx-4 w-32 md:w-48">
            <h1 className="text-xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 tracking-tighter drop-shadow-md whitespace-nowrap">TOON FIGHT!</h1>
            <div className="text-[8px] md:text-[10px] text-yellow-400 font-bold uppercase animate-pulse h-3 md:h-4 flex items-center justify-center">
              {isAIThinking ? 'CPU PENSANDO...' : `ROUND ${currentRound}`}
            </div>
          </div>
          <BattleBar player="red" score={scores.red} roundWins={roundWins.red} theme={currentTheme} reverse active={turn === 'red'} />
          <button onClick={() => setGameState('menu')} className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-800 hover:bg-red-600 text-[10px] font-black rounded-b-xl transition-all">DESISTIR</button>
        </div>
      )}

      {/* Main Content */}
      <main className={`relative z-10 flex items-center justify-center w-full flex-grow p-1 ${rules.is25D ? 'perspective-board' : ''}`}>
        {gameState === 'playing' ? (
          <div 
            className={`relative w-[96vw] h-[96vw] max-w-[500px] max-h-[500px] md:w-[min(600px,70vmin)] md:h-[min(600px,70vmin)] bg-slate-950/60 backdrop-blur-sm p-1 md:p-4 rounded-lg md:rounded-2xl shadow-2xl border-b-8 border-slate-950 transition-transform duration-500 ${isRoundTransition ? 'animate-zoom-out' : ''} ${rules.is25D ? 'board-tilt' : ''}`}
            style={customAssets.boardBg ? { backgroundImage: `url(${customAssets.boardBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
          >
            <div className="w-full h-full rounded-md md:rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 shadow-inner ring-4 md:ring-8 ring-slate-800" style={{ borderColor: currentTheme.boardDark }}>
              {board.map((row, r) => row.map((_, c) => renderSquare(r, c)))}
            </div>
            
            {/* Score Overlay during Zoom Out */}
            {isRoundTransition && (
               <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-pop">
                  <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,1)] uppercase mb-4 tracking-tighter text-center">
                     {roundWins.red > roundWins.blue ? 'P1 Venceu!' : roundWins.blue > roundWins.red ? 'P2 Venceu!' : 'Empate?'}
                  </div>
                  <div className="flex items-center gap-8 bg-black/50 p-6 rounded-3xl backdrop-blur-md border-2 border-white/20">
                     <div className="flex flex-col items-center">
                       <div className="text-rose-500 text-6xl md:text-8xl font-black drop-shadow-xl">{roundWins.red}</div>
                       <div className="text-xs font-bold uppercase tracking-widest text-rose-300">P1 (Red)</div>
                     </div>
                     <div className="text-white text-4xl font-black opacity-50">-</div>
                     <div className="flex flex-col items-center">
                       <div className="text-sky-500 text-6xl md:text-8xl font-black drop-shadow-xl">{roundWins.blue}</div>
                       <div className="text-xs font-bold uppercase tracking-widest text-sky-300">P2 (Blue)</div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        ) : gameState === 'menu' ? (
          <div className="flex flex-col items-center justify-center animate-fade-in p-6 w-full max-w-md">
            {customAssets.showCoins && (
              <div className="absolute top-6 right-6 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border-2 border-yellow-400/50 flex items-center gap-2 shadow-lg">
                <span className="text-xl">💰</span>
                <span className="text-yellow-400 font-black text-xl">{coins}</span>
              </div>
            )}
            <div className="mb-4 flex flex-col items-center">
               <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-[10px] font-black uppercase mb-2 animate-bounce">
                 {customAssets.welcomeText.replace('{nickname}', nickname || 'Jogador')}
               </span>
               <div className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl animate-float flex flex-col text-center">
                 <span className="text-yellow-400 scale-75">TOON</span>
                 <span className="mt-[-1rem]">CHECKERS</span>
               </div>
            </div>
            <div className="flex flex-col gap-4 w-full mb-10">
              <button onClick={() => setShowDifficultySelect(true)} className={`w-full px-8 py-5 bg-purple-600 hover:bg-purple-500 text-white ${customAssets.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none'} font-black text-xl shadow-[0_6px_0_rgb(88,28,135)] active:translate-y-[6px] active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400`} style={{ backgroundColor: customAssets.primaryColor }}>
                {customAssets.arcadeButtonImage ? <img src={customAssets.arcadeButtonImage} alt="Arcade" /> : customAssets.arcadeButtonLabel}
              </button>
              <button onClick={() => initGame('pvp')} className={`w-full px-8 py-5 bg-green-600 hover:bg-green-500 text-white ${customAssets.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none'} font-black text-xl shadow-[0_6px_0_rgb(20,83,45)] active:translate-y-[6px] active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400`} style={{ backgroundColor: customAssets.primaryColor }}>
                {customAssets.versusButtonImage ? <img src={customAssets.versusButtonImage} alt="Versus" /> : customAssets.versusButtonLabel}
              </button>
              <button onClick={() => setGameState('store')} className={`w-full px-8 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-900 ${customAssets.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none'} font-black text-xl shadow-[0_6px_0_rgb(161,98,7)] active:translate-y-[6px] active:shadow-none transition-all hover:ring-4 hover:ring-white flex items-center justify-center gap-2`} style={{ backgroundColor: customAssets.accentColor }}>
                {customAssets.storeButtonImage ? <img src={customAssets.storeButtonImage} alt="Store" /> : customAssets.storeButtonLabel}
              </button>
              <button onClick={() => setGameState('settings')} className={`w-full px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white ${customAssets.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none'} font-black text-lg shadow-[0_5px_0_rgb(31,41,55)] active:translate-y-[5px] active:shadow-none transition-all flex items-center justify-center gap-2 hover:ring-4 hover:ring-yellow-400`} style={{ backgroundColor: customAssets.primaryColor }}>
                {customAssets.settingsButtonImage ? <img src={customAssets.settingsButtonImage} alt="Settings" /> : customAssets.settingsButtonLabel}
              </button>
              <button onClick={() => setGameState('admin')} className="w-full px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-lg shadow-[0_5px_0_rgb(15,23,42)] active:translate-y-[5px] active:shadow-none transition-all flex items-center justify-center gap-2 hover:ring-4 hover:ring-yellow-400">🖼️ ADMIN (IMAGENS)</button>
              <button onClick={() => setGameState('login')} className="text-slate-500 font-bold text-xs hover:text-white uppercase tracking-widest mt-4">← TROCAR NICKNAME</button>
            </div>
          </div>
        ) : gameState === 'admin' ? (
          <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col items-center p-6 overflow-y-auto backdrop-blur-xl">
            <div className="w-full max-w-md pb-32">
              <div className="flex items-center justify-between mb-8 mt-4">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">ADMIN</h2>
                <button onClick={() => setGameState('menu')} className="p-3 bg-rose-500 rounded-full font-black text-lg hover:scale-110 transition-transform">✖️</button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6 w-full">
                {['Tabuleiros', 'Sons', 'Home', 'Login', 'Peças'].map(tab => (
                  <button key={tab} onClick={() => setAdminTab(tab as any)} className={`px-4 py-2 rounded-xl font-black text-sm ${adminTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-white'}`}>{tab}</button>
                ))}
              </div>

              {adminTab === 'Tabuleiros' && (
                <div className="flex flex-col gap-6 mb-10">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Adicionar Tabuleiro à Loja</p>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border-2 border-slate-700 flex flex-col gap-4">
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Nome do Tabuleiro</label>
                      <input 
                        type="text" 
                        value={newBoardName} 
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="Ex: Tabuleiro Épico"
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">URL da Imagem de Fundo do Tabuleiro</label>
                      <input 
                        type="text" 
                        value={newBoardUrl} 
                        onChange={(e) => setNewBoardUrl(e.target.value)}
                        placeholder="URL da imagem (ex: https://...)"
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Preço (Moedas)</label>
                      <input 
                        type="number" 
                        value={newBoardPrice} 
                        onChange={(e) => setNewBoardPrice(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (!newBoardName || !newBoardUrl) return;
                        const newBoard = {
                          id: 'custom_' + Date.now(),
                          name: newBoardName,
                          bgUrl: newBoardUrl,
                          price: newBoardPrice
                        };
                        setCustomStoreBoards([...customStoreBoards, newBoard]);
                        setNewBoardName('');
                        setNewBoardUrl('');
                        setNewBoardPrice(100);
                      }}
                      className="w-full py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-black rounded-xl mt-2"
                    >
                      ADICIONAR À LOJA
                    </button>
                  </div>
                </div>
              )}

              {adminTab === 'Peças' && (
                <div className="flex flex-col gap-6 mb-10">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Personalizar Peças</p>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border-2 border-slate-700 flex flex-col gap-4">
                    {[
                      { key: 'redPieceImage', label: 'Peça Vermelha', value: newRedPieceImage, setter: setNewRedPieceImage },
                      { key: 'bluePieceImage', label: 'Peça Azul', value: newBluePieceImage, setter: setNewBluePieceImage },
                      { key: 'redKingPieceImage', label: 'Peça Rei Vermelho', value: newRedKingPieceImage, setter: setNewRedKingPieceImage },
                      { key: 'blueKingPieceImage', label: 'Peça Rei Azul', value: newBlueKingPieceImage, setter: setNewBlueKingPieceImage }
                    ].map(piece => (
                      <div key={piece.key}>
                        <label className="text-white font-bold text-sm mb-2 block">{piece.label}</label>
                        <input 
                          type="text" 
                          value={piece.value} 
                          onChange={(e) => piece.setter(e.target.value)}
                          placeholder="URL da imagem"
                          className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Nome do Conjunto</label>
                      <input 
                        type="text" 
                        value={newPieceName} 
                        onChange={(e) => setNewPieceName(e.target.value)}
                        placeholder="Ex: Peças de Ouro"
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Preço (Moedas)</label>
                      <input 
                        type="number" 
                        value={newPiecePrice} 
                        onChange={(e) => setNewPiecePrice(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        if (newPieceName && newRedPieceImage && newBluePieceImage) {
                          setCustomStorePieces(prev => [...prev, { 
                            id: 'piece_' + Date.now(), 
                            name: newPieceName, 
                            redPieceImage: newRedPieceImage, 
                            bluePieceImage: newBluePieceImage, 
                            redKingPieceImage: newRedKingPieceImage, 
                            blueKingPieceImage: newBlueKingPieceImage, 
                            price: newPiecePrice 
                          }]);
                          setNewPieceName('');
                          setNewRedPieceImage('');
                          setNewBluePieceImage('');
                          setNewRedKingPieceImage('');
                          setNewBlueKingPieceImage('');
                          setNewPiecePrice(100);
                        }
                      }}
                      className="w-full py-3 bg-green-500 hover:bg-green-400 text-slate-900 font-black rounded-xl mt-2"
                    >
                      ADICIONAR À LOJA
                    </button>
                  </div>
                </div>
              )}

              {adminTab === 'Home' && (
                <div className="flex flex-col gap-6 mb-10">
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Fundo da Home</label>
                    <input 
                      type="text" 
                      value={customAssets.homeBg} 
                      onChange={(e) => setCustomAssets({...customAssets, homeBg: e.target.value})}
                      placeholder="URL da imagem (ex: https://...)"
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Logotipo</label>
                    <input 
                      type="text" 
                      value={customAssets.logoUrl || ''} 
                      onChange={(e) => setCustomAssets({...customAssets, logoUrl: e.target.value})}
                      placeholder="URL da imagem do logo (ex: https://...)"
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Texto de Boas-vindas</label>
                    <input 
                      type="text" 
                      value={customAssets.welcomeText} 
                      onChange={(e) => setCustomAssets({...customAssets, welcomeText: e.target.value})}
                      placeholder="Ex: Bem-vindo, {nickname}!"
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Cor Primária</label>
                      <input type="color" value={customAssets.primaryColor} onChange={(e) => setCustomAssets({...customAssets, primaryColor: e.target.value})} className="w-full h-10 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-white font-bold text-sm mb-2 block">Cor de Destaque</label>
                      <input type="color" value={customAssets.accentColor} onChange={(e) => setCustomAssets({...customAssets, accentColor: e.target.value})} className="w-full h-10 rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Opacidade do Fundo: {customAssets.backgroundOpacity}</label>
                    <input type="range" min="0" max="1" step="0.1" value={customAssets.backgroundOpacity} onChange={(e) => setCustomAssets({...customAssets, backgroundOpacity: parseFloat(e.target.value)})} className="w-full" />
                  </div>
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Estilo dos Botões</label>
                    <select value={customAssets.buttonStyle} onChange={(e) => setCustomAssets({...customAssets, buttonStyle: e.target.value as 'rounded' | 'square'})} className="w-full bg-slate-800 p-3 rounded-xl text-white">
                      <option value="rounded">Arredondado</option>
                      <option value="square">Quadrado</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-white font-bold text-sm">
                      <input type="checkbox" checked={customAssets.showCoins} onChange={(e) => setCustomAssets({...customAssets, showCoins: e.target.checked})} />
                      Mostrar Moedas
                    </label>
                    <label className="flex items-center gap-2 text-white font-bold text-sm">
                      <input type="checkbox" checked={customAssets.showFooter} onChange={(e) => setCustomAssets({...customAssets, showFooter: e.target.checked})} />
                      Mostrar Rodapé
                    </label>
                  </div>
                  {['arcade', 'versus', 'store', 'settings'].map(btn => (
                    <div key={btn}>
                      <label className="text-white font-bold text-sm mb-2 block">Botão {btn.charAt(0).toUpperCase() + btn.slice(1)}</label>
                      <input type="text" value={customAssets[`${btn}ButtonLabel` as keyof typeof customAssets] as string} onChange={(e) => setCustomAssets({...customAssets, [`${btn}ButtonLabel`]: e.target.value})} placeholder="Rótulo" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white mb-2" />
                      <input type="text" value={customAssets[`${btn}ButtonImage` as keyof typeof customAssets] as string} onChange={(e) => setCustomAssets({...customAssets, [`${btn}ButtonImage`]: e.target.value})} placeholder="URL da imagem (opcional)" className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white" />
                    </div>
                  ))}
                </div>
              )}

              {adminTab === 'Login' && (
                <div className="flex flex-col gap-6 mb-10">
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Fundo do Login</label>
                    <input 
                      type="text" 
                      value={customAssets.loginBg} 
                      onChange={(e) => setCustomAssets({...customAssets, loginBg: e.target.value})}
                      placeholder="URL da imagem (ex: https://...)"
                      className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {adminTab === 'Sons' && (
                <div className="flex flex-col gap-6 mb-10">
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Configurações de Sons (Em breve)</p>
                </div>
              )}
            </div>
          </div>
        ) : gameState === 'store' ? (
          <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col items-center p-6 overflow-y-auto backdrop-blur-xl">
            <div className="w-full max-w-4xl pb-32">
               <div className="flex items-center justify-between mb-8 mt-4">
                 <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">LOJA</h2>
                 <div className="flex items-center gap-4">
                   <div className="bg-slate-800 px-4 py-2 rounded-full border-2 border-yellow-400/50 flex items-center gap-2 shadow-lg">
                     <span className="text-xl">💰</span>
                     <span className="text-yellow-400 font-black text-xl">{coins}</span>
                   </div>
                   <button onClick={() => setGameState('menu')} className="p-3 bg-rose-500 rounded-full font-black text-lg hover:scale-110 transition-transform">✖️</button>
                 </div>
               </div>

                               <div className="flex flex-wrap gap-2 mb-6 w-full">
                  {['Tabuleiros', 'Peças'].map(tab => (
                    <button key={tab} onClick={() => setStoreTab(tab as any)} className={`px-4 py-2 rounded-xl font-black text-sm ${storeTab === tab ? 'bg-yellow-400 text-slate-900' : 'bg-slate-700 text-white'}`}>{tab}</button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {storeTab === 'Tabuleiros' && customStoreBoards.map(board => {
                     const isUnlocked = unlockedBoards.includes(board.id);
                     const isEquipped = customAssets.boardBg === board.bgUrl;

                     return (
                       <div key={board.id} className="bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-700 flex flex-col">
                         <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${board.bgUrl})` }} />
                         <div className="p-4 flex flex-col flex-grow justify-between">
                           <h3 className="text-xl font-black text-white mb-2">{board.name}</h3>
                           {isUnlocked ? (
                             <button 
                               onClick={() => setCustomAssets({...customAssets, boardBg: board.bgUrl})}
                               className={`w-full py-3 rounded-xl font-black ${isEquipped ? 'bg-green-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
                             >
                               {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                             </button>
                           ) : (
                             <button 
                               onClick={() => {
                                 if (coins >= board.price) {
                                   setCoins(coins - board.price);
                                   setUnlockedBoards([...unlockedBoards, board.id]);
                                 } else {
                                   alert('Moedas insuficientes!');
                                 }
                               }}
                               className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 ${coins >= board.price ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                             >
                               <span>💰</span> {board.price}
                             </button>
                           )}
                         </div>
                       </div>
                     );
                  })}
                  {storeTab === 'Tabuleiros' && customStoreBoards.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 font-bold py-10">
                      Nenhum tabuleiro disponível na loja no momento. Adicione no menu Admin.
                    </div>
                  )}

                  {storeTab === 'Peças' && customStorePieces.map(piece => {
                     const isUnlocked = unlockedPieces.includes(piece.id);
                     const isEquipped = equippedPieceId === piece.id;

                     return (
                       <div key={piece.id} className="bg-slate-800 rounded-2xl overflow-hidden border-4 border-slate-700 flex flex-col p-4">
                         <div className="flex justify-center gap-2 mb-4">
                           <img src={piece.redPieceImage} alt="Red" className="w-12 h-12" />
                           <img src={piece.bluePieceImage} alt="Blue" className="w-12 h-12" />
                         </div>
                         <h3 className="text-xl font-black text-white mb-2 text-center">{piece.name}</h3>
                         {isUnlocked ? (
                           <button 
                             onClick={() => setEquippedPieceId(piece.id)}
                             className={`w-full py-3 rounded-xl font-black ${isEquipped ? 'bg-green-500 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
                           >
                             {isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                           </button>
                         ) : (
                           <button 
                             onClick={() => {
                               if (coins >= piece.price) {
                                 setCoins(coins - piece.price);
                                 setUnlockedPieces([...unlockedPieces, piece.id]);
                               } else {
                                 alert('Moedas insuficientes!');
                               }
                             }}
                             className={`w-full py-3 rounded-xl font-black flex items-center justify-center gap-2 ${coins >= piece.price ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                           >
                             <span>💰</span> {piece.price}
                           </button>
                         )}
                       </div>
                     );
                  })}
                  {storeTab === 'Peças' && customStorePieces.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 font-bold py-10">
                      Nenhuma peça disponível na loja no momento. Adicione no menu Admin.
                    </div>
                  )}
                </div>
            </div>
          </div>
        ) : gameState === 'settings' ? (
          <div className="absolute inset-0 bg-slate-900/98 z-50 flex flex-col items-center p-6 overflow-y-auto backdrop-blur-xl">
            <div className="w-full max-w-md pb-32">
              <div className="flex items-center justify-between mb-8 mt-4">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">CONFIGS</h2>
                <button onClick={() => setGameState('menu')} className="p-3 bg-rose-500 rounded-full font-black text-lg hover:scale-110 transition-transform">✖️</button>
              </div>

              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Regras da Partida</p>
              <div className="flex flex-col gap-4 mb-10">
                <Toggle label="Damas Voadoras" desc="REI DESLIZA PELO TABULEIRO" active={rules.flyingKings} onToggle={() => setRules({...rules, flyingKings: !rules.flyingKings})} />
                <Toggle label="Captura Traseira" desc="PEÇAS NORMAIS CAPTURAM PARA TRÁS" active={rules.backwardCapture} onToggle={() => setRules({...rules, backwardCapture: !rules.backwardCapture})} />
                <Toggle label="Sopro (Forçada)" desc="CAPTURA É OBRIGATÓRIA SE POSSÍVEL" active={rules.forcedCapture} onToggle={() => setRules({...rules, forcedCapture: !rules.forcedCapture})} />
              </div>

              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Visual das Peças (Skins)</p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {PIECE_MODELS.map(m => (
                  <button key={m.id} onClick={() => setRules({...rules, pieceModel: m.id})} className={`flex flex-col items-center p-4 rounded-3xl transition-all border-4 ${rules.pieceModel === m.id ? 'border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-105' : 'border-transparent bg-slate-800/40 opacity-60 hover:opacity-100 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]'}`}>
                    <span className="text-4xl mb-2">{m.icon}</span>
                    <span className="font-black text-xs uppercase tracking-tighter">{m.name}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-1">{m.desc}</span>
                  </button>
                ))}
              </div>

              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Efeitos de Morte</p>
              <div className="grid grid-cols-2 gap-4 mb-10">
                {DEATH_EFFECTS.map(d => (
                  <button key={d.id} onClick={() => setRules({...rules, deathEffect: d.id})} className={`flex flex-col items-center p-4 rounded-3xl transition-all border-4 ${rules.deathEffect === d.id ? 'border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-105' : 'border-transparent bg-slate-800/40 opacity-60 hover:opacity-100 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]'}`}>
                    <span className="text-4xl mb-2">{d.icon}</span>
                    <span className="font-black text-xs uppercase tracking-tighter">{d.name}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest mt-1">{d.desc}</span>
                  </button>
                ))}
              </div>

              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-left mb-4 px-2">Visual da Arena</p>
              <div className="flex flex-col gap-4 mb-4">
                <Toggle label="Modo 2.5D" desc="TABULEIRO COM PERSPECTIVA 3D" active={rules.is25D || false} onToggle={() => setRules({...rules, is25D: !rules.is25D})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => setCurrentTheme(t)} className={`flex flex-col items-center p-4 rounded-3xl transition-all border-4 ${currentTheme.id === t.id ? 'border-yellow-400 bg-slate-800 shadow-[0_0_20px_rgba(250,204,21,0.3)] scale-105' : 'border-transparent bg-slate-800/40 grayscale opacity-60 hover:opacity-100 hover:grayscale-0 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]'}`}>
                    <span className="text-4xl mb-2">{t.icon}</span>
                    <span className="font-black text-xs uppercase tracking-tighter">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent z-[60] flex justify-center backdrop-blur-sm">
              <button 
                onClick={handleSaveSettings}
                className={`w-full max-w-md py-5 rounded-2xl font-black text-2xl transition-all transform active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-center gap-3 border-b-4 ${saveFeedback ? 'bg-green-500 border-green-700 animate-pulse' : 'bg-yellow-500 text-slate-900 border-yellow-700 hover:ring-4 hover:ring-white active:translate-y-1 active:border-b-0'}`}
              >
                {saveFeedback ? '✅ CONFIGURADO!' : '💾 SALVAR E VOLTAR'}
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {showDifficultySelect && (
        <div className="absolute inset-0 bg-slate-900/98 z-[60] flex flex-col items-center justify-center p-6 backdrop-blur-md">
           <h2 className="text-4xl font-black mb-10 text-center uppercase tracking-tighter">QUAL SEU NÍVEL?</h2>
           <div className="flex flex-col gap-4 w-full max-w-xs">
             <button onClick={() => initGame('pve', 'easy')} className="w-full px-8 py-5 bg-teal-500 rounded-2xl font-black text-xl shadow-[0_5px_0_rgb(13,148,136)] active:translate-y-2 active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400">FÁCIL</button>
             <button onClick={() => initGame('pve', 'medium')} className="w-full px-8 py-5 bg-orange-500 rounded-2xl font-black text-xl shadow-[0_5px_0_rgb(194,65,12)] active:translate-y-2 active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400">MÉDIO</button>
             <button onClick={() => initGame('pve', 'hard')} className="w-full px-8 py-5 bg-red-600 rounded-2xl font-black text-xl shadow-[0_5px_0_rgb(153,27,27)] active:translate-y-2 active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400">DIFÍCIL</button>
             <button onClick={() => setShowDifficultySelect(false)} className="mt-8 text-slate-500 font-bold hover:text-white uppercase tracking-widest text-xs">← VOLTAR</button>
           </div>
        </div>
      )}

      {gameState === 'winner' && (
        <div className="absolute inset-0 bg-slate-900/95 z-[70] flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
           <div className="text-yellow-400 text-8xl md:text-9xl mb-4 animate-bounce drop-shadow-2xl">KO!</div>
           <h2 className={`text-4xl md:text-7xl font-black mb-4 text-center uppercase tracking-tighter ${winner === 'red' ? 'text-rose-500' : 'text-sky-500'}`}>
             {winner === 'red' ? 'P1 DOMINOU!' : 'P2 DOMINOU!'}
           </h2>
           <div className="text-yellow-400 font-black text-2xl mb-12 uppercase tracking-[0.2em]">{roundWins.red} - {roundWins.blue}</div>
           <div className="flex flex-col gap-6 w-full max-w-xs">
             <button onClick={() => initGame(gameMode, difficulty)} className="w-full px-10 py-5 bg-yellow-500 text-slate-900 rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(161,98,7)] active:translate-y-2 active:shadow-none transition-all transform hover:scale-105 hover:ring-4 hover:ring-yellow-400">REVANCHE</button>
             <button onClick={() => setGameState('menu')} className="w-full px-10 py-5 bg-slate-700 rounded-2xl font-black text-2xl shadow-[0_8px_0_rgb(31,41,55)] active:translate-y-2 active:shadow-none transition-all hover:ring-4 hover:ring-yellow-400">SAIR</button>
           </div>
        </div>
      )}

      <div className="absolute bottom-4 text-slate-700 text-[10px] font-bold tracking-widest uppercase opacity-40">
        ARENA: {currentTheme.name} | MODELO: {rules.pieceModel.toUpperCase()}
      </div>
    </div>
  );
};

export default App;