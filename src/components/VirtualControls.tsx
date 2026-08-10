import React, { useRef, useEffect } from 'react';
import { ControlMode, Vector2D } from '../types';

interface VirtualControlsProps {
  controlMode: ControlMode;
  joystickVectorRef: React.MutableRefObject<Vector2D>;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  controlMode,
  joystickVectorRef,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const touchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (controlMode !== 'JOYSTICK') return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      isDraggingRef.current = true;
      updateJoystick(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          resetJoystick();
          break;
        }
      }
    };

    const updateJoystick = (clientX: number, clientY: number) => {
      if (!container || !knobRef.current) return;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const maxRadius = rect.width / 2 - 10;

      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalized vector (-1 to 1)
      joystickVectorRef.current = {
        x: dx / maxRadius,
        y: dy / maxRadius,
      };
    };

    const resetJoystick = () => {
      isDraggingRef.current = false;
      touchIdRef.current = null;
      if (knobRef.current) {
        knobRef.current.style.transform = 'translate(0px, 0px)';
      }
      joystickVectorRef.current = { x: 0, y: 0 };
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [controlMode, joystickVectorRef]);

  if (controlMode === 'DRAG') {
    return null; // Drag mode handles direct screen touch
  }

  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-auto select-none touch-none">
      {controlMode === 'JOYSTICK' && (
        <div
          ref={containerRef}
          className="w-28 h-28 rounded-full bg-slate-900/60 backdrop-blur-md border-2 border-slate-700/60 flex items-center justify-center relative shadow-xl"
        >
          <div
            ref={knobRef}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 border border-white/50 shadow-lg transition-transform duration-75"
          />
        </div>
      )}
    </div>
  );
};
