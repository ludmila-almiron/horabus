import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { TIPOS, TIPO_LABEL, EMPRESAS } from './constants'
import { defaultCaducaAt, fechaLocalInput } from './utils'

export default function AdminAvisoForm({ aviso, esNuevo, onGuardar, onCancelar, llamarFuncion }) {
  const [editando, setEditando] = useState(() => ({
    ...aviso,
    caduca_at: aviso.caduca_at ? fechaLocalInput(aviso.caduca_at) : defaultCaducaAt(),
  }))
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [horarioSalida, setHorarioSalida] = useState('')
  const [origenes, setOrigenes] = useState([])
  const [destinos, setDestinos] = useState([])
  const [horarios, setHorarios] = useState([])

  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  const requiereRecorrido = esNuevo && (editando?.tipo === 'demorado' || editando?.tipo === 'cancelado')
  const permiteImagen = editando?.tipo === 'corte' || editando?.tipo === 'otro'

  // Cargar origenes cuando cambia empresa
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa) { setOrigenes([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase.from('empresas').select('id').eq('nombre', editando.empresa).single()
      if (!emp) return
      const { data: viajes } = await supabase.from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return
      const viajeIds = viajes.map(v => v.id)
      const { data: paradas } = await supabase.from('paradas')
        .select('viaje_id, localidad_id, hora, localidades(nombre)')
        .in('viaje_id', viajeIds).order('hora', { ascending: true })
      if (!paradas) return
      const ultimasPorViaje = {}
      paradas.forEach(p => { ultimasPorViaje[p.viaje_id] = p })
      const unicos = {}
      paradas.forEach(p => {
        if (ultimasPorViaje[p.viaje_id]?.localidad_id === p.localidad_id) return
        unicos[p.localidad_id] = p.localidades.nombre
      })
      const lista = Object.entries(unicos)
        .map(([id, nombre]) => ({ id: parseInt(id), nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      setOrigenes(lista)
      setOrigen(''); setDestinos([]); setDestino(''); setHorarios([]); setHorarioSalida('')
    }
    cargar()
  }, [editando?.empresa, requiereRecorrido])

  // Cargar destinos cuando cambia origen
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa || !origen) { setDestinos([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase.from('empresas').select('id').eq('nombre', editando.empresa).single()
      if (!emp) return
      const { data: viajes } = await supabase.from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return
      const viajeIds = viajes.map(v => v.id)
      const { data: paradas } = await supabase.from('paradas')
        .select('viaje_id, localidad_id, hora, localidades(nombre)')
        .in('viaje_id', viajeIds).order('hora', { ascending: true })
      if (!paradas) return
      const paradasOrigen = paradas.filter(p => p.localidad_id === parseInt(origen))
      const viajesConOrigen = new Set(paradasOrigen.map(p => p.viaje_id))
      const horaOrigen = {}
      paradasOrigen.forEach(p => { horaOrigen[p.viaje_id] = p.hora })
      const unicos = {}
      paradas.forEach(p => {
        if (!viajesConOrigen.has(p.viaje_id)) return
        if (p.localidad_id === parseInt(origen)) return
        if (p.hora <= horaOrigen[p.viaje_id]) return
        unicos[p.localidad_id] = p.localidades.nombre
      })
      const lista = Object.entries(unicos)
        .map(([id, nombre]) => ({ id: parseInt(id), nombre }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      setDestinos(lista)
      setDestino(''); setHorarios([]); setHorarioSalida('')
    }
    cargar()
  }, [origen, editando?.empresa, requiereRecorrido])

  // Cargar horarios cuando cambia destino
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa || !origen || !destino) { setHorarios([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase.from('empresas').select('id').eq('nombre', editando.empresa).single()
      if (!emp) return
      const { data: viajes } = await supabase.from('viajes').select('id').eq('empresa_id', emp.id)
      if (!viajes?.length) return
      const viajeIds = viajes.map(v => v.id)
      const { data: paradas } = await supabase.from('paradas')
        .select('viaje_id, localidad_id, hora')
        .in('viaje_id', viajeIds).order('hora', { ascending: true })
      if (!paradas) return
      const horaOrigen = {}
      const horaDestino = {}
      paradas.forEach(p => {
        if (p.localidad_id === parseInt(origen)) horaOrigen[p.viaje_id] = p.hora
        if (p.localidad_id === parseInt(destino)) horaDestino[p.viaje_id] = p.hora
      })
      const horariosValidos = []
      Object.keys(horaOrigen).forEach(vid => {
        if (horaDestino[vid] && horaDestino[vid] > horaOrigen[vid])
          horariosValidos.push(horaOrigen[vid].slice(0, 5))
      })
      horariosValidos.sort()
      setHorarios(horariosValidos)
      setHorarioSalida('')
    }
    cargar()
  }, [destino, origen, editando?.empresa, requiereRecorrido])

  const cambiarTipo = (nuevoTipo) => {
    setEditando(prev => ({ ...prev, tipo: nuevoTipo, empresa: '' }))
    setOrigen(''); setDestino(''); setHorarioSalida('')
    setOrigenes([]); setDestinos([]); setHorarios([])
  }

  const handleImagen = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagen(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  const guardar = async () => {
    if (!editando.tipo) { setErrorForm('Seleccioná un tipo.'); return }
    if (requiereRecorrido && !editando.empresa) { setErrorForm('Seleccioná la empresa.'); return }
    if (requiereRecorrido && (!origen || !destino || !horarioSalida)) {
      setErrorForm('Completá origen, destino y horario de salida.')
      return
    }
    if (!requiereRecorrido && !editando.descripcion?.trim()) {
      setErrorForm('La descripción es obligatoria.')
      return
    }

    setGuardando(true)
    setErrorForm('')

    let descripcionFinal = (editando.descripcion || '').trim()
    if (requiereRecorrido) {
      const nomOrigen = origenes.find(o => o.id === parseInt(origen))?.nombre || ''
      const nomDestino = destinos.find(d => d.id === parseInt(destino))?.nombre || ''
      const prefijo = `${editando.empresa} · ${horarioSalida} · ${nomOrigen} → ${nomDestino}`
      descripcionFinal = descripcionFinal ? `${prefijo}. ${descripcionFinal}` : prefijo
    }

    let imagen_url = editando.imagen_url || null
    if (permiteImagen && imagen) {
      const ext = imagen.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avisos-imagenes')
        .upload(fileName, imagen, { contentType: imagen.type })
      if (uploadErr) {
        setErrorForm('No se pudo subir la imagen. Intentá de nuevo.')
        setGuardando(false)
        return
      }
      const { data: urlData } = supabase.storage.from('avisos-imagenes').getPublicUrl(fileName)
      imagen_url = urlData.publicUrl
    }
    if (!permiteImagen) imagen_url = null

    const caduca_at = editando.caduca_at
      ? new Date(editando.caduca_at).toISOString()
      : new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

    const data = await llamarFuncion({
      accion: esNuevo ? 'crear' : 'editar',
      id: editando.id,
      campos: {
        tipo: editando.tipo,
        descripcion: descripcionFinal,
        empresa: editando.empresa || null,
        imagen_url,
        aprobado: esNuevo ? true : editando.aprobado,
        activo: editando.aprobado === false ? false : editando.activo,
        caduca_at,
      },
    })

    setGuardando(false)
    if (data.error) {
      setErrorForm('Error al guardar: ' + data.error)
    } else {
      onGuardar()
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1 className="admin-titulo">{esNuevo ? 'Nuevo aviso' : 'Editar aviso'}</h1>
      </div>

      <div className="nuevo-aviso-form">
        <div className="form-grupo">
          <label className="form-label">Tipo *</label>
          <select className="form-select" value={editando.tipo} onChange={e => cambiarTipo(e.target.value)}>
            {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
          </select>
        </div>

        {requiereRecorrido && (
          <div className="form-grupo">
            <label className="form-label">Empresa *</label>
            <select
              className="form-select"
              value={editando.empresa || ''}
              onChange={e => setEditando(prev => ({ ...prev, empresa: e.target.value }))}
            >
              <option value="">Seleccioná...</option>
              {EMPRESAS.map(e => <option key={e.nombre} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </div>
        )}

        {requiereRecorrido && editando.empresa && origenes.length > 0 && (
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
              <select
                className="form-select"
                value={destino}
                onChange={e => setDestino(e.target.value)}
                disabled={!origen}
              >
                <option value="">Seleccioná...</option>
                {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
          </div>
        )}

        {requiereRecorrido && destino && horarios.length > 0 && (
          <div className="form-grupo">
            <label className="form-label">Horario de salida *</label>
            <select
              className="form-select"
              value={horarioSalida}
              onChange={e => setHorarioSalida(e.target.value)}
            >
              <option value="">Seleccioná...</option>
              {horarios.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        )}

        <div className="form-grupo">
          <label className="form-label">Descripción *</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={editando.descripcion || ''}
            onChange={e => setEditando(prev => ({ ...prev, descripcion: e.target.value }))}
            maxLength={400}
          />
        </div>

        <div className="form-grupo">
          <label className="form-label">Caduca el (por defecto 12 h)</label>
          <input
            type="datetime-local"
            className="admin-input"
            value={editando.caduca_at || ''}
            onChange={e => setEditando(prev => ({ ...prev, caduca_at: e.target.value }))}
          />
        </div>

        {permiteImagen && (
          <div className="form-grupo">
            <label className="form-label">Imagen (opcional)</label>
            {!imagenPreview && editando.imagen_url && (
              <div>
                <img src={editando.imagen_url} alt="Imagen actual" className="form-imagen-preview" />
                <button
                  className="form-imagen-quitar"
                  onClick={() => setEditando(prev => ({ ...prev, imagen_url: null }))}
                >
                  Quitar imagen
                </button>
              </div>
            )}
            {!editando.imagen_url && (
              <label className="form-imagen-label">
                {imagenPreview
                  ? <img src={imagenPreview} alt="Preview" className="form-imagen-preview" />
                  : <span className="form-imagen-placeholder">📎 Tocá para adjuntar una foto</span>}
                <input type="file" accept="image/*" onChange={handleImagen} style={{ display: 'none' }} />
              </label>
            )}
            {imagenPreview && (
              <button
                className="form-imagen-quitar"
                onClick={() => { setImagen(null); setImagenPreview(null) }}
              >
                Quitar imagen
              </button>
            )}
          </div>
        )}

        <div className="admin-checks">
          {!esNuevo && (
            <label className="filtro-checkbox">
              <input
                type="checkbox"
                checked={editando.aprobado}
                onChange={e => setEditando(prev => ({ ...prev, aprobado: e.target.checked }))}
              />
              Aprobado
            </label>
          )}
          {editando.aprobado !== false && (
            <label className="filtro-checkbox">
              <input
                type="checkbox"
                checked={editando.activo}
                onChange={e => setEditando(prev => ({ ...prev, activo: e.target.checked }))}
              />
              Activo
            </label>
          )}
        </div>

        {errorForm && <p className="form-error">{errorForm}</p>}

        <div className="avisos-footer">
          <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button className="btn-nuevo-aviso" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
