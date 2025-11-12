# Beam Analysis Tool

A modern web application for analyzing beam vibrations, calculating natural frequencies, and visualizing mode shapes for various beam configurations.

## Features

- **Multiple Beam Types**: Support for Cantilever, Simply Supported, Fixed-Fixed, and Fixed-Pinned beams
- **Interactive Inputs**: Easy-to-use forms for beam dimensions and material properties
- **Real-time Calculations**: Automatic calculation of natural frequencies and mode shapes
- **Visualization**: Interactive charts showing mode shapes for the first three modes
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Select Beam Type**: Choose from Cantilever, Simply Supported, Fixed-Fixed, or Fixed-Pinned
2. **Enter Dimensions**: Input length, width, and depth in meters
3. **Set Material Properties**: Enter Young's Modulus (Pa) and Density (kg/m³)
4. **View Results**: 
   - Natural frequencies for each mode are displayed
   - Mode shapes are visualized in an interactive chart

## Example Values

### Material Properties

Common engineering materials with their Young's Modulus (E) and Density (ρ):

| Material | Young's Modulus (Pa) | Density (kg/m³) |
|----------|---------------------|-----------------|
| **Steel (AISI 1020)** | `2.10e11` (210,000,000,000) | `7850` |
| **Aluminum (6061)** | `6.9e10` (69,000,000,000) | `2700` |
| **Titanium (Ti-6Al-4V)** | `1.14e11` (114,000,000,000) | `4430` |
| **Carbon Fiber (Typical)** | `1.50e11` (150,000,000,000) | `1600` |
| **Stainless Steel (304)** | `1.93e11` (193,000,000,000) | `8000` |
| **Brass** | `1.00e11` (100,000,000,000) | `8500` |
| **Copper** | `1.20e11` (120,000,000,000) | `8960` |
| **Concrete (Normal)** | `3.0e10` (30,000,000,000) | `2400` |
| **Wood (Oak)** | `1.1e10` (11,000,000,000) | `750` |
| **Polymer (ABS)** | `2.3e9` (2,300,000,000) | `1050` |

### Common Beam Dimensions

Example configurations for different applications:

**Small Structural Element (e.g., Drone Arm)**
- Length: `0.25` m
- Width: `0.020` m
- Depth: `0.004` m
- Material: Aluminum (6061)

**Machine Tool Component**
- Length: `0.4` m
- Width: `0.060` m
- Depth: `0.020` m
- Material: Steel (AISI 1020)

**Bridge/Structural Member**
- Length: `2.0` m
- Width: `0.150` m
- Depth: `0.030` m
- Material: Wood (Oak)

### Quick Reference Values

For a typical steel beam:
- Young's Modulus: `2.10e11` Pa (or `210000000000`)
- Density: `7850` kg/m³

## Technical Details

The application uses:
- **Next.js 14** with React 18
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Euler-Bernoulli Beam Theory** for calculations

The calculations solve characteristic equations for each beam type using numerical methods (Newton-Raphson) to find the roots (bL values), which are then used to calculate natural frequencies and mode shapes.

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page
│   └── globals.css      # Global styles
├── components/
│   ├── BeamTypeSelector.tsx    # Beam type selection UI
│   ├── BeamPropertiesForm.tsx   # Input form for properties
│   ├── ModeShapeChart.tsx      # Chart visualization
│   └── ResultsDisplay.tsx      # Natural frequencies display
├── lib/
│   └── beamAnalysis.ts  # Core calculation engine
└── package.json
```

## License

MIT

