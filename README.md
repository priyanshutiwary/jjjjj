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

For a steel beam:
- Young's Modulus: `2.05e11` Pa (or `205000000000`)
- Density: `7830` kg/m³

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

