import React from 'react';
import { motion } from 'framer-motion';

const orbs = [
  { size: 320, x: '8%', y: '12%', color: 'rgba(48, 141, 70, 0.12)', delay: 0, duration: 18 },
  { size: 240, x: '78%', y: '8%', color: 'rgba(47, 128, 237, 0.1)', delay: 2, duration: 22 },
  { size: 180, x: '65%', y: '72%', color: 'rgba(244, 130, 37, 0.08)', delay: 4, duration: 16 },
  { size: 140, x: '15%', y: '68%', color: 'rgba(99, 102, 241, 0.09)', delay: 1, duration: 20 },
];

const FloatingOrbs = ({ variant = 'default' }) => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden="true">
    {orbs.map((orb, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full blur-3xl"
        style={{
          width: orb.size,
          height: orb.size,
          left: orb.x,
          top: orb.y,
          background: variant === 'editor' ? orb.color.replace(/0\.\d+\)/, '0.06)') : orb.color,
        }}
        animate={{
          y: [0, -30, 0, 20, 0],
          x: [0, 15, -10, 8, 0],
          scale: [1, 1.08, 0.95, 1.05, 1],
        }}
        transition={{
          duration: orb.duration,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: orb.delay,
        }}
      />
    ))}
  </div>
);

export default FloatingOrbs;
