// Frases gamberras y faltonas para dar personalidad a la app.
// `pick` elige de forma determinista según una "semilla" para que el texto no
// cambie en cada render (evita parpadeos).

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pick(arr: string[], seed: string): string {
  return arr[hash(seed) % arr.length]
}

export const GREETINGS = [
  'Ey {name} 👋',
  '{name}, ¿a quién toca sablear hoy?',
  'Buenas, {name}, fiera de las finanzas dudosas',
  '{name}, el banco del grupo ha llegado',
  'Mira quién aparece: {name} 🤨',
  '{name}, las cuentas no se cuadran solas',
]

export const OWED = [
  'Te deben {amount}. Cobra, que esto no es una ONG.',
  '{amount} a tu favor. Eres el cajero del grupo.',
  'Te deben {amount}. Ve afilando el WhatsApp.',
  '{amount} pendientes. Que no se hagan los suecos.',
]

export const OWE = [
  'Debes {amount}. Manirroto.',
  'Debes {amount}. Paga, rata 🐀',
  '{amount} a deber. La vergüenza no se transfiere sola.',
  'Debes {amount}. Pagafantas profesional.',
  '{amount} en números rojos. Apechuga.',
]

export const SETTLED = [
  'Estás en paz 🎉 (milagro)',
  'Cero deudas. Por una vez.',
  'Limpio como una patena ✨',
  'No debes nada. Disfrútalo, durará poco.',
]

export const EMPTY_GROUPS = [
  'Aquí no hay ni grupos ni drama… todavía. Crea uno y empieza el show.',
  'Cero grupos. ¿Tienes amigos o qué? 😏',
  'Esto está más vacío que tu cuenta a final de mes.',
]

export const EMPTY_EXPENSES = [
  'Ni un gasto. ¿Pagáis con sonrisas?',
  'Aquí no ha gastado nadie. Sospechoso.',
  'Vacío total. Alguien tendrá que rascarse el bolsillo.',
]

export const EMPTY_FRIENDS = [
  'No compartes pasta con nadie. Qué solitario, oye.',
  'Sin amigos con deudas. ¿Eres el rata o el pringado?',
  'Aquí no hay nadie. Invita a gente y que empiece la fiesta.',
]

export const EMPTY_ACTIVITY = [
  'Silencio absoluto. Nadie ha gastado. Muy raro.',
  'Aquí no pasa nada. Aburridos.',
  'Ni actividad ni nada. Espabilad.',
]

export const ALL_SETTLED_GROUP = [
  '¡Todo saldado! Por hoy nadie es el rata.',
  'Cuentas a cero. El chocolate, espeso.',
  'Nadie debe nada. Aprovechad para presumir.',
]
