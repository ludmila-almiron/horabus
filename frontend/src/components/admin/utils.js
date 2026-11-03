export function fechaLocalInput(date) {
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function defaultCaducaAt() {
  return fechaLocalInput(new Date(Date.now() + 12 * 60 * 60 * 1000))
}

export const AVISO_VACIO = { tipo: 'otro', descripcion: '', empresa: '', aprobado: true, activo: true }
