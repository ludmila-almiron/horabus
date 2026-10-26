// NuevoAvisoModal.jsx
// Formulario para que usuarios reporten un aviso comunitario.
// Para "demorado": empresa → origen → destino → horario, todo encadenado desde la BD.

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EMPRESAS = [
  { nombre: 'Crucero del Norte' },
  { nombre: 'Empresa Argentina' },
  { nombre: 'Horianski' },
  { nombre: 'Río Uruguay' },
  { nombre: 'El Cometa' },
  { nombre: 'Oro Verde' },
  { nombre: 'Kruse' },
]

export default function NuevoAvisoModal({ onClose, onCreado }) {
  const [tipo, setTipo] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [horarioSalida, setHorarioSalida] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  // Opciones encadenadas
  const [origenes, setOrigenes] = useState([])
  const [destinos, setDestinos] = useState([])
  const [horarios, setHorarios] = useState([])

  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const requiereRecorrido = tipo === 'demorado' || tipo === 'cancelado'
  const requiereEmpresa = tipo === 'demorado' || tipo === 'cancelado'
  const esOtro = tipo === 'otro'
  const permiteImagen = tipo === 'corte' || tipo === 'otro'

  // 1. Al elegir empresa: cargar orígenes (primera parada de cada viaje)
  useEffect(() => {
    if (!requiereRecorrido || !empresa) { setOrigenes([]); return }
    const cargar = async () => {
      // Traer todos los viajes de la empresa con sus paradas ordenadas por hora
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', empresa).single()
      if (!emp) return

      const { data: viajes } = await supabase
        .from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return

      const viajeIds = viajes.map(v => v.id)

      // Para cada viaje, la parada con hora mínima es el origen
      const { data: paradas } = await supabase
        .from('paradas')
        .select('viaje_id, localidad_id, hora, localidades(nombre)')
        .in('viaje_id', viajeIds)
        .order('hora', { ascending: true })

      if (!paradas) return

      // Agrupar por viaje para saber cuál es la última parada de cada uno
      const ultimasPorViaje = {}
      paradas.forEach(p => { ultimasPorViaje[p.viaje_id] = p }) // quedan con la hora más alta por el order asc

      // Orígenes únicos: todas las paradas excepto las últimas de cada viaje
      const unicos = {}
      paradas.forEach(p => {
        if (ultimasPorViaje[p.viaje_id]?.localidad_id === p.localidad_id) return // es la última, no puede ser origen
        unicos[p.localidad_id] = p.localidades.nombre
      })

      setOrigenes(Object.entries(unicos).map(([id, nombre]) => ({ id: parseInt(id), nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setOrigen('')
      setDestinos([])
      setDestino('')
      setHorarios([])
      setHorarioSalida('')
    }
    cargar()
  }, [empresa, requiereRecorrido])

  // 2. Al elegir origen: cargar destinos posibles
  useEffect(() => {
    if (!requiereRecorrido || !empresa || !origen) { setDestinos([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', empresa).single()
      if (!emp) return

      const { data: viajes } = await supabase
        .from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return

      const viajeIds = viajes.map(v => v.id)

      const { data: paradas } = await supabase
        .from('paradas')
        .select('viaje_id, localidad_id, hora, localidades(nombre)')
        .in('viaje_id', viajeIds)
        .order('hora', { ascending: true })

      if (!paradas) return

      // Viajes que pasan por el origen
      const paradasOrigen = paradas.filter(p => p.localidad_id === parseInt(origen))
      const viajesConOrigen = new Set(paradasOrigen.map(p => p.viaje_id))

      // Para esos viajes, paradas que vienen DESPUÉS del origen
      const horaOrigen = {}
      paradasOrigen.forEach(p => { horaOrigen[p.viaje_id] = p.hora })

      const unicos = {}
      paradas.forEach(p => {
        if (!viajesConOrigen.has(p.viaje_id)) return
        if (p.localidad_id === parseInt(origen)) return
        if (p.hora <= horaOrigen[p.viaje_id]) return
        unicos[p.localidad_id] = p.localidades.nombre
      })

      setDestinos(Object.entries(unicos).map(([id, nombre]) => ({ id: parseInt(id), nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setDestino('')
      setHorarios([])
      setHorarioSalida('')
    }
    cargar()
  }, [origen, empresa, requiereRecorrido])

  // 3. Al elegir destino: cargar horarios de salida disponibles
  useEffect(() => {
    if (!requiereRecorrido || !empresa || !origen || !destino) { setHorarios([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', empresa).single()
      if (!emp) return

      const { data: viajes } = await supabase
        .from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return

      const viajeIds = viajes.map(v => v.id)

      const { data: paradas } = await supabase
        .from('paradas')
        .select('viaje_id, localidad_id, hora')
        .in('viaje_id', viajeIds)
        .order('hora', { ascending: true })

      if (!paradas) return

      // Viajes que tienen origen Y destino en orden correcto
      const horaOrigen = {}
      const horaDestino = {}
      paradas.forEach(p => {
        if (p.localidad_id === parseInt(origen)) horaOrigen[p.viaje_id] = p.hora
        if (p.localidad_id === parseInt(destino)) horaDestino[p.viaje_id] = p.hora
      })

      const horariosValidos = []
      Object.keys(horaOrigen).forEach(vid => {
        if (horaDestino[vid] && horaDestino[vid] > horaOrigen[vid]) {
          horariosValidos.push(horaOrigen[vid].slice(0, 5))
        }
      })

      horariosValidos.sort()
      setHorarios(horariosValidos)
      setHorarioSalida('')
    }
    cargar()
  }, [destino, origen, empresa, requiereRecorrido])

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const placeholder = {
    demorado: 'Opcional: causa de la demora, tiempo estimado, etc.',
    cancelado: 'Opcional: motivo de la cancelación, si lo sabés.',
    corte: 'Ej: Cortada la RN12 a la altura de Jardín América por desborde de arroyo. Vías alternativas: RP6.',
    otro: 'Describí el aviso con la mayor cantidad de detalles posibles: empresa, horario, recorrido, motivo.',
  }[tipo] || ''

  const handleEnviar = async () => {
    if (!tipo) { setError('Seleccioná un tipo de aviso.'); return }
    if (requiereEmpresa && !empresa) { setError('Seleccioná la empresa.'); return }
    if (requiereRecorrido && (!origen || !destino || !horarioSalida)) {
      setError('Completá origen, destino y horario de salida.'); return
    }
    if (!requiereRecorrido && !descripcion.trim()) { setError('La descripción es obligatoria.'); return }
    setError('')
    setEnviando(true)

    let descripcionFinal = descripcion.trim()
    if (requiereRecorrido) {
      const nomOrigen = origenes.find(o => o.id === parseInt(origen))?.nombre || ''
      const nomDestino = destinos.find(d => d.id === parseInt(destino))?.nombre || ''
      const prefijo = `${empresa} · ${horarioSalida} · ${nomOrigen} → ${nomDestino}`
      descripcionFinal = descripcion.trim() ? `${prefijo}. ${descripcion.trim()}` : prefijo
    }

    // Subir imagen si hay una
    let imagen_url = null
    if (permiteImagen && imagen) {
      const ext = imagen.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avisos-imagenes')
        .upload(fileName, imagen, { contentType: imagen.type })
      if (uploadErr) {
        setError('No se pudo subir la imagen. Intentá de nuevo.')
        setEnviando(false)
        return
      }
      const { data: urlData } = supabase.storage
        .from('avisos-imagenes')
        .getPublicUrl(fileName)
      imagen_url = urlData.publicUrl
    }

    const ahora = new Date()
    const caduca_at = esOtro ? null : new Date(ahora.getTime() + 12 * 60 * 60 * 1000).toISOString()

    const { error: err } = await supabase.from('avisos').insert({
      tipo,
      descripcion: descripcionFinal,
      empresa: empresa || null,
      imagen_url,
      aprobado: !esOtro,
      activo: true,
      caduca_at,
    })

    setEnviando(false)
    if (err) {
      setError('Ocurrió un error al enviar. Intentá de nuevo.')
    } else {
      setEnviado(true)
    }
  }

  if (enviado) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal modal--chico" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-titulo">¡Gracias!</h2>
            <button className="modal-cerrar" onClick={onClose}>✕</button>
          </div>
          <p className="avisos-estado">
            {esOtro
              ? 'Tu aviso fue recibido y será revisado antes de publicarse.'
              : 'Tu aviso fue publicado. La comunidad te lo agradece 🙌'}
          </p>
          <div className="avisos-footer">
            <button className="btn-nuevo-aviso" onClick={onCreado}>Ver avisos</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-titulo">Reportar un aviso</h2>
          <button className="modal-cerrar" onClick={onClose}>✕</button>
        </div>

        <div className="nuevo-aviso-form">
          <div className="form-grupo">
            <label className="form-label">Tipo de aviso *</label>
            <select className="form-select" value={tipo} onChange={e => {
              setTipo(e.target.value)
              setEmpresa(''); setOrigen(''); setDestino(''); setHorarioSalida('')
              setOrigenes([]); setDestinos([]); setHorarios([])
            }}>
              <option value="">Seleccioná...</option>
              <option value="demorado">🕐 Colectivo demorado</option>
              <option value="cancelado">❌ Colectivo cancelado</option>
              <option value="corte">🚧 Corte de ruta</option>
              <option value="otro">📢 Otro</option>
            </select>
          </div>

          {requiereEmpresa && (
            <div className="form-grupo">
              <label className="form-label">Empresa *</label>
              <select className="form-select" value={empresa} onChange={e => setEmpresa(e.target.value)}>
                <option value="">Seleccioná...</option>
                {EMPRESAS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>
          )}

          {requiereRecorrido && empresa && origenes.length > 0 && (
            <div className="form-fila">
              <div className="form-grupo">
                <label className="form-label">Origen *</label>
                <select className="form-select" value={origen} onChange={e => setOrigen(e.target.value)}>
                  <option value="">Seleccioná...</option>
                  {origenes.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
              </div>
              <div className="form-grupo">
                <label className="form-label">Destino *</label>
                <select className="form-select" value={destino} onChange={e => setDestino(e.target.value)} disabled={!origen}>
                  <option value="">Seleccioná...</option>
                  {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {requiereRecorrido && destino && horarios.length > 0 && (
            <div className="form-grupo">
              <label className="form-label">Horario de salida *</label>
              <select className="form-select" value={horarioSalida} onChange={e => setHorarioSalida(e.target.value)}>
                <option value="">Seleccioná...</option>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {tipo && (
            <div className="form-grupo">
              <label className="form-label">
                {requiereRecorrido ? 'Detalles adicionales' : 'Descripción *'}
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={placeholder}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                maxLength={400}
              />
              {tipo === 'otro' && (
                <p className="form-hint">
                  Incluí empresa, horario, recorrido y motivo si los sabés. Cuanto más detalle, más útil para todos.
                </p>
              )}
              {esOtro && (
                <p className="form-hint form-hint--warning">
                  Los avisos de tipo "Otro" serán revisados antes de publicarse.
                </p>
              )}
            </div>
          )}

          {permiteImagen && (
            <div className="form-grupo">
              <label className="form-label">Imagen (opcional)</label>
              <label className="form-imagen-label">
                {imagenPreview
                  ? <img src={imagenPreview} alt="Preview" className="form-imagen-preview" />
                  : <span className="form-imagen-placeholder">📎 Tocá para adjuntar una foto</span>
                }
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImagen}
                  style={{ display: 'none' }}
                />
              </label>
              {imagenPreview && (
                <button className="form-imagen-quitar" onClick={() => { setImagen(null); setImagenPreview(null) }}>
                  Quitar imagen
                </button>
              )}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="avisos-footer">
            <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
            <button className="btn-nuevo-aviso" onClick={handleEnviar} disabled={enviando || !tipo}>
              {enviando ? 'Enviando...' : 'Publicar aviso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
