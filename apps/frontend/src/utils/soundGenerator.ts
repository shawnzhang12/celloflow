// Simple sound generator for cello notes
class SoundGenerator {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  // Initialize audio context (needs user interaction)
  init() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Generate a simple sine wave tone
  playTone(frequency: number, duration: number = 0.5, volume: number = 0.3) {
    if (!this.audioContext || !this.isInitialized) return;

    try {
      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Set frequency
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

      // Set volume
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      // Start and stop
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
  }

  // Get frequency for a note based on string and position
  getNoteFrequency(string: string, position: number): number {
    // Base frequencies for each string (approximate cello tuning)
    const baseFrequencies: Record<string, number> = {
      'C': 65.41,  // C2
      'G': 98.00,  // G2  
      'D': 146.83, // D3
      'A': 220.00, // A3
    };

    const baseFreq = baseFrequencies[string] || 220;
    
    // Each position is a semitone higher
    // 2^(position/12) gives us the frequency multiplier for semitones
    return baseFreq * Math.pow(2, position / 12);
  }

  // Play a note with the given string and position
  playNote(string: string, position: number, duration: number = 0.3) {
    const frequency = this.getNoteFrequency(string, position);
    this.playTone(frequency, duration);
  }
}

// Create singleton instance
export const soundGenerator = new SoundGenerator();

// Initialize on first user interaction
export function initSound() {
  soundGenerator.init();
} 