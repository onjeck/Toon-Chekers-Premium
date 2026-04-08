import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Piece, Position, PlayerTheme, PieceModelId, DeathEffectId } from '../types';

interface ToonPieceProps {
  piece: Piece;
  isSelected: boolean;
  canMove: boolean;
  onClick: () => void;
  focusTarget: Position | null;
  theme: PlayerTheme;
  model: PieceModelId;
  isScared?: boolean;
  isDying?: boolean;
  deathEffect?: DeathEffectId;
  customAssets?: any;
  equippedPieceId?: string;
  customStorePieces?: any[];
}

type IdleAction = 'none' | 'look-left' | 'look-right' | 'smirk' | 'ooh' | 'suspicious' | 'wiggle';

const ToonPiece: React.FC<ToonPieceProps> = ({ 
  piece, isSelected, onClick, canMove, focusTarget, theme, model, isScared, isDying, deathEffect = 'auto', customAssets, equippedPieceId, customStorePieces 
}) => {
  const [mood, setMood] = useState<'idle' | 'happy' | 'surprised' | 'focused' | 'evil' | 'scared'>('idle');
  const [idleAction, setIdleAction] = useState<IdleAction>('none');
  const [justBecameKing, setJustBecameKing] = useState(false);
  const timerRef = useRef<number>(0);
  const prevIsKingRef = useRef(piece.isKing);

  useEffect(() => {
    if (piece.isKing && !prevIsKingRef.current) {
        setJustBecameKing(true);
        setTimeout(() => setJustBecameKing(false), 2000);
    }
    prevIsKingRef.current = piece.isKing;
  }, [piece.isKing]);

  useEffect(() => {
    if (isSelected || focusTarget || isScared || isDying) {
      setIdleAction('none');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const triggerRandomness = () => {
      const timeToNext = Math.random() * 4000 + 2000;
      timerRef.current = window.setTimeout(() => {
        const actions: IdleAction[] = ['look-left', 'look-right', 'smirk', 'ooh', 'suspicious', 'wiggle', 'none'];
        const picked = actions[Math.floor(Math.random() * actions.length)];
        setIdleAction(picked);
        if (picked !== 'none') {
            setTimeout(() => {
                setIdleAction(prev => (prev === picked ? 'none' : prev));
            }, 1000 + Math.random() * 1000);
        }
        triggerRandomness();
      }, timeToNext);
    };

    triggerRandomness();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isSelected, focusTarget, piece.id, isScared, isDying]);

  const lookAtStyle = useMemo(() => {
    const factor = model === 'alien' ? 8 : 5;
    if (focusTarget && !isSelected) {
      const dy = focusTarget.row - piece.position.row;
      const dx = focusTarget.col - piece.position.col;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      return { x: (dx / distance) * factor, y: (dy / distance) * (factor - 1), rotate: (dx / distance) * 10 };
    }
    if (idleAction === 'look-left') return { x: -factor, y: 0, rotate: -5 };
    if (idleAction === 'look-right') return { x: factor, y: 0, rotate: 5 };
    return { x: 0, y: 0, rotate: 0 };
  }, [focusTarget, piece.position, isSelected, idleAction, model]);

  useEffect(() => {
    if (isDying) setMood('scared');
    else if (isSelected) setMood('surprised');
    else if (isScared) setMood('scared');
    else if (piece.isKing) setMood('evil');
    else if (focusTarget) setMood('focused');
    else setMood('idle');
  }, [isSelected, piece.isKing, focusTarget, isScared, isDying]);

  const isWiggling = (idleAction === 'wiggle' || model === 'slime' || isScared) && !isSelected && !focusTarget && !isDying;
  const isKingFloating = piece.isKing && !isSelected && !isDying;
  
  const baseRotation = (focusTarget && !isSelected) || idleAction !== 'none' ? lookAtStyle.rotate : 0;
  const transformStyle = isSelected 
    ? `translateY(-12px) scale(1.1) rotate(${baseRotation}deg)` 
    : `translateY(0px) rotate(${baseRotation}deg)`;

  const deathClass = useMemo(() => {
    if (!isDying) return '';
    let effect = deathEffect;
    if (effect === 'auto') {
      switch (model) {
        case 'robot': effect = 'glitch'; break;
        case 'slime': effect = 'melt'; break;
        case 'alien': effect = 'beam'; break;
        case 'ghosty': effect = 'ghost'; break;
        default: effect = 'poof'; break;
      }
    }
    
    switch (effect) {
      case 'glitch': return 'death-glitch';
      case 'melt': return 'death-melt';
      case 'beam': return 'death-beam';
      case 'ghost': return 'death-poof opacity-30 blur-sm';
      case 'poof': return 'death-poof';
      default: return 'death-poof';
    }
  }, [isDying, model, deathEffect]);

  const renderPieceImage = () => {
    let imageUrl = '';
    
    if (equippedPieceId && equippedPieceId !== 'classic' && customStorePieces) {
      const pieceData = customStorePieces.find(p => p.id === equippedPieceId);
      if (pieceData) {
        imageUrl = piece.player === 'red' 
          ? (piece.isKing ? pieceData.redKingPieceImage : pieceData.redPieceImage)
          : (piece.isKing ? pieceData.blueKingPieceImage : pieceData.bluePieceImage);
      }
    }

    if (!imageUrl && customAssets) {
      if (piece.player === 'red') {
        imageUrl = piece.isKing ? customAssets.redKingPieceImage : customAssets.redPieceImage;
      } else {
        imageUrl = piece.isKing ? customAssets.blueKingPieceImage : customAssets.bluePieceImage;
      }
    }

    if (!imageUrl) return null;

    return (
      <img 
        src={imageUrl} 
        alt="Piece" 
        className="w-full h-full object-contain pointer-events-none z-20" 
        referrerPolicy="no-referrer"
      />
    );
  };

  const renderFaces = () => {
    const isEvil = mood === 'evil';
    const eyeBaseClass = "bg-white rounded-full overflow-hidden transition-all duration-300 shadow-sm border border-black/5";
    const pupilClass = `absolute bg-slate-900 rounded-full top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'scale-125' : ''} transition-transform`;

    // Generic Scared/Dying Face (EXCEPT FOR ALIEN)
    if ((mood === 'scared' || isDying) && model !== 'alien') {
      const eyeSize = isDying ? 'w-5 h-5' : 'w-4 h-4';
      return (
        <div className={`flex flex-col items-center ${isDying ? 'animate-shake scale-110' : 'animate-shake'}`}>
          <div className="flex gap-0.5 mb-1">
            <div className={`${eyeSize} ${eyeBaseClass} relative shadow-inner ring-2 ring-black/5`}>
              <div className="absolute top-[35%] left-[35%] w-2 h-2 bg-black rounded-full animate-ping opacity-60"></div>
              <div className="absolute top-[40%] left-[40%] w-1.5 h-1.5 bg-black rounded-full"></div>
            </div>
            <div className={`${eyeSize} ${eyeBaseClass} relative shadow-inner ring-2 ring-black/5`}>
              <div className="absolute top-[35%] left-[35%] w-2 h-2 bg-black rounded-full animate-ping opacity-60"></div>
              <div className="absolute top-[40%] left-[40%] w-1.5 h-1.5 bg-black rounded-full"></div>
            </div>
          </div>
          <div className={`${isDying ? 'w-5 h-4' : 'w-4 h-3'} border-2 border-black/60 rounded-full bg-black/20 animate-pulse`}></div>
          {!isDying && <div className="absolute -top-2 -right-2 w-2 h-4 bg-cyan-100 rounded-full animate-bounce opacity-90 blur-[1px]"></div>}
        </div>
      );
    }

    switch (model) {
      case 'robot':
        return (
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              {[1, 2].map(i => (
                <div key={i} className={`w-4 h-4 ${isEvil ? 'bg-red-500 border-red-800 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-cyan-400 border-cyan-700 shadow-[0_0_8px_rgba(34,211,238,0.6)]'} border-2 rounded-sm relative overflow-visible ${mood === 'surprised' ? 'scale-125' : 'animate-pulse'}`}>
                  <div className="w-1 h-1 bg-white rounded-full m-0.5 opacity-80"></div>
                  {isEvil && <div className={`absolute -top-1.5 ${i===1?'-left-1 rotate-[20deg]':'-right-1 -rotate-[20deg]'} w-6 h-1.5 bg-slate-900 rounded-full`}></div>}
                </div>
              ))}
            </div>
            <div className={`w-6 h-1.5 ${isEvil ? 'bg-red-900/50 border-red-400/30' : 'bg-cyan-900/50 border-cyan-400/30'} rounded-full border overflow-hidden`}>
               <div className={`w-full h-full ${isEvil ? 'bg-red-500/50' : 'bg-cyan-400/20'} animate-pulse`}></div>
            </div>
          </div>
        );
      case 'alien':
        // SINGLE EYE SCARED STATE
        if (mood === 'scared' || isDying) {
             return (
                 <div className={`flex flex-col items-center ${isDying ? 'animate-shake scale-110' : 'animate-shake'}`}>
                     <div className={`relative w-9 h-9 ${eyeBaseClass} border-2 border-black/20 overflow-visible flex items-center justify-center bg-white shadow-inner ring-2 ring-red-400/20`}>
                         {/* Tiny pupil for fear */}
                         <div className="absolute w-1.5 h-1.5 bg-black rounded-full animate-ping"></div>
                         <div className="absolute w-1 h-1 bg-white rounded-full opacity-50 top-2 right-2"></div>
                     </div>
                     {/* Open wobbly mouth */}
                     <div className="w-3 h-3 bg-black/80 rounded-full mt-1 animate-pulse border-2 border-slate-700"></div>
                     {/* Sweat drop */}
                     {!isDying && <div className="absolute -top-2 -right-3 w-3 h-5 bg-cyan-200 rounded-full opacity-80 animate-bounce shadow-sm border border-cyan-400"></div>}
                 </div>
             );
        }

        // SINGLE EYE STANDARD / HAPPY / EVIL
        return (
          <div className="flex flex-col items-center">
            <div className={`relative w-8 h-8 ${eyeBaseClass} border-2 border-black/20 overflow-visible bg-white`} style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
               
               {/* Pupil */}
               <div className={`${pupilClass} w-4 h-4 ${isEvil ? 'bg-red-600 shadow-[0_0_8px_red]' : ''}`}></div>
               
               {/* Reflection */}
               <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full opacity-60"></div>
               
               {/* Evil Eyebrow */}
               {isEvil && <div className="absolute -top-2 -left-1 w-10 h-3 bg-slate-900 rotate-[10deg] rounded-full z-10"></div>}

               {/* Happy/Joy Cheeks (Squinting) */}
               {(mood === 'happy' || idleAction === 'smirk' || idleAction === 'ooh') && !isEvil && (
                  <div className="absolute -bottom-1 left-0 w-full h-4 bg-white z-20 border-t-2 border-black/10 rounded-[50%]"></div>
               )}
            </div>
            
            {/* Mouths */}
            {mood === 'surprised' ? (
                <div className="w-3 h-3 bg-black/60 rounded-full mt-1 border-2 border-black/20"></div>
            ) : (mood === 'happy' || idleAction === 'smirk') ? (
                <div className="w-4 h-2 border-b-4 border-black/40 rounded-full mt-0.5"></div> 
            ) : (
                <div className={`w-4 h-2 ${isEvil ? 'bg-red-900/40' : 'bg-black/40'} rounded-full mt-1`}></div>
            )}
          </div>
        );
      case 'slime':
        return (
          <div className="flex flex-col items-center opacity-80">
            <div className="flex gap-1 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              {[1, 2].map(i => (
                <div key={i} className={`w-3 h-3 bg-white rounded-full relative overflow-visible`}>
                  <div className={`absolute inset-0.5 ${isEvil ? 'bg-red-600' : 'bg-black'} rounded-full`}></div>
                  {isEvil && <div className={`absolute -top-1.5 ${i===1?'-left-1 rotate-[20deg]':'-right-1 -rotate-[20deg]'} w-4 h-1 bg-black rounded-full`}></div>}
                </div>
              ))}
            </div>
            <div className={`w-3 h-1 ${isEvil ? 'bg-red-900/30' : 'bg-black/20'} rounded-full`}></div>
            {!isEvil && <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className="w-2 h-2 bg-white rounded-full absolute top-2 left-2 animate-ping"></div>
               <div className="w-1 h-1 bg-white rounded-full absolute bottom-4 right-3 animate-pulse"></div>
            </div>}
          </div>
        );
      case 'vampy':
        return (
          <div className="flex flex-col items-center">
            <div className="flex gap-1 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              {[1, 2].map(i => (
                <div key={i} className={`relative w-4 h-5 ${eyeBaseClass} border-red-500/20 overflow-visible`}>
                  <div className={`absolute w-2 h-2 ${isEvil ? 'bg-red-600 scale-125 shadow-[0_0_8px_red]' : 'bg-red-600'} rounded-full top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_red] animate-pulse`}></div>
                  {isEvil && <div className={`absolute -top-1.5 ${i===1?'-left-1 rotate-[25deg]':'-right-1 -rotate-[25deg]'} w-5 h-1.5 bg-slate-900 rounded-full z-10`}></div>}
                </div>
              ))}
            </div>
            <div className="relative flex justify-center w-6 h-3">
              <div className="w-5 h-1.5 bg-black/80 rounded-full flex justify-between px-1">
                <div className="w-1 h-2 bg-white rounded-b-full shadow-sm"></div>
                <div className="w-1 h-2 bg-white rounded-b-full shadow-sm"></div>
              </div>
            </div>
          </div>
        );
      case 'ghosty':
        return (
          <div className="flex flex-col items-center opacity-90">
            <div className="flex gap-2 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              {[1, 2].map(i => (
                <div key={i} className={`w-3.5 h-3.5 bg-slate-900 rounded-full flex items-center justify-center overflow-visible`}>
                  <div className={`w-1 h-1 ${isEvil ? 'bg-red-500 shadow-[0_0_4px_red]' : 'bg-white opacity-40'} rounded-full translate-x-1 -translate-y-1`}></div>
                  {isEvil && <div className={`absolute -top-1 ${i===1?'-left-0.5 rotate-[15deg]':'-right-0.5 -rotate-[15deg]'} w-4 h-1 bg-slate-900 rounded-full`}></div>}
                </div>
              ))}
            </div>
            <div className={`w-4 h-4 bg-slate-900 rounded-full mt-1 ${isEvil ? 'scale-y-50' : 'animate-pulse'}`}></div>
          </div>
        );
      case 'ninja':
        return (
          <div className="flex flex-col items-center">
             <div className="w-full h-4 bg-slate-900/80 mb-1 flex items-center justify-center relative">
                <div className="flex gap-4" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
                  {[1, 2].map(i => (
                    <div key={i} className={`w-2.5 h-1 ${isEvil ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]'} rounded-full ${isEvil ? 'rotate-[25deg]' : 'rotate-[10deg]'}`}></div>
                  ))}
                </div>
             </div>
             <div className="w-6 h-1 bg-slate-900/40 rounded-full"></div>
          </div>
        );
      case 'bear':
        return (
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              {[1, 2].map(i => (
                <div key={i} className={`w-2 h-2 ${isEvil ? 'bg-red-600 scale-110' : 'bg-slate-900'} rounded-full relative overflow-visible`}>
                   {isEvil && <div className={`absolute -top-1.5 ${i===1?'-left-1 rotate-[20deg]':'-right-1 -rotate-[20deg]'} w-3 h-0.5 bg-black rounded-full`}></div>}
                </div>
              ))}
            </div>
            <div className="w-3 h-2 bg-black/20 rounded-full flex items-center justify-center">
               <div className="w-1 h-1 bg-black rounded-full"></div>
            </div>
          </div>
        );
      case 'dragon':
        return (
            <div className="flex flex-col items-center">
              <div className="flex gap-3 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
                {[1, 2].map(i => (
                  <div key={i} className={`relative w-2 h-4 ${isEvil ? 'bg-orange-500' : 'bg-slate-900'} rounded-full overflow-visible`}>
                     {/* Dragon Eye Slit */}
                     <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3 ${isEvil ? 'bg-red-900' : 'bg-yellow-400'} rounded-full`}></div>
                     {isEvil && <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-900 ${i===1 ? 'rotate-12' : '-rotate-12'}`}></div>}
                  </div>
                ))}
              </div>
              <div className="w-4 h-2 bg-black/30 rounded-full flex items-center justify-around mt-1">
                 <div className={`w-1 h-1 bg-black/50 rounded-full ${isEvil ? 'animate-ping bg-orange-500' : ''}`}></div>
                 <div className={`w-1 h-1 bg-black/50 rounded-full ${isEvil ? 'animate-ping bg-orange-500' : ''}`} style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
        );
      case 'dino':
        return (
            <div className="flex flex-col items-center">
              <div className="flex gap-4 mb-2" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
                {[1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-900 rounded-full relative">
                      {isEvil && <div className="absolute -top-1 left-0 w-3 h-1 bg-red-700 rotate-12"></div>}
                  </div>
                ))}
              </div>
              <div className="w-6 h-3 bg-black/10 rounded-full relative flex justify-center items-end pb-0.5">
                  <div className="w-1 h-1 bg-black/40 rounded-full mx-0.5"></div>
                  <div className="w-1 h-1 bg-black/40 rounded-full mx-0.5"></div>
                  {isEvil && (
                      <div className="absolute -bottom-1 w-full flex justify-center gap-1">
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white border-r-[3px] border-r-transparent"></div>
                          <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white border-r-[3px] border-r-transparent"></div>
                      </div>
                  )}
              </div>
            </div>
        );
      case 'knight':
        return (
            <div className="flex flex-col items-center">
               <div className="w-6 h-6 bg-slate-800 rounded-sm relative border-2 border-slate-600 shadow-md flex items-center justify-center">
                  <div className={`w-4 h-1 ${isEvil ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-black'} rounded-full`}></div>
                  <div className="absolute w-0.5 h-3 bg-slate-600 top-0 left-1/2 -translate-x-1/2"></div>
               </div>
               {isEvil && <div className="w-8 h-8 absolute -z-10 bg-red-900/30 blur-md rounded-full"></div>}
            </div>
        );
      case 'zumbi':
        return (
          <div className="flex flex-col items-center opacity-90">
            <div className="flex gap-1 mb-1" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              <div className={`w-4 h-4 ${eyeBaseClass} relative ${isEvil ? 'bg-red-200' : 'bg-yellow-100'} border-2 border-black/40`}>
                <div className={`${pupilClass} w-1.5 h-1.5 ${isEvil ? 'bg-red-600' : 'bg-black'}`}></div>
              </div>
              <div className={`w-3 h-3 ${eyeBaseClass} relative mt-1 ${isEvil ? 'bg-red-200' : 'bg-yellow-100'} border-2 border-black/40`}>
                <div className={`${pupilClass} w-1 h-1 ${isEvil ? 'bg-red-600' : 'bg-black'}`}></div>
              </div>
            </div>
            <div className={`w-5 h-2 border-b-2 border-black/60 rounded-full mt-1 ${mood === 'surprised' ? 'h-4 bg-black/60' : ''} ${isEvil ? 'border-red-800' : ''}`}>
              <div className="flex gap-0.5 justify-center mt-0.5">
                <div className="w-1 h-1.5 bg-yellow-200 rounded-sm"></div>
                <div className="w-1 h-1 bg-yellow-200 rounded-sm mt-0.5"></div>
              </div>
            </div>
          </div>
        );
      case 'monstros':
        return (
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-0.5" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              <div className={`w-5 h-4 ${eyeBaseClass} relative ${isEvil ? 'bg-yellow-400' : 'bg-white'} border-2 border-black/40 rotate-12`}>
                <div className={`${pupilClass} w-2 h-2 ${isEvil ? 'bg-red-600' : 'bg-black'}`}></div>
                {isEvil && <div className="absolute -top-1 -left-1 w-6 h-2 bg-black/60 rotate-[20deg] rounded-full"></div>}
              </div>
              <div className={`w-4 h-5 ${eyeBaseClass} relative ${isEvil ? 'bg-yellow-400' : 'bg-white'} border-2 border-black/40 -rotate-12`}>
                <div className={`${pupilClass} w-1.5 h-1.5 ${isEvil ? 'bg-red-600' : 'bg-black'}`}></div>
                {isEvil && <div className="absolute -top-1 -right-1 w-5 h-2 bg-black/60 -rotate-[20deg] rounded-full"></div>}
              </div>
            </div>
            <div className={`w-6 h-3 bg-black rounded-b-full mt-1 overflow-hidden flex justify-center gap-0.5 ${mood === 'surprised' ? 'h-5 rounded-full' : ''}`}>
               <div className="w-1.5 h-2 bg-white rounded-b-sm"></div>
               <div className="w-1.5 h-2 bg-white rounded-b-sm mt-0.5"></div>
               <div className="w-1.5 h-2 bg-white rounded-b-sm"></div>
            </div>
          </div>
        );
      default: // classic
        if (isEvil) {
             return (
                <div className="flex flex-col items-center">
                    <div className="flex gap-1 mb-0.5" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
                        <div className={`relative w-4 h-5 ${eyeBaseClass} overflow-visible`}>
                            <div className="absolute -top-1 -left-1 w-6 h-1.5 bg-slate-900 rounded-full rotate-[25deg] z-10"></div>
                            <div className={`${pupilClass} w-2.5 h-2.5 bg-red-600 shadow-[0_0_5px_rgba(255,0,0,0.5)]`}></div>
                        </div>
                        <div className={`relative w-4 h-5 ${eyeBaseClass} overflow-visible`}>
                            <div className="absolute -top-1 -right-1 w-6 h-1.5 bg-slate-900 rounded-full -rotate-[25deg] z-10"></div>
                            <div className={`${pupilClass} w-2.5 h-2.5 bg-red-600 shadow-[0_0_5px_rgba(255,0,0,0.5)]`}></div>
                        </div>
                    </div>
                    <div className="w-5 h-2.5 border-t-2 border-black/60 rounded-t-full scale-y-[-1] mt-1 translate-y-1"></div>
                </div>
            );
         }
        return (
          <>
            <div className="flex gap-1 mb-1 transition-transform duration-300" style={{ transform: `translate(${lookAtStyle.x}px, ${lookAtStyle.y}px)` }}>
              <div className={`relative w-4 h-5 ${eyeBaseClass} animate-blink`}>
                <div className={`${pupilClass} w-2 h-2`}></div>
              </div>
              <div className={`relative w-4 h-5 ${eyeBaseClass} animate-blink`} style={{ animationDelay: '0.1s' }}>
                <div className={`${pupilClass} w-2 h-2`}></div>
              </div>
            </div>
            <div className={`bg-slate-900/80 transition-all duration-300 ${mood === 'surprised' ? 'h-3 w-3 rounded-full' : 'w-4 h-2 rounded-b-full'}`} />
          </>
        );
    }
  };

  const bodyStyle: React.CSSProperties = {
    background: model === 'ghosty' 
      ? `radial-gradient(circle at 30% 30%, #fff, ${theme.via})`
      : model === 'zumbi'
         ? piece.player === 'red'
            ? `linear-gradient(135deg, #4ade80, #16a34a, #14532d)`
            : `linear-gradient(135deg, #c084fc, #9333ea, #4c1d95)`
         : mood === 'scared'
            ? `linear-gradient(135deg, ${theme.from}, #a5b4fc, ${theme.to})`
            : `linear-gradient(135deg, ${theme.from}, ${theme.via}, ${theme.to})`,
    borderRadius: model === 'robot' || model === 'knight' ? '20%' : model === 'ghosty' ? '50% 50% 10% 10%' : model === 'monstros' ? '40% 40% 20% 20%' : '50%',
    opacity: model === 'slime' ? 0.85 : model === 'ghosty' ? 0.75 : 1,
    boxShadow: isSelected 
      ? `inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -6px 12px rgba(0,0,0,0.2), 0 16px 0 ${theme.side}, 0 24px 20px rgba(0,0,0,0.4)`
      : mood === 'evil'
        ? `inset 0 4px 6px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.6), 0 6px 0 #000, 0 8px 12px rgba(0,0,0,0.8)`
        : `inset 0 4px 6px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), 0 6px 0 ${theme.side}, 0 8px 6px rgba(0,0,0,0.3)`,
  };

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative w-[82%] h-[82%] cursor-pointer group transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${canMove ? 'hover:-translate-y-2' : ''} ${deathClass}`}
      style={{ transform: transformStyle, zIndex: isSelected ? 50 : 10 }}
    >
        <div className={`w-full h-full flex items-center justify-center relative ${isWiggling ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''} ${isKingFloating ? 'animate-king-float' : ''} ${justBecameKing ? 'animate-levitate-once' : ''}`}
             style={bodyStyle}>
            {model === 'robot' && (
              <div className="absolute -top-1 left-1/4 w-1/2 h-1 bg-black/20 rounded-full" />
            )}
            {model === 'vampy' && (
              <div className="absolute -inset-2 bg-red-950/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
            )}
            {model === 'bear' && (
              <>
                <div className="absolute -top-2 -left-1 w-5 h-5 bg-inherit rounded-full shadow-sm border-t-2 border-white/20"></div>
                <div className="absolute -top-2 -right-1 w-5 h-5 bg-inherit rounded-full shadow-sm border-t-2 border-white/20"></div>
              </>
            )}
            {model === 'dragon' && (
               <>
                 <div className="absolute -top-2 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-b-[8px] border-b-black/20 border-r-[4px] border-r-transparent rotate-[-15deg]"></div>
                 <div className="absolute -top-2 -right-1 w-0 h-0 border-l-[4px] border-l-transparent border-b-[8px] border-b-black/20 border-r-[4px] border-r-transparent rotate-[15deg]"></div>
                 <div className="absolute top-1/2 -left-3 w-3 h-6 bg-inherit rounded-l-full opacity-80 -z-10 scale-x-50"></div>
                 <div className="absolute top-1/2 -right-3 w-3 h-6 bg-inherit rounded-r-full opacity-80 -z-10 scale-x-50"></div>
               </>
            )}
            {model === 'dino' && (
               <div className="absolute -top-1 w-full flex justify-center gap-1">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-black/20 rotate-45"></div>)}
               </div>
            )}
            {model === 'zumbi' && (
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-900/40 rounded-full blur-[1px]"></div>
            )}
            {model === 'monstros' && (
               <>
                 <div className="absolute -top-3 left-1/4 w-2 h-4 bg-inherit rounded-t-full border-b-2 border-black/20 rotate-[-20deg]"></div>
                 <div className="absolute -top-3 right-1/4 w-2 h-4 bg-inherit rounded-t-full border-b-2 border-black/20 rotate-[20deg]"></div>
               </>
            )}
            
            <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none z-10">
              {renderPieceImage() || renderFaces()}
            </div>

            {piece.isKing && (
                <div className={`absolute -top-6 md:-top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 z-30 pointer-events-none animate-crown`}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full drop-shadow-xl">
                        <path d="M2 18h20v2H2v-2zm0-2l4-8 4 6 4-6 4 8H2z" fill="gold" stroke="#B8860B" strokeWidth="1"/>
                    </svg>
                </div>
            )}
            
            {model === 'ghosty' && (
              <div className="absolute -bottom-2 w-full flex justify-around px-1">
                <div className="w-3 h-3 bg-inherit rounded-full"></div>
                <div className="w-3 h-3 bg-inherit rounded-full"></div>
                <div className="w-3 h-3 bg-inherit rounded-full"></div>
              </div>
            )}
        </div>
    </div>
  );
};

export default ToonPiece;