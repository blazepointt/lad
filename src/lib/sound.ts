// Мягкий двухтональный сигнал по окончании таймера.
// AudioContext создаётся по нажатию «Старт» (требование браузеров),
// поэтому контекст живёт в модуле.

let ctx: AudioContext | null = null

type Ctor = typeof AudioContext

export function ensureAudio(): void {
  try {
    if (!ctx) {
      const W = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor }
      const AC = W.AudioContext || W.webkitAudioContext
      if (AC) ctx = new AC()
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

export function chime(): void {
  if (!ctx) return
  try {
    const t = ctx.currentTime
    const notes: Array<[number, number]> = [
      [0, 523.25], // до
      [0.22, 783.99], // соль
    ]
    for (const [dt, freq] of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t + dt)
      gain.gain.exponentialRampToValueAtTime(0.2, t + dt + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dt + 1.1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t + dt)
      osc.stop(t + dt + 1.2)
    }
  } catch {
    // звук — необязательная роскошь
  }
}
