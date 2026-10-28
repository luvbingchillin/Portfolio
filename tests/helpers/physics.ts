/**
 * Authoritative Physics and Mathematical Models for Athenaeum 3D Portfolio
 * Derived from docs/a24-reverse-engineering.md and PROJECT.md specifications.
 */

export interface OscillatorConfig {
  snapFreq: number;       // Natural angular frequency omega_0 (rad/s) = 9.5
  snapDamping: number;    // Damping coefficient gamma = 12.0
  friction: number;       // Friction coefficient = 0.89
  snapDuration: number;   // Expected settling duration = 0.46s
}

export const DEFAULT_PHYSICS_CONFIG: OscillatorConfig = {
  snapFreq: 9.5,
  snapDamping: 12.0,
  friction: 0.89,
  snapDuration: 0.46
};

export interface OscillatorState {
  position: number;
  velocity: number;
  target: number;
}

/**
 * 2nd-order Damped Harmonic Oscillator Step Update
 * Differential equation: d^2x/dt^2 + gamma * dx/dt + omega_0^2 * (x - target) = 0
 */
export function stepHarmonicOscillator(
  state: OscillatorState,
  dt: number,
  config: OscillatorConfig = DEFAULT_PHYSICS_CONFIG
): OscillatorState {
  if (dt <= 0) return { ...state };

  const diff = state.target - state.position;
  const springForce = diff * (config.snapFreq * config.snapFreq * 0.001);
  const dampingForce = -state.velocity * (config.snapDamping * 0.01);
  
  let newVelocity = (state.velocity + (springForce + dampingForce) * (dt * 60)) * config.friction;
  // Deadband snap when near equilibrium
  if (Math.abs(diff) < 0.0001 && Math.abs(newVelocity) < 0.0001) {
    return {
      position: state.target,
      velocity: 0,
      target: state.target
    };
  }

  const newPosition = state.position + newVelocity * (dt * 60);
  return {
    position: newPosition,
    velocity: newVelocity,
    target: state.target
  };
}

/**
 * Aerodynamic Drag Banking Specifications
 */
export interface AerodynamicDrag {
  flowLean: number;  // Pitch tilt: sgn(v) * sqrt(|v|) * 0.055, clamped to 0.30
  flowBank: number;  // Roll tilt: -v * 0.32
  flowDip: number;   // Vertical aerodynamic downforce: -|v| * 0.014
}

export const DRAG_CONFIG = {
  flowLeanMultiplier: 0.055,
  flowLeanMax: 0.30,
  flowBankMultiplier: 0.32,
  flowDipMultiplier: 0.014,
  flightRecedeZ: -2.2
};

export function calculateAerodynamicDrag(velocity: number): AerodynamicDrag {
  const sign = Math.sign(velocity);
  const absV = Math.abs(velocity);

  // flowLean = sgn(v) * sqrt(|v|) * 0.055, clamped to [-0.30, 0.30]
  const rawLean = sign * Math.sqrt(absV) * DRAG_CONFIG.flowLeanMultiplier;
  const flowLean = Math.max(-DRAG_CONFIG.flowLeanMax, Math.min(DRAG_CONFIG.flowLeanMax, rawLean));

  // flowBank = -v * 0.32
  const flowBank = velocity === 0 ? 0 : -velocity * DRAG_CONFIG.flowBankMultiplier;

  // flowDip = -|v| * 0.014 (always negative downward downforce)
  const flowDip = absV === 0 ? 0 : -absV * DRAG_CONFIG.flowDipMultiplier;

  return { flowLean, flowBank, flowDip };
}

/**
 * Cylindrical Arc Carousel Spacing Specifications
 * X(m) = sin(0.35m) * 5.52
 * Z(m) = -cos(0.35m) * 2.4 + 2.4
 */
export const CAROUSEL_GEOMETRY = {
  thetaCoeff: 0.35,
  radiusX: 5.52,
  radiusZ: 2.4
};

export function calculateCylindricalPosition(offset: number): { x: number; z: number } {
  const theta = CAROUSEL_GEOMETRY.thetaCoeff * offset;
  const x = Math.sin(theta) * CAROUSEL_GEOMETRY.radiusX;
  const z = -Math.cos(theta) * CAROUSEL_GEOMETRY.radiusZ + CAROUSEL_GEOMETRY.radiusZ;
  return { x, z };
}

/**
 * Text Balancing Algorithm
 * Distributes words across lines to prevent orphan words (widows) and minimize variance.
 */
export function balanceTextLines(text: string, maxCharsPerLine = 32): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/);
  if (words.length <= 2) return [trimmed];

  const totalLength = trimmed.length;
  const targetLineCount = Math.max(1, Math.ceil(totalLength / maxCharsPerLine));
  if (targetLineCount === 1) return [trimmed];

  const targetCharsPerLine = totalLength / targetLineCount;
  const lines: string[] = [];
  let currentWords: string[] = [];
  let currentLen = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wouldBeLen = currentLen + (currentWords.length > 0 ? 1 : 0) + word.length;
    const remainingWords = words.length - (i + 1);

    if (currentWords.length > 0 && wouldBeLen > targetCharsPerLine && remainingWords >= 1) {
      lines.push(currentWords.join(' '));
      currentWords = [word];
      currentLen = word.length;
    } else {
      currentWords.push(word);
      currentLen = wouldBeLen;
    }
  }

  if (currentWords.length > 0) {
    // Widow prevention: if the last line is a single short word, pull a word from preceding line if possible
    if (currentWords.length === 1 && lines.length > 0) {
      const prevLineWords = lines[lines.length - 1].split(' ');
      if (prevLineWords.length > 2) {
        const stolenWord = prevLineWords.pop()!;
        lines[lines.length - 1] = prevLineWords.join(' ');
        currentWords.unshift(stolenWord);
      }
    }
    lines.push(currentWords.join(' '));
  }

  return lines;
}
