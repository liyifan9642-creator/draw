/**
 * AnimatedBackground — 交互式粒子 + 渐变背景
 *
 * 使用纯 Canvas API 绘制：
 * - 深色渐变底色 + 缓慢流动的色彩光晕
 * - 浮动粒子网络（鼠标靠近时产生连线效果）
 * - 性能友好：requestAnimationFrame + 低粒子密度
 */

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  hue: number;
}

interface GlowOrb {
  x: number;
  y: number;
  radius: number;
  hue: number;
  speed: number;
  angle: number;
  orbitRadius: number;
  cx: number;
  cy: number;
}

const PARTICLE_COUNT = 180;
const GLOW_ORB_COUNT = 5;
const CONNECTION_DIST = 140;
const MOUSE_RADIUS = 180;

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const glowsRef = useRef<GlowOrb[]>([]);
  const rafRef = useRef<number>(0);

  const initParticles = useCallback((w: number, h: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() < 0.3
            ? 170 + Math.random() * 30   // cyan
            : Math.random() < 0.6
              ? 260 + Math.random() * 40  // purple-pink
              : 200 + Math.random() * 30, // blue
      });
    }
    particlesRef.current = particles;

    const glows: GlowOrb[] = [];
    const hues = [260, 200, 180, 320, 300]; // purple, cyan, teal, magenta, pink
    for (let i = 0; i < GLOW_ORB_COUNT; i++) {
      glows.push({
        x: 0,
        y: 0,
        radius: 200 + Math.random() * 150,
        hue: hues[i],
        speed: 0.0003 + Math.random() * 0.0004,
        angle: Math.random() * Math.PI * 2,
        orbitRadius: Math.min(w, h) * 0.3 + Math.random() * 100,
        cx: w * (0.2 + Math.random() * 0.6),
        cy: h * (0.2 + Math.random() * 0.6),
      });
    }
    glowsRef.current = glows;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);

    let time = 0;

    const draw = () => {
      time++;
      const { x: mx, y: my } = mouseRef.current;

      // ── Background gradient ──
      const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
      grad.addColorStop(0, "#070710");
      grad.addColorStop(0.5, "#0a0a1e");
      grad.addColorStop(1, "#0d0820");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // ── Glow orbs (soft light blobs) ──
      ctx.globalCompositeOperation = "screen";
      for (const orb of glowsRef.current) {
        orb.angle += orb.speed;
        orb.x = orb.cx + Math.cos(orb.angle) * orb.orbitRadius;
        orb.y = orb.cy + Math.sin(orb.angle * 0.7) * orb.orbitRadius * 0.6;

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        g.addColorStop(0, `hsla(${orb.hue}, 75%, 55%, 0.14)`);
        g.addColorStop(0.5, `hsla(${orb.hue}, 65%, 40%, 0.07)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(orb.x - orb.radius, orb.y - orb.radius, orb.radius * 2, orb.radius * 2);
      }
      ctx.globalCompositeOperation = "source-over";

      // ── Particles ──
      const particles = particlesRef.current;
      for (const p of particles) {
        // Mouse attraction
        const ddx = mx - p.x;
        const ddy = my - p.y;
        const dist = Math.sqrt(ddx * ddx + ddy * ddy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * 0.015;
          p.vx += (ddx / dist) * force;
          p.vy += (ddy / dist) * force;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.opacity})`;
        ctx.fill();
      }

      // ── Connections ──
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.18;
            ctx.strokeStyle = `hsla(240, 75%, 70%, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Mouse connections
        const mdx = particles[i].x - mx;
        const mdy = particles[i].y - my;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MOUSE_RADIUS) {
          const alpha = (1 - md / MOUSE_RADIUS) * 0.28;
          ctx.strokeStyle = `hsla(270, 85%, 75%, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      // ── Subtle vignette ──
      const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.8);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="vdc-bg-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
