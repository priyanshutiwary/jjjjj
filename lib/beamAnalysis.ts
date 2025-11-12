export type BeamType = 'cantilever' | 'simply-supported' | 'fixed-fixed' | 'fixed-pinned';

export interface BeamProperties {
  length: number; // meters
  width: number; // meters
  depth: number; // meters
  youngsModulus: number; // Pa
  density: number; // kg/m³
  dampingRatio?: number; // Damping ratio (ζ), typically 0.01-0.05 for structures (optional)
}

export interface BeamResults {
  naturalFrequencies: number[]; // Hz
  modeShapes: ModeShape[];
  flexuralRigidity: number; // EI in N·m²
  massPerUnitLength: number; // m = ρA in kg/m
  staticDeflection: StaticDeflection | null; // Static deflection under point load
  dampingCoefficient: number | null; // c in N·s/m (null if not calculated)
  dampedResponse: DampedResponse | null; // Damped vibration response (null if no damping)
}

export interface ModeShape {
  mode: number;
  x: number[];
  w: number[];
  bL: number;
}

export interface StaticDeflection {
  x: number[]; // Position along beam
  y: number[]; // Deflection in meters
  maxDeflection: number; // Maximum deflection in meters
  maxDeflectionLocation: number; // Location of max deflection in meters
}

export interface DampedResponse {
  time: number[]; // Time in seconds
  displacement: number[]; // Displacement in meters
  envelope: { time: number[]; upper: number[]; lower: number[] }; // Envelope curves
  dampingRatio: number;
  naturalFrequency: number; // Hz
  dampedFrequency: number; // Hz
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
 * Calculates static deflection under a point load at the free end (for cantilever) or center (for simply-supported)
 */
function calculateStaticDeflection(
  beamType: BeamType,
  properties: BeamProperties,
  load: number = 1000 // Default point load in N
): StaticDeflection | null {
  const { length, width, depth, youngsModulus } = properties;
  const I = (width * Math.pow(depth, 3)) / 12; // Moment of inertia
  const EI = youngsModulus * I; // Flexural rigidity
  
  if (EI <= 0 || length <= 0) return null;
  
  const x: number[] = [];
  const y: number[] = [];
  const numPoints = 300; // More points for smoother curve
  const dx = length / numPoints;
  
  let maxDeflection = 0;
  let maxDeflectionLocation = 0;
  
  for (let i = 0; i <= numPoints; i++) {
    const pos = i * dx;
    x.push(pos);
    let deflection = 0;
    
    switch (beamType) {
      case 'cantilever': {
        // Point load at free end: y(x) = (P/(6EI)) * (3Lx² - x³)
        // Verified: y(0) = 0, y(L) = PL³/(3EI)
        if (pos >= 0 && pos <= length) {
          deflection = (load / (6 * EI)) * (3 * length * pos * pos - pos * pos * pos);
        }
        break;
      }
      case 'simply-supported': {
        // Point load at center: y(x) = (P/(48EI)) * (3L²x - 4x³) for x ≤ L/2
        // Verified: y(0) = 0, y(L/2) = PL³/(48EI), y(L) = 0
        if (pos <= length / 2) {
          deflection = (load / (48 * EI)) * (3 * length * length * pos - 4 * pos * pos * pos);
        } else {
          // Symmetric for x > L/2: y(x) = y(L-x)
          const xSym = length - pos;
          deflection = (load / (48 * EI)) * (3 * length * length * xSym - 4 * xSym * xSym * xSym);
        }
        break;
      }
      case 'fixed-fixed': {
        // Point load at center: y(x) = (P/(192EI)) * (3L²x - 4x³) for x ≤ L/2
        // For fixed-fixed, the formula is similar but with different coefficient
        if (pos <= length / 2) {
          deflection = (load / (192 * EI)) * (3 * length * length * pos - 4 * pos * pos * pos);
        } else {
          const xSym = length - pos;
          deflection = (load / (192 * EI)) * (3 * length * length * xSym - 4 * xSym * xSym * xSym);
        }
        break;
      }
      case 'fixed-pinned': {
        // Point load at center: approximate using similar formula
        if (pos <= length / 2) {
          deflection = (load / (96 * EI)) * (3 * length * length * pos - 4 * pos * pos * pos);
        } else {
          const xSym = length - pos;
          deflection = (load / (96 * EI)) * (3 * length * length * xSym - 4 * xSym * xSym * xSym);
        }
        break;
      }
    }
    
    y.push(deflection);
    
    if (Math.abs(deflection) > Math.abs(maxDeflection)) {
      maxDeflection = deflection;
      maxDeflectionLocation = pos;
    }
  }
  
  return {
    x,
    y,
    maxDeflection,
    maxDeflectionLocation,
  };
}

/**
 * Calculates damped vibration response over time
 * x(t) = A * e^(-ζω_n*t) * cos(ω_d*t + φ)
 */
function calculateDampedResponse(
  naturalFrequency: number, // Hz
  dampingRatio: number,
  duration: number = 2.0, // seconds
  initialAmplitude: number = 1.0 // meters
): DampedResponse | null {
  if (dampingRatio <= 0 || dampingRatio >= 1) return null; // Invalid damping ratio
  
  const omega_n = naturalFrequency * 2 * Math.PI; // Natural frequency in rad/s
  const omega_d = omega_n * Math.sqrt(1 - dampingRatio * dampingRatio); // Damped frequency
  const dampedFrequency = omega_d / (2 * Math.PI); // Damped frequency in Hz
  
  const time: number[] = [];
  const displacement: number[] = [];
  const envelopeTime: number[] = [];
  const envelopeUpper: number[] = [];
  const envelopeLower: number[] = [];
  
  const numPoints = 1000;
  const dt = duration / numPoints;
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i * dt;
    time.push(t);
    
    // Damped response: x(t) = A * e^(-ζω_n*t) * cos(ω_d*t)
    const decay = Math.exp(-dampingRatio * omega_n * t);
    const oscillation = Math.cos(omega_d * t);
    const x = initialAmplitude * decay * oscillation;
    
    displacement.push(x);
    
    // Envelope curves: ±A * e^(-ζω_n*t)
    if (i % 10 === 0) { // Sample envelope less frequently
      envelopeTime.push(t);
      envelopeUpper.push(initialAmplitude * decay);
      envelopeLower.push(-initialAmplitude * decay);
    }
  }
  
  return {
    time,
    displacement,
    envelope: {
      time: envelopeTime,
      upper: envelopeUpper,
      lower: envelopeLower,
    },
    dampingRatio,
    naturalFrequency,
    dampedFrequency,
  };
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
  
  // Calculate key quantities
  const flexuralRigidity = youngsModulus * I; // EI in N·m²
  const massPerUnitLength = density * A; // m = ρA in kg/m

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
  
  // Calculate static deflection (under 1000N point load)
  const staticDeflection = calculateStaticDeflection(beamType, properties, 1000);
  
  // Calculate damping coefficient if damping ratio is provided
  // For beam: c ≈ 2ζω_n * m_per_unit_length (approximate for first mode)
  let dampingCoefficient: number | null = null;
  let dampedResponse: DampedResponse | null = null;
  
  if (properties.dampingRatio !== undefined && properties.dampingRatio > 0 && naturalFrequencies.length > 0) {
    const omega1 = naturalFrequencies[0] * 2 * Math.PI; // Convert Hz to rad/s
    const zeta = properties.dampingRatio; // Damping ratio
    // For distributed system: c ≈ 2ζω_n * m (per unit length)
    dampingCoefficient = 2 * zeta * omega1 * massPerUnitLength;
    
    // Calculate damped response for first mode
    if (zeta > 0 && zeta < 1) {
      // Adaptive duration: show at least 15 periods, but minimum 5 seconds
      // For low frequencies, we need more time to see enough cycles
      const period = 1 / naturalFrequencies[0]; // Period in seconds
      const minDuration = 5.0; // Minimum 5 seconds
      const periodsToShow = 15; // Show at least 15 periods
      const adaptiveDuration = Math.max(periodsToShow * period, minDuration);
      
      // Also ensure we see decay: at least 3 time constants
      // Time constant τ = 1/(ζω_n)
      const timeConstant = 1 / (zeta * omega1);
      const decayDuration = 3 * timeConstant;
      
      // Use the maximum of both requirements, but cap at 60 seconds for performance
      const maxDuration = 60.0; // Maximum 60 seconds
      const duration = Math.min(Math.max(adaptiveDuration, decayDuration, minDuration), maxDuration);
      
      dampedResponse = calculateDampedResponse(naturalFrequencies[0], zeta, duration, 1.0);
    }
  }

  return {
    naturalFrequencies,
    modeShapes,
    flexuralRigidity,
    massPerUnitLength,
    staticDeflection,
    dampingCoefficient,
    dampedResponse,
  };
}

