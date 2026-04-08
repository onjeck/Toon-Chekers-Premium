export type Player = 'red' | 'blue';

export type PieceModelId = 'classic' | 'robot' | 'slime' | 'alien' | 'vampy' | 'ghosty' | 'ninja' | 'bear' | 'dragon' | 'dino' | 'knight' | 'zumbi' | 'monstros';
export type DeathEffectId = 'auto' | 'poof' | 'melt' | 'glitch' | 'beam' | 'ghost';

export interface Position {
  row: number;
  col: number;
}

export interface Piece {
  id: string;
  player: Player;
  isKing: boolean;
  position: Position;
  isCaptured: boolean;
}

export interface Move {
  from: Position;
  to: Position;
  isJump: boolean;
  capturedPieceId?: string;
  jumpedPosition?: Position;
}

export type GameState = 'login' | 'loading' | 'menu' | 'playing' | 'winner' | 'settings' | 'admin' | 'store';
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CustomBoard {
  id: string;
  name: string;
  bgUrl: string;
  price: number;
}

export interface CustomPiece {
  id: string;
  name: string;
  redPieceImage: string;
  bluePieceImage: string;
  redKingPieceImage: string;
  blueKingPieceImage: string;
  price: number;
}

export interface Particle {
  id: string;
  row: number;
  col: number;
  color: string;
  text?: string;
}

export interface PlayerTheme {
  from: string;
  via: string;
  to: string;
  side: string;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  boardDark: string;
  boardLight: string;
  red: PlayerTheme;
  blue: PlayerTheme;
}

export interface GameRules {
  flyingKings: boolean;
  backwardCapture: boolean;
  forcedCapture: boolean;
  pieceModel: PieceModelId;
  deathEffect: DeathEffectId;
  is25D: boolean;
}