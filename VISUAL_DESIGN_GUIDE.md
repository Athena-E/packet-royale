# 🎨 Packet Royale - Visual Design Guide

## Design Philosophy: "Network Command & Control"

The UI isn't just *on* the screen - it **IS** the game world. Players view the game through a TRON-inspired command terminal, observing network topology as glowing nodes on a digital grid.

---

## 🌈 Color Palette

### Primary Colors (TRON Aesthetic)
```css
Background Dark:    #0a0a1a  /* Digital void */
Grid Primary:       #00d4ff  /* Cyan glow - main grid lines */
Grid Secondary:     #0066cc  /* Deep blue - accent */
Grid Glow:          #4dd9ff  /* Light cyan - outer glow */
```

### Player Colors
```css
Player 1 (You):     #00ffff  /* Cyan - protagonist color */
Player 2:           #ff006e  /* Hot Pink - antagonist */
Player 3:           #00ff88  /* Neon Green - ally 1 */
Player 4:           #ffaa00  /* Orange - ally 2 */
```

### Network Status Colors
```css
Healthy:            #00ffff  /* Cyan - low utilization */
Moderate:           #ffff00  /* Yellow - medium load */
Stressed:           #ff6600  /* Orange - high load */
Critical:           #ff0044  /* Red - overloaded/attack */
```

### UI Elements
```css
UI Primary:         #00ffff  /* Buttons, borders */
UI Success:         #00ff88  /* Confirmations */
UI Warning:         #ffaa00  /* Alerts */
UI Danger:          #ff0044  /* Errors, attacks */
UI Text:            #ffffff  /* Primary text */
UI Text Dim:        #99ccff  /* Secondary text */
```

### Neutral Elements
```css
Neutral Node:       #666699  /* Unclaimed nodes */
Neutral Glow:       #9999cc  /* Subtle highlight */
```

---

## 🔷 Shape Language

### Hexagons (Primary Shape)
- **Why**: Strategy game classic (Catan, Civ), tessellates perfectly
- **Angle**: Flat-top orientation (pointy sides)
- **Size**: 40px radius (80px point-to-point)
- **Line Weight**: 2px main + 4px glow
- **Usage**: Grid cells, node territories

### Circles (Energy/Data)
- **Why**: Represents digital energy, packets, nodes
- **Usage**:
  - Small (3px): Particle packets
  - Medium (12-16px): Nodes
  - Large (32px): Base nodes
  - Expanding (animated): Selection feedback, progress indicators

### Straight Lines (Connections)
- **Why**: Direct data paths, clean technical aesthetic
- **Thickness**: 2-8px (varies with bandwidth)
- **Style**: Dual-layer (glow + solid)
- **Usage**: Bandwidth streams between nodes

---

## ✨ Visual Effects Library

### 1. Glow Effect (Signature TRON Look)
```typescript
// Dual-layer rendering
Outer Layer: Width × 2, Color, Alpha 0.3
Inner Layer: Width × 1, Color, Alpha 0.8
```
**Applied to**: Grid lines, nodes, streams, UI borders

### 2. Pulse Animation
```typescript
// Sine wave modulation
frequency: 2000ms (0.5 Hz)
range: 0.7 - 1.0 alpha
easing: smooth sine
```
**Applied to**: Node glows, base rotation

### 3. Particle Streams
```typescript
Properties:
  - Emission: 30 particles/second
  - Speed: 100-200 px/s
  - Lifespan: Distance-based
  - Scale: Start 1.0 → End 0.0
  - Alpha: Start 0.8 → End 0.0
  - Blend: Additive (for glow)
```
**Applied to**: Bandwidth data flow

### 4. CRT Screen Effects
```css
/* Scanlines */
background: repeating-linear-gradient(
  0deg,
  rgba(0,0,0,0.15) 0px,
  rgba(0,0,0,0.15) 1px,
  transparent 1px,
  transparent 2px
);

/* Flicker */
@keyframes flicker {
  0%, 100% { opacity: 0.98; }
  50% { opacity: 1.0; }
}
animation: flicker 0.15s infinite;
```

### 5. Selection Feedback
```typescript
// Expanding ring pulse
duration: 500ms
alpha: 1.0 → 0.0
scale: 1.0 → 2.0
color: UI Primary
```

### 6. Fog of War
```typescript
fill: Background color
alpha: 0.85 (85% opacity)
overlay: Subtle grid lines (alpha 0.3)
```

---

## 🎭 Animation Principles

### Speed Guidelines
- **Fast** (100-300ms): Button feedback, clicks
- **Medium** (500-1000ms): Node pulses, selection rings
- **Slow** (2000-3000ms): Base rotation, breathing effects
- **Continuous**: Particle streams, scanlines

### Easing
- **UI Interactions**: EaseInOut (smooth start/stop)
- **Pulsing**: Sine wave (natural breathing)
- **Particles**: Linear (constant velocity)
- **Expansion**: EaseOut (quick start, slow finish)

---

## 🖥️ Typography

### Font Family
```css
font-family: 'Courier New', 'Consolas', monospace;
```
**Why**: Monospace = technical/hacker aesthetic

### Text Hierarchy
```css
Title:     24px bold #00ffff (with glow)
Primary:   20px bold #00ff88 (data values)
Secondary: 16px regular #99ccff (labels)
Tertiary:  12px regular #666699 (hints)
```

### Text Effects
```css
/* Neon glow for important text */
text-shadow:
  0 0 5px currentColor,
  0 0 10px currentColor,
  0 0 20px currentColor;
```

---

## 📐 Spacing & Layout

### Grid System
```
Hex size: 40px radius
Gap between hexes: Adjacent (touching edges)
Grid pattern: Axial coordinates (q, r)
```

### UI Margins
```css
Screen edges: 20px
Between elements: 10-15px
Button padding: 15px horizontal, 10px vertical
```

### HUD Layout
```
Top Bar:    60px height
Bottom Bar: 80px height
Side margins: 20px
```

---

## 🎬 Scene Composition

### Depth Layers (Back to Front)
1. **Background**: Dark void with subtle grid pattern
2. **Hex Grid**: Glowing lines on explored territory
3. **Bandwidth Streams**: Particle lines between nodes
4. **Nodes**: Pulsing energy cores
5. **Fog of War**: Dark overlay on unexplored
6. **UI Layer**: HUD fixed to camera
7. **Effects**: Scanlines, screen borders

### Visual Hierarchy
- **Most Important**: Your base node (largest, brightest)
- **Important**: Owned nodes, active streams
- **Moderate**: Neutral nodes, grid
- **Background**: Fog, unexplored areas

---

## 🎨 State-Based Visuals

### Node States

#### Neutral
```
Size: 12px radius
Color: #666699 (grey)
Glow: Minimal (20% opacity)
Animation: Slow pulse
```

#### Owned
```
Size: 16px radius
Color: Player color (cyan/pink/green/orange)
Glow: Strong (30% opacity variation)
Inner core: White (60% opacity pulse)
Animation: Medium pulse (2s cycle)
```

#### Base
```
Size: 32px radius
Color: Player color
Glow: Very strong
Inner core: Bright white
Extra: Rotating ring (3s rotation)
```

#### Under Attack / Capturing
```
Add: Yellow circular progress ring
Position: 1.8× node radius
Thickness: 3px
Animation: Fills from 0° to 360°
```

### Stream States

#### Low Utilization (< 50%)
```
Width: 2-4px
Color: #00ffff (cyan)
Particles: Sparse, slow
```

#### Medium Utilization (50-75%)
```
Width: 4-6px
Color: #ffff00 (yellow)
Particles: Moderate, medium speed
```

#### High Utilization (75-90%)
```
Width: 6-7px
Color: #ff6600 (orange)
Particles: Dense, fast
```

#### Critical (> 90%)
```
Width: 8px
Color: #ff0044 (red)
Particles: Very dense, very fast
Flicker: Occasional drops (packet loss)
```

---

## 🌫️ Fog of War Design

### Unexplored Areas
```
Overlay: 85% opaque background color
Grid: 30% opacity faint lines
Nodes: Not rendered
Effect: "Static" or "signal noise"
```

### Exploration Transition
```
Duration: 300ms
Effect: Fade from fog to clear
Trigger: When allied node establishes vision
```

---

## 🎮 Interactive Elements

### Buttons
```css
Default:
  background: #001a33
  color: #00ffff
  border: 2px solid transparent

Hover:
  background: #003366
  color: #ffffff
  cursor: pointer

Active:
  background: #004d99
  flash animation (100ms)
```

### Node Hover
```
Cursor: pointer
Effect: None (to avoid clutter)
Future: Could add subtle highlight ring
```

### Node Click
```
Effect: Expanding pulse ring
Color: #00ffff
Duration: 500ms
Scale: 1.0 → 2.0
Alpha: 1.0 → 0.0
```

---

## 📱 Responsive Considerations

### Canvas Scaling
```typescript
mode: Phaser.Scale.FIT
autoCenter: CENTER_BOTH
aspect: 16:9 (1280×720)
```

### Minimum Size
- Width: 1024px recommended
- Height: 576px recommended
- Below: Elements may overlap

---

## 🎥 Cinematic Moments

### Game Start
- Fade in from black
- Grid materializes
- Nodes power on sequentially
- HUD slides in

### Node Capture
- Progress ring fills
- Final burst of particles
- Color transition (grey → player color)
- Expanding shockwave ring

### Win Condition
- Modal overlay (80% black)
- Warning text pulse (red)
- "Connection Established" message
- [INITIATE ATTACK] button glow

### Loss Condition
- Screen glitch effect
- Color distortion
- Scanlines intensify
- "SYSTEM FAILURE" message
- Fragmentation animation

---

## 🔧 Design Tokens (for Backend Reference)

```json
{
  "colors": {
    "players": ["#00ffff", "#ff006e", "#00ff88", "#ffaa00"],
    "utilization": ["#00ffff", "#ffff00", "#ff6600", "#ff0044"]
  },
  "sizes": {
    "hex": 40,
    "nodeSmall": 12,
    "nodeMedium": 16,
    "nodeLarge": 32,
    "streamMin": 2,
    "streamMax": 8
  },
  "timing": {
    "pulse": 2000,
    "rotation": 3000,
    "feedback": 500,
    "flicker": 150
  }
}
```

---

## 🎯 Design Guidelines Summary

### DO ✅
- Use cyan/blue as primary color
- Add glow effects to everything
- Keep animations smooth (60 FPS)
- Use geometric shapes
- Layer elements for depth
- Emphasize particle effects
- Make data flow visible

### DON'T ❌
- Use bright backgrounds
- Overload with colors
- Make static connections
- Hide important information
- Use serif fonts
- Add realistic textures
- Make UI opaque

---

## 🏆 Inspiration References

### Visual Style
- **TRON (1982)**: Original neon grid aesthetic
- **TRON: Legacy (2010)**: Modern refined look
- **Hackers (1995)**: Cyberspace visualization
- **The Matrix**: Green-tinted digital world
- **Watch Dogs**: Network node visualization

### Game Design
- **Catan**: Hex grid resource management
- **Polytopia**: Minimal hex strategy
- **Plague Inc**: World network spread
- **Uplink**: Hacking interface
- **EVE Online**: Network topology maps

---

**Remember**: Every visual element should reinforce the theme of **"network warfare in a digital battlefield."** The player is a commander viewing a real-time network topology map, manipulating bandwidth streams to capture territory.
