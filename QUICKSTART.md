# 🚀 Packet Royale - Quick Start Guide

## Instant Setup (30 seconds)

```bash
# Navigate to the frontend project
cd packet-royale-frontend

# If dependencies aren't installed yet:
npm install

# Start the development server
npm run dev
```

**Open your browser to:** `http://localhost:5173/`

## 🎮 What You'll See

A TRON-inspired hex grid battlefield with:
- **Glowing cyan grid** representing the network topology
- **Pulsing nodes** - Your base (center) and captured territory
- **Animated particle streams** - Data packets flowing between nodes
- **Dark fog of war** - Unexplored regions of the network
- **Cyberpunk HUD** - Throughput meter and control buttons

## 🕹️ Try This First

1. **Pan Around**: Use arrow keys or right-click + drag
2. **Zoom**: Scroll mouse wheel to see particle details
3. **Click a Node**: Watch the pulse effect on selection
4. **Watch the Streams**: See animated particles flowing with varying speeds based on bandwidth
5. **Observe Capture**: Node at position (2,0) is being captured - watch the progress circle
6. **Check Bandwidth Colors**: Cyan = healthy, Yellow = moderate, Red = overloaded

## 💡 Understanding the Visualization

### Nodes (Server Icons)
- **Large pulsing cyan node (center)** = Your base
- **Medium cyan nodes** = Your captured territory
- **Small grey nodes** = Neutral (capturable)
- **Dark hexes** = Unexplored (fog of war)

### Streams (Connection Lines)
- **Cyan flowing particles** = Data packets being transmitted
- **Thickness** = Bandwidth capacity
- **Particle speed** = Utilization rate
- **Color shift (cyan→yellow→red)** = Congestion level

### HUD Elements
- **Top Left**: Game title
- **Top Center**: Total throughput (updates in real-time)
- **Top Right**: Node count, player indicator
- **Bottom**: Action buttons (demo - console logs on click)
- **Scanline effect**: Subtle horizontal line scrolling for CRT aesthetic

## 🎨 Visual Features Showcase

### What Makes This TRON-Themed?
1. **Neon grid lines** with glow effect
2. **Dark background** (#0a0a1a) representing the digital void
3. **Cyan/blue color scheme** - Classic TRON palette
4. **Particle systems** - "Packets on the grid"
5. **CRT effects** - Scanlines, subtle flicker
6. **Geometric shapes** - Clean, technical aesthetic

### Network Warfare Concept
- Grid represents **internal network topology**
- Nodes are **virtual instances/servers**
- Streams visualize **bandwidth abuse** (the "unintended behavior")
- Particles represent **actual packets** being transmitted
- Colors show **network stress** levels

## 📊 Current Demo Data

The visualization uses dummy data showing:
- **91 nodes** in a hex spiral pattern
- **2 players** (you vs opponent - hidden in fog)
- **5 active streams** from your base
- **1 active capture** at 65% progress
- **Dynamic updates** every 100ms

All data fluctuates to simulate:
- Bandwidth variations
- Packet transmission
- Capture progress
- Network congestion

## 🔧 Customization Quick Tips

### Change Colors
Edit `src/config/visualConstants.ts`:
```typescript
PLAYER_1: 0xff00ff,  // Change to magenta
GRID_PRIMARY: 0xff0000,  // Change to red grid
```

### Adjust Speed
```typescript
PARTICLE_SPEED: 400,  // Double the packet speed
PULSE_SPEED: 1000,    // Faster node pulsing
```

### Add More Nodes
Edit `src/utils/dummyData.ts`:
```typescript
generateHexSpiral(10)  // More rings = more nodes
```

## 🐛 Troubleshooting

### Port Already in Use?
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or change port in vite.config
```

### Not Seeing Particles?
- Zoom in closer (scroll wheel)
- Check browser console for errors
- Ensure WebGL is enabled in browser

### Grid Not Visible?
- Try zooming out
- Check that you're on the default zoom level
- Refresh the page

## 📱 Next Steps

### For Development:
1. Open browser console to see node click events
2. Modify dummy data to test different scenarios
3. Adjust visual constants to match your aesthetic
4. Add backend integration (see README.md)

### For Demo/Presentation:
1. Zoom to show full network topology
2. Click nodes to show interactivity
3. Explain the TRON aesthetic and network warfare theme
4. Show fog of war (unexplored areas)
5. Point out real-time bandwidth fluctuations
6. Click "Launch Attack" button to show win/loss modal

## 🎯 Hackathon Pitch Points

1. **Theme Integration**: "Unintended Behavior" → Using network bandwidth in unconventional ways
2. **Visual Impact**: TRON aesthetic immediately grabs attention
3. **Technical**: Phaser.js particle systems, hex grid math, real-time updates
4. **Gameplay**: Strategy game meets network simulation
5. **Scalability**: Architecture ready for backend integration

---

**Built with Phaser.js + TypeScript + Vite**

**Server Running:** The dev server auto-reloads on file changes!
