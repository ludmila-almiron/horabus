import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { EMPRESAS } from './constants'

export default function AdminHorarios({ llamarFuncion }) {
  const [empresa, setEmpresa] = useState('')
  const [viajes, setViajes] = useState([])     // [{ id, label, paradas }]
  const [viajeId, setViajeId] = useState('')
  const [paradas, setParadas] = useState([])   // [{ id, hora, localidad }]
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Cargar viajes cuando se selecciona empresa
  useEffect(() => {
    if (!empresa) { setViajes([]); setViajeId(''); setParadas([]); return }
    const cargar = async () => {
      setCargando(true)
      setError('')
      setMensaje('')
      setViajeId('')
      setParadas([])

      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', empresa).single()
      if (!emp) { setError('Empresa no encontrada.'); setCargando(false); return }

      const { data: viajesData } = await supabase
        .from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajesData?.length) { setViajes([]); setCargando(false); return }

      const viajeIds = viajesData.map(v => v.id)

      // Traer todas las paradas de todos los viajes de esta empresa
      const { data: paradasData } = await supabase
        .from('paradas')
        .select('id, viaje_id, hora, localidad_id, localidades(nombre)')
        .in('viaje_id', viajeIds)
        .order('hora', { ascending: true })

      if (!paradasData) { setCargando(false); return }

      // Agrupar paradas por viaje y construir label
      const grupos = {}
      paradasData.forEach(p => {
        if (!grupos[p.viaje_id]) grupos[p.viaje_id] = []
        grupos[p.viaje_id].push(p)
      })

      const lista = Object.entries(grupos).map(([id, pars]) => {
        const primera = pars[0]
        const ultima = pars[pars.length - 1]
        const label = `${primera.localidades.nombre} → ${ultima.localidades.nombre} · ${primera.hora.slice(0, 5)}`
        return { id: parseInt(id), label, paradas: pars }
      })

      lista.sort((a, b) => {
        const horaA = a.paradas[0]?.hora || ''
        const horaB = b.paradas[0]?.hora || ''
        return horaA.localeCompare(horaB)
      })

      setViajes(lista)
      setCargando(false)
    }
    cargar()
  }, [empresa])

  // Cargar paradas del viaje seleccionado
  useEffect(() => {
    if (!viajeId) { setParadas([]); return }
    const viaje = viajes.find(v => v.id === parseInt(viajeId))
    if (viaje) {
      setParadas(viaje.paradas.map(p => ({
        id: p.id,
        hora: p.hora.slice(0, 5),   // HH:MM
        localidad: p.localidades.nombre,
      })))
    }
    setMensaje('')
    setError('')
  }, [viajeId, viajes])

  const cambiarHora = (paradaId, nuevaHora) => {
    setParadas(prev => prev.map(p => p.id === paradaId ? { ...p, hora: nuevaHora } : p))
  }

  const guardar = async () => {
    // Validar que todas las horas tengan formato HH:MM
    const invalidas = paradas.filter(p => !/^\d{2}:\d{2}$/.test(p.hora))
    if (invalidas.length) {
      setError('Algunas horas tienen formato incorrecto (debe ser HH:MM).')
      return
    }

    // Validar orden cronológico
    for (let i = 1; i < paradas.length; i++) {
      if (paradas[i].hora < paradas[i - 1].hora) {
        setError(`El horario de "${paradas[i].localidad}" (${paradas[i].hora}) debe ser mayor que el de "${paradas[i - 1].localidad}" (${paradas[i - 1].hora}).`)
        return
      }
    }

    setGuardando(true)
    setError('')
    setMensaje('')

    const data = await llamarFuncion({
      accion: 'guardar_horarios',
      paradas: paradas.map(p => ({ id: p.id, hora: p.hora })),
    })

    setGuardando(false)
    if (data.error) {
      setError('Error al guardar: ' + data.error)
    } else {
      setMensaje('✓ Horarios guardados correctamente.')
      // Actualizar viajes locales con los nuevos horarios
      setViajes(prev => prev.map(v => {
        if (v.id !== parseInt(viajeId)) return v
        const paradasActualizadas = v.paradas.map(p => {
          const editada = paradas.find(e => e.id === p.id)
          return editada ? { ...p, hora: editada.hora + ':00' } : p
        })
        const primera = paradasActualizadas[0]
        const ultima = paradasActualizadas[paradasActualizadas.length - 1]
        const label = `${primera.localidades.nombre} → ${ultima.localidades.nombre} · ${primera.hora.slice(0, 5)}`
        return { ...v, label, paradas: paradasActualizadas }
      }))
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-seccion">
        <h2 className="admin-subtitulo">Editar horarios</h2>

        {/* Selector de empresa */}
        <div className="form-grupo">
          <label className="form-label">Empresa</label>
          <select
            className="form-select"
            value={empresa}
            onChange={e => { setEmpresa(e.target.value) }}
          >
            <option value="">Seleccioná una empresa...</option>
            {EMPRESAS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
          </select>
        </div>

        {/* Selector de viaje */}
        {empresa && (
          <div className="form-grupo">
            <label className="form-label">Servicio</label>
            {cargando
              ? <p className="avisos-estado">Cargando servicios...</p>
              : viajes.length === 0
              ? <p className="avisos-estado">No hay servicios para esta empresa.</p>
              : (
                <select
                  className="form-select"
                  value={viajeId}
                  onChange={e => setViajeId(e.target.value)}
                >
                  <option value="">Seleccioná un servicio...</option>
                  {viajes.map(v => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              )
            }
          </div>
        )}

        {/* Tabla de paradas */}
        {paradas.length > 0 && (
          <>
            <div className="horarios-tabla">
              {paradas.map((p, i) => (
                <div key={p.id} className="horario-fila">
                  <span className="horario-num">{i + 1}</span>
                  <span className="horario-localidad">{p.localidad}</span>
                  <input
                    type="time"
                    className="horario-input"
                    value={p.hora}
                    onChange={e => cambiarHora(p.id, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {error && <p className="form-error" style={{ marginTop: 12 }}>{error}</p>}
            {mensaje && <p style={{ color: 'var(--color-verde)', marginTop: 12 }}>{mensaje}</p>}

            <div className="avisos-footer" style={{ marginTop: 16 }}>
              <button
                className="btn-nuevo-aviso"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
