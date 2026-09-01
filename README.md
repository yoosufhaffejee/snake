# Local Multiplayer Co-op Snake Game

A local multiplayer snake game built with HTML5 Canvas and JavaScript where up to 8 players can play together on the same keyboard!

## Features
- **Local Multiplayer:** Support for up to 8 players simultaneously on a single screen.
- **Custom Key Bindings:** Dynamically add a player and assign custom keys for movement (Up, Down, Left, Right) on the fly.
- **Head-to-Head Combat:** When two snakes collide heads, the larger snake (the one with the higher score) eats the smaller one!
- **Tail Chopping:** If a snake collides with its own body, that portion of the tail is chopped off, penalizing the player's score.
- **Win Conditions:** First player to reach 25 points in multiplayer wins. In single-player, the goal is to survive and reach 999 points.
- **Touch Support:** Basic touch controls are available for Player 1 on touch-enabled devices.

## How to Play
1. Open `index.html` in your web browser.
2. Click the **Add Snake** button or press the `Space` bar.
3. Follow the on-screen prompt to tap 4 keys to assign controls (Up, Down, Left, Right) for the new player.
4. Add more players using the same method.
5. The game automatically starts when players start moving.
6. Eat the red apples to grow and gain points.
7. Avoid walls (they teleport you to the other side by default) and try to outgrow and defeat your opponents!

## Global Controls
- **Space Bar:** Add a new snake/player.
- **Esc:** Pause or Unpause the game.
- **Enter:** Restart the game.

## Tech Stack
- HTML5 Canvas for 2D rendering.
- Vanilla JavaScript (ES6) for the game loop and logic.
- CSS3 for styling and modal overlays.
