---
title: Notes on simulating slime mold in a fragment shader
date: 2026-10-07
summary: Agents in textures, trails in ping-pong buffers, and why everything wraps around.
draft: true
hidden: true
---

## Outline

- **What you're looking at:** the GPU slime mold simulation behind this site, where hundreds of thousands of agents follow and lay down pheromone trails and react to your cursor.
- **Agents in textures:** storing agent state on the GPU.
- **Trails in ping-pong buffers:** deposit, diffuse, decay.
- **Why everything wraps around.**
- **Making it fast and accessible:** pausing, reduced motion, and a no-WebGL fallback.
