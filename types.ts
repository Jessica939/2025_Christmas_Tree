export enum AppMode {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE',
}

export interface HandGestureState {
  isHandDetected: boolean;
  gesture: 'CLOSED_FIST' | 'OPEN_PALM' | 'UNKNOWN';
  handPosition: { x: number; y: number }; // Normalized 0-1
}

export const COLORS = {
  bg: '#050103',
  leafPrimary: '#8170fc',   // Vivid purple-blue
  leafSecondary: '#c0b2e9', // Lavender
  ornament: '#FFFFFF',      // White accents
  ribbon: '#FFFFFF',        // Pure White
  star: '#FFFFFF',          // Silver White
  gold: '#FFF0C0',          // Light Pale Gold
};

// Particle Counts - Significantly Increased
export const COUNTS = {
  leavesPrimary: 12000,
  leavesSecondary: 8000,
  ornaments: 1500,
  ribbon: 5000,
};