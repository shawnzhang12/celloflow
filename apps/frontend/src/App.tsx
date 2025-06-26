// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import './index.css'
import type { Note, StringName } from './types'
import { TEST_NOTES } from './testNotes'

// === Visual constants ===
const STRING_COLORS: Record<StringName, string> = {
  C: '#FF4C4C', // red (bottom string)
  G: '#00FF77', // green
  D: '#FFD700', // yellow
  A: '#00AFFF', // blue (top string)
}

// Visual order top → bottom (real cello layout)
const STRINGS: StringName[] = ['A', 'D', 'G', 'C']

const BINS_PER_STRING = 7
const STRING_VERTICAL_SPACING = 110
const FINGERBOARD_LEFT = 300
const BIN_WIDTH = 60
const FINGERBOARD_WIDTH = BINS_PER_STRING * BIN_WIDTH
const VIEWPORT_HEIGHT = 600
const FALL_SPEED = 180 // px per second – constant velocity
const MIN_NOTE_HEIGHT = 32 // px (shortest blip)

const getX = (bin: number) => FINGERBOARD_LEFT + bin * BIN_WIDTH

function App() {
  const [currentTime, setCurrentTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const startRef = useRef<number | null>(null)
  const pauseOffset = useRef<number>(0) // seconds elapsed when paused
  const rafId = useRef<number>()

  // Play / pause toggle
  const togglePlay = () => {
    if (isRunning) {
      // pause → record offset & stop RAF
      setIsRunning(false)
      pauseOffset.current = currentTime
      if (rafId.current) cancelAnimationFrame(rafId.current)
    } else {
      // start / resume
      startRef.current = null // reset; will be set in RAF
      setIsRunning(true)
    }
  }

  // RAF loop – only active while running
  useEffect(() => {
    if (!isRunning) return

    const raf = (ts: number) => {
      if (!startRef.current) startRef.current = ts - pauseOffset.current * 1000
      setCurrentTime((ts - startRef.current) / 1000)
      rafId.current = requestAnimationFrame(raf)
    }
    rafId.current = requestAnimationFrame(raf)

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [isRunning])

  return (
    <div className="visual-root">
      {/* Play / Pause button */}
      <button className="play-btn" onClick={togglePlay}>
        {isRunning ? 'Pause' : 'Play'}
      </button>

      <div className="fingerboard" style={{ height: VIEWPORT_HEIGHT + 300 }}>
        {STRINGS.map((string, sIdx) => {
          const y = 260 + sIdx * STRING_VERTICAL_SPACING
          const notesForString = TEST_NOTES.filter(n => n.string === string)
          return (
            <div key={string}>
              <div
                className="string-line"
                style={{ top: y, left: FINGERBOARD_LEFT, width: FINGERBOARD_WIDTH }}
              />

              {notesForString.map(note => {
                const elapsed = currentTime - note.startTime
                if (elapsed < -2) return null

                const noteHeight = Math.max(note.duration * FALL_SPEED, MIN_NOTE_HEIGHT)
                const startTop = -noteHeight - 50
                const top = startTop + elapsed * FALL_SPEED
                if (top > y + noteHeight) return null

                const x = getX(note.bin ?? 0)
                const isImpact = top + noteHeight >= y && top <= y + 6

                return (
                  <div
                    key={note.id}
                    className={`note ${isImpact ? 'impact' : ''}`}
                    style={{
                      top,
                      left: x,
                      height: noteHeight,
                      width: BIN_WIDTH - 6,
                      backgroundColor: STRING_COLORS[string],
                      opacity: note.isOpen ? 0.85 : 1,
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App
