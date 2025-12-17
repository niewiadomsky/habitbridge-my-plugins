# Overview
This is monorepo for plugins to HabitBridge - habit tracker app with many developer features.

# Documentation
https://joshspicer.com/HabitBridge

# How to make plugn
The real power of HabitBridge comes from its extensible plugin system. Here’s what you need to know to create your own plugins:

### Plugin Structure
Each plugin consists of two key files:

plugin.js - The JavaScript code that powers your plugin
manifest.json - Metadata that describes your plugin

### API Reference
| Method | Description |
|---|---|
| app.init(callback) | Entry point for your plugin |
| app.renderHTML(htmlString) | Renders your plugin’s UI |
| app.complete() | Marks the habit as complete |

### Global Scope Access
Plugins can expose functions to the global scope for UI interaction in the app’s HTML. This allows you to define event handlers that can be called from HTML elements:

```
// Make functions accessible from HTML event handlers
window.functionName = () => {
  // Function logic
};

app.init(() => {
  app.renderHTML(`
    <button onclick="functionName()">Click me</button>
  `);
});
```

### Get Creative!
Get creative with your plugins! The Morse Code plugin demonstrates how to access device audio capabilities:

```
// Audio context creation example
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Basic audio playback
function playSound() {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // Short beep
}
```

### Example
Here’s a simple example of a HabitBridge plugin that tracks button clicks as a habit challenge. The user must click a button 3 times to complete the habit.

```
app.init(() => {
  let clicks = 0;
  
  app.renderHTML(`
    <h1>Click the button to complete</h1>
    <button onclick="buttonClick()" class="btn">Click me</button>
    <div id="counter">Clicks: 0</div>
    <style>.btn { padding: 10px; }</style>
  `);
  
  window.buttonClick = () => {
    clicks++;
    document.getElementById("counter").textContent = `Clicks: ${clicks}`;
    if (clicks >= 3) {
      app.complete();
    }
  };
});
```