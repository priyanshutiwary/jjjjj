export type BeamType = 'cantilever' | 'simply-supported' | 'fixed-fixed' | 'fixed-pinned';

export interface BeamProperties {
  length: number; // meters
  width: number; // meters
  depth: number; // meters
  youngsModulus: number; // Pa
  density: number; // kg/m³
}

export interface BeamResults {
  naturalFrequencies: number[]; // Hz
  modeShapes: ModeShape[];
}

export interface ModeShape {
  mode: number;
  x: number[];
  w: number[];
  bL: number;
}

/**
 * Solves the characteristic equation for different beam types
 */
function solveCharacteristicEquation(beamType: BeamType, numModes: number = 3): number[] {
  const bLValues: number[] = [];
  
  // Characteristic equations for different beam types
  const equations: Record<BeamType, (bL: number) => number> = {
    'cantilever': (bL: number) => Math.cos(bL) * Math.cosh(bL) + 1,
    'simply-supported': (bL: number) => Math.sin(bL),
    'fixed-fixed': (bL: number) => Math.cos(bL) * Math.cosh(bL) - 1,
    'fixed-pinned': (bL: number) => Math.tan(bL) - Math.tanh(bL),
  };

  const equation = equations[beamType];
  
  // Initial guesses for bL values (approximate roots)
  const initialGuesses: Record<BeamType, number[]> = {
    'cantilever': [1.875, 4.694, 7.855, 10.996, 14.137],
    'simply-supported': [Math.PI, 2 * Math.PI, 3 * Math.PI, 4 * Math.PI, 5 * Math.PI],
    'fixed-fixed': [4.730, 7.853, 10.996, 14.137, 17.279],
    'fixed-pinned': [3.927, 7.069, 10.210, 13.352, 16.493],
  };

  const guesses = initialGuesses[beamType];

  for (let i = 0; i < numModes && i < guesses.length; i++) {
    const bL = findRoot(equation, guesses[i] - 0.5, guesses[i] + 0.5);
    if (bL !== null) {
      bLValues.push(bL);
    }
  }

  return bLValues;
}

/**
 * Newton-Raphson method to find roots
 */
function findRoot(
  equation: (x: number) => number,
  lowerBound: number,
  upperBound: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number | null {
  let x = (lowerBound + upperBound) / 2;
  
  for (let i = 0; i < maxIterations; i++) {
    const fx = equation(x);
    
    if (Math.abs(fx) < tolerance) {
      return x;
    }

    // Numerical derivative
    const h = 1e-8;
    const dfx = (equation(x + h) - equation(x - h)) / (2 * h);
    
    if (Math.abs(dfx) < 1e-10) {
      break; // Avoid division by zero
    }

    const xNew = x - fx / dfx;
    
    if (xNew < lowerBound || xNew > upperBound) {
      // If out of bounds, use bisection
      x = (lowerBound + upperBound) / 2;
      if (equation(lowerBound) * equation(x) < 0) {
        upperBound = x;
      } else {
        lowerBound = x;
      }
    } else {
      x = xNew;
    }
  }

  return Math.abs(equation(x)) < tolerance ? x : null;
}

/**
 * Calculates mode shape for a given beam type and bL value
 */
function calculateModeShape(
  beamType: BeamType,
  bL: number,
  length: number,
  dx: number = 0.01
): { x: number[]; w: number[] } {
  const b = bL / length;
  const x: number[] = [];
  const w: number[] = [];

  for (let pos = 0; pos <= length; pos += dx) {
    x.push(pos);
    
    const bx = b * pos;
    const C = Math.cos(bx);
    const S = Math.sin(bx);
    const Ch = Math.cosh(bx);
    const Sh = Math.sinh(bx);

    let modeValue = 0;

    switch (beamType) {
      case 'cantilever': {
        const C_bL = Math.cos(bL);
        const Ch_bL = Math.cosh(bL);
        const a = (Math.sin(bL) + Math.sinh(bL)) / (C_bL + Ch_bL);
        modeValue = (S - Sh) - a * (C - Ch);
        break;
      }
      case 'simply-supported': {
        modeValue = Math.sin(bx);
        break;
      }
      case 'fixed-fixed': {
        const C_bL = Math.cos(bL);
        const Ch_bL = Math.cosh(bL);
        const S_bL = Math.sin(bL);
        const Sh_bL = Math.sinh(bL);
        const a = (Ch_bL - C_bL) / (Sh_bL - S_bL);
        modeValue = (C - Ch) - a * (S - Sh);
        break;
      }
      case 'fixed-pinned': {
        const a = Math.tanh(bL);
        modeValue = (S - a * Sh);
        break;
      }
    }

    w.push(modeValue);
  }

  // Normalize mode shape
  const maxW = Math.max(...w.map(Math.abs));
  if (maxW > 0) {
    for (let i = 0; i < w.length; i++) {
      w[i] = w[i] / maxW;
    }
  }

  return { x, w };
}

/**
 * Main function to calculate natural frequencies and mode shapes
 */
export function calculateBeamAnalysis(
  beamType: BeamType,
  properties: BeamProperties,
  numModes: number = 3
): BeamResults {
  const { length, width, depth, youngsModulus, density } = properties;

  // Calculate geometric properties
  const A = width * depth; // Cross-sectional area
  const I = (width * Math.pow(depth, 3)) / 12; // Moment of inertia

  // Solve characteristic equation
  const bLValues = solveCharacteristicEquation(beamType, numModes);

  // Calculate natural frequencies
  const naturalFrequencies = bLValues.map((bL) => {
    const omegaN = Math.pow(bL, 2) * Math.sqrt((youngsModulus * I) / (density * A * Math.pow(length, 4)));
    return omegaN / (2 * Math.PI); // Convert to Hz
  });

  // Calculate mode shapes
  const modeShapes: ModeShape[] = bLValues.map((bL, index) => {
    const { x, w } = calculateModeShape(beamType, bL, length);
    return {
      mode: index + 1,
      x,
      w,
      bL,
    };
  });

  return {
    naturalFrequencies,
    modeShapes,
  };
}

