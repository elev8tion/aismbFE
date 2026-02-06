'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LiquidMorphLogoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function LiquidMorphLogo({
  src,
  alt,
  width = 300,
  height = 90,
  className = ''
}: LiquidMorphLogoProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15,
      },
    },
  };

  const scaleFactor = width / 300;
  const baseBlobSize = 40 * scaleFactor;
  const blobIncrement = 15 * scaleFactor;
  const padding = `${5 * scaleFactor}%`;

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter
            id="goo"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <motion.div
        className={`relative ${className}`}
        style={{
          width: '100%',
          maxWidth: width,
          minHeight: height,
          filter: 'url(#goo)',
          padding,
        }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(4)].map((_, i) => {
          const blobSize = baseBlobSize + i * blobIncrement;
          return (
            <motion.div
              key={`primary-${i}`}
              className="absolute rounded-full"
              style={{
                width: blobSize,
                height: blobSize,
                left: `${20 + i * 18}%`,
                top: `40%`,
                background: i % 2 === 0 ? 'rgba(14, 165, 233, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                boxShadow: '0 4px 16px 0 rgba(14, 165, 233, 0.3)',
              }}
              initial={{
                opacity: 0,
                scale: 0,
                x: i % 2 === 0 ? -200 : 200,
                y: -100,
                rotate: i * 30,
              }}
              animate={{
                opacity: [0, 0.9, 0.6, 0],
                scale: [0, 1.6, 1.2, 0.95],
                x: 0,
                y: 0,
                rotate: 0,
              }}
              transition={{
                duration: 2.4,
                delay: i * 0.2,
                ease: [0.175, 0.885, 0.32, 1.275],
              }}
            />
          );
        })}

        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)',
              backdropFilter: 'blur(24px) saturate(150%)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              boxShadow: '0 8px 32px 0 rgba(14, 165, 233, 0.4), inset 0 1px 0 0 rgba(14, 165, 233, 0.2)',
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: [0, 0.7, 1.4, 1.1, 1],
              rotate: [-180, -90, 45, 0],
              borderRadius: [
                '50%',
                '60% 40% 50% 50%',
                '40% 60% 40% 60%',
                '55% 45% 55% 45%',
                '50%'
              ],
            }}
            transition={{
              duration: 2.8,
              delay: 0.6,
              ease: [0.6, -0.28, 0.735, 0.045],
              times: [0, 0.2, 0.5, 0.8, 1],
            }}
          />

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(125, 211, 252, 0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.15)',
            }}
            initial={{ scale: 0, rotate: 180 }}
            animate={{
              scale: [0, 1.3, 1],
              rotate: [180, 360],
              borderRadius: [
                '50%',
                '45% 55% 48% 52%',
                '52% 48% 55% 45%',
                '50%'
              ],
            }}
            transition={{
              duration: 2.5,
              delay: 0.9,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />

          <motion.div
            className="relative z-10"
            initial={{
              opacity: 0,
              scale: 0.3,
              y: 50,
              filter: 'blur(20px)',
              rotate: -15,
            }}
            animate={{
              opacity: [0, 0, 1, 1],
              scale: [0.3, 0.5, 1.15, 1],
              y: [50, 30, -5, 0],
              filter: ['blur(20px)', 'blur(10px)', 'blur(0px)', 'blur(0px)'],
              rotate: [-15, -8, 2, 0],
            }}
            transition={{
              duration: 2.2,
              delay: 1.4,
              ease: [0.34, 1.56, 0.64, 1],
              times: [0, 0.3, 0.7, 1],
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="w-full h-auto relative z-20"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-full -z-10"
            style={{
              background: 'rgba(14, 165, 233, 0.08)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(14, 165, 233, 0.12)',
            }}
            animate={{
              scale: [1, 1.08, 0.95, 1],
              opacity: [0.3, 0.5, 0.4, 0.3],
              rotate: [0, 4, -4, 0],
              borderRadius: [
                '42% 58% 53% 47% / 48% 62% 38% 52%',
                '48% 52% 47% 53% / 55% 45% 60% 40%',
                '53% 47% 58% 42% / 38% 58% 42% 58%',
                '47% 53% 42% 58% / 52% 48% 55% 45%',
                '42% 58% 53% 47% / 48% 62% 38% 52%',
              ],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: [0.45, 0.05, 0.55, 0.95],
            }}
          />
        </motion.div>

        {[...Array(5)].map((_, i) => {
          const dripSize = (9 + i * 2) * scaleFactor;
          return (
            <motion.div
              key={`drip-${i}`}
              className="absolute rounded-full"
              style={{
                width: dripSize,
                height: dripSize,
                left: `${18 + i * 16}%`,
                top: '8%',
                background: i % 2 === 0 ? 'rgba(14, 165, 233, 0.35)' : 'rgba(56, 189, 248, 0.3)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
                boxShadow: '0 4px 12px 0 rgba(14, 165, 233, 0.4)',
              }}
              initial={{
                opacity: 0,
                scale: 0,
                y: -40,
              }}
              animate={{
                opacity: [0, 0.85, 0.6, 0],
                scale: [0, 1.5, 1.1, 0.4],
                y: [0, 35, 65, 95],
                scaleY: [1, 1.1, 1.4, 1.9],
              }}
              transition={{
                duration: 2.4,
                delay: 0.8 + i * 0.12,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          );
        })}

        {[...Array(4)].map((_, i) => {
          const direction = i % 2 === 0 ? 1 : -1;
          const floatSize = (14 + i * 5) * scaleFactor;
          return (
            <motion.div
              key={`float-${i}`}
              className="absolute rounded-full"
              style={{
                width: floatSize,
                height: floatSize,
                left: `${12 + i * 24}%`,
                top: `${22 + (i % 3) * 18}%`,
                background: i % 3 === 0 ? 'rgba(14, 165, 233, 0.3)' : i % 3 === 1 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(125, 211, 252, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                boxShadow: '0 4px 16px 0 rgba(14, 165, 233, 0.35)',
              }}
              initial={{
                opacity: 0,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 0.75, 0.5, 0],
                scale: [0, 1.8, 1.3, 0.6],
                x: [direction * -50, direction * 18, 0],
                y: [-35, 8, 0],
                rotate: [0, direction * 75, direction * 140],
              }}
              transition={{
                duration: 2.8,
                delay: 0.5 + i * 0.18,
                ease: [0.33, 1, 0.68, 1],
              }}
            />
          );
        })}
      </motion.div>
    </>
  );
}
