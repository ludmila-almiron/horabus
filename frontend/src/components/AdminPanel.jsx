// AdminPanel.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const FUNCTION_URL = `https://pposmcwbhofhwcpoiunp.supabase.co/functions/v1/admin-avisos`

const TIPO_LABEL = {
  demorado: '🕐 Demorado',
  cancelado: '❌ Cancelado',
  corte: '🚧 Corte de ruta',
  otro: '📢 Otro',
}

const TIPOS = ['demorado', 'cancelado', 'corte', 'otro']

const EMPRESAS = [
  { nombre: 'Crucero del Norte' },
  { nombre: 'Empresa Argentina' },
  { nombre: 'Horianski' },
  { nombre: 'Río Uruguay' },
  { nombre: 'El Cometa' },
  { nombre: 'Oro Verde' },
  { nombre: 'Kruse' },
]

// Devuelve el datetime local en formato "YYYY-MM-DDThh:mm" para usar en input datetime-local
function fechaLocalInput(date) {
  const d = new Date(date)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultCaducaAt() {
  return fechaLocalInput(new Date(Date.now() + 12 * 60 * 60 * 1000))
}

const AVISO_VACIO = { tipo: 'otro', descripcion: '', empresa: '', aprobado: true, activo: true, caduca_at: defaultCaducaAt() }

export default function AdminPanel() {
  const [password, setPassword] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [errorLogin, setErrorLogin] = useState('')
  const [avisos, setAvisos] = useState([])
  const [cargando, setCargando] = useState(false)

  // Formulario de edición/creación
  const [editando, setEditando] = useState(null)
  const [esNuevo, setEsNuevo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')

  // Selects encadenados (solo para demorado/cancelado)
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [horarioSalida, setHorarioSalida] = useState('')
  const [origenes, setOrigenes] = useState([])
  const [destinos, setDestinos] = useState([])
  const [horarios, setHorarios] = useState([])

  // Imagen
  const [imagen, setImagen] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  const requiereRecorrido = editando?.tipo === 'demorado' || editando?.tipo === 'cancelado'
  const permiteImagen = editando?.tipo === 'corte' || editando?.tipo === 'otro'

  // 1. Al cambiar empresa: cargar orígenes
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa) { setOrigenes([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', editando.empresa).single()
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

      const ultimasPorViaje = {}
      paradas.forEach(p => { ultimasPorViaje[p.viaje_id] = p })

      const unicos = {}
      paradas.forEach(p => {
        if (ultimasPorViaje[p.viaje_id]?.localidad_id === p.localidad_id) return
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
  }, [editando?.empresa, requiereRecorrido])

  // 2. Al cambiar origen: cargar destinos
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa || !origen) { setDestinos([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', editando.empresa).single()
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

      setDestinos(Object.entries(unicos).map(([id, nombre]) => ({ id: parseInt(id), nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)))
      setDestino('')
      setHorarios([])
      setHorarioSalida('')
    }
    cargar()
  }, [origen, editando?.empresa, requiereRecorrido])

  // 3. Al cambiar destino: cargar horarios
  useEffect(() => {
    if (!requiereRecorrido || !editando?.empresa || !origen || !destino) { setHorarios([]); return }
    const cargar = async () => {
      const { data: emp } = await supabase
        .from('empresas').select('id').eq('nombre', editando.empresa).single()
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
  }, [destino, origen, editando?.empresa, requiereRecorrido])

  const llamarFuncion = async (body) => {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, ...body }),
    })
    return res.json()
  }

  const login = async () => {
    setCargando(true)
    setErrorLogin('')
    const data = await llamarFuncion({ accion: 'listar' })
    setCargando(false)
    if (data.error) {
      setErrorLogin('Contraseña incorrecta.')
    } else {
      setAvisos(data.data || [])
      setAutenticado(true)
    }
  }

  const refrescar = async () => {
    const data = await llamarFuncion({ accion: 'listar' })
    setAvisos(data.data || [])
  }

  const accion = async (tipo, id) => {
    await llamarFuncion({ accion: tipo, id })
    await refrescar()
  }

  const resetFormExtra = () => {
    setOrigen('')
    setDestino('')
    setHorarioSalida('')
    setOrigenes([])
    setDestinos([])
    setHorarios([])
    setImagen(null)
    setImagenPreview(null)
  }

  const abrirEdicion = (aviso) => {
    setEditando({
      ...aviso,
      caduca_at: aviso.caduca_at ? fechaLocalInput(aviso.caduca_at) : defaultCaducaAt(),
    })
    setEsNuevo(false)
    setErrorForm('')
    resetFormExtra()
  }

  const abrirNuevo = () => {
    setEditando({ ...AVISO_VACIO, caduca_at: defaultCaducaAt() })
    setEsNuevo(true)
    setErrorForm('')
    resetFormExtra()
  }

  const cerrarForm = () => {
    setEditando(null)
    setErrorForm('')
    resetFormExtra()
  }

  const cambiarTipo = (nuevoTipo) => {
    setEditando(prev => ({ ...prev, tipo: nuevoTipo, empresa: '' }))
    resetFormExtra()
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
      setErrorForm('Completá origen, destino y horario de salida.'); return
    }
    if (!requiereRecorrido && !editando.descripcion?.trim()) {
      setErrorForm('La descripción es obligatoria.'); return
    }

    setGuardando(true)
    setErrorForm('')

    // Construir descripción si es recorrido
    let descripcionFinal = (editando.descripcion || '').trim()
    if (requiereRecorrido) {
      const nomOrigen = origenes.find(o => o.id === parseInt(origen))?.nombre || ''
      const nomDestino = destinos.find(d => d.id === parseInt(destino))?.nombre || ''
      const prefijo = `${editando.empresa} · ${horarioSalida} · ${nomOrigen} → ${nomDestino}`
      descripcionFinal = descripcionFinal ? `${prefijo}. ${descripcionFinal}` : prefijo
    }

    // Subir imagen si hay una
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
    // Si se quitó la imagen
    if (!permiteImagen) imagen_url = null

    // Convertir caduca_at del input local a ISO string UTC
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
        activo: editando.activo,
        caduca_at,
      },
    })
    setGuardando(false)
    if (data.error) {
      setErrorForm('Error al guardar: ' + data.error)
    } else {
      cerrarForm()
      await refrescar()
    }
  }

  const pendientes = avisos.filter(a => !a.aprobado)
  const activos = avisos.filter(a => a.aprobado && a.activo)

  // ── Login ──────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h1 className="admin-titulo">HoraBus Admin</h1>
          <div className="form-grupo">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              autoFocus
            />
          </div>
          {errorLogin && <p className="form-error">{errorLogin}</p>}
          <button className="btn-nuevo-aviso" onClick={login} disabled={cargando}>
            {cargando ? 'Verificando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario edición/creación ────────────────────────────
  if (editando) {
    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h1 className="admin-titulo">{esNuevo ? 'Nuevo aviso' : 'Editar aviso'}</h1>
          <button className="btn-cancelar" onClick={cerrarForm}>Cancelar</button>
        </div>

        <div className="nuevo-aviso-form">
          {/* Tipo */}
          <div className="form-grupo">
            <label className="form-label">Tipo *</label>
            <select className="form-select" value={editando.tipo} onChange={e => cambiarTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </div>

          {/* Empresa (solo para demorado/cancelado) */}
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

          {/* Origen y destino */}
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
                <select className="form-select" value={destino} onChange={e => setDestino(e.target.value)} disabled={!origen}>
                  <option value="">Seleccioná...</option>
                  {destinos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Horario */}
          {requiereRecorrido && destino && horarios.length > 0 && (
            <div className="form-grupo">
              <label className="form-label">Horario de salida *</label>
              <select className="form-select" value={horarioSalida} onChange={e => setHorarioSalida(e.target.value)}>
                <option value="">Seleccioná...</option>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {/* Descripción */}
          <div className="form-grupo">
            <label className="form-label">
              {requiereRecorrido ? 'Detalles adicionales' : 'Descripción *'}
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              value={editando.descripcion || ''}
              onChange={e => setEditando(prev => ({ ...prev, descripcion: e.target.value }))}
              maxLength={400}
            />
          </div>

          {/* Fecha de caducidad */}
          <div className="form-grupo">
            <label className="form-label">Caduca el (opcional, por defecto 12 h)</label>
            <input
              type="datetime-local"
              className="admin-input"
              value={editando.caduca_at || ''}
              onChange={e => setEditando(prev => ({ ...prev, caduca_at: e.target.value }))}
            />
          </div>

          {/* Imagen (solo para corte/otro) */}
          {permiteImagen && (
            <div className="form-grupo">
              <label className="form-label">Imagen (opcional)</label>
              {/* Preview de imagen existente (al editar) */}
              {!imagenPreview && editando.imagen_url && (
                <div>
                  <img src={editando.imagen_url} alt="Imagen actual" className="form-imagen-preview" />
                  <button className="form-imagen-quitar" onClick={() => setEditando(prev => ({ ...prev, imagen_url: null }))}>
                    Quitar imagen
                  </button>
                </div>
              )}
              {/* Upload nueva imagen */}
              {!editando.imagen_url && (
                <label className="form-imagen-label">
                  {imagenPreview
                    ? <img src={imagenPreview} alt="Preview" className="form-imagen-preview" />
                    : <span className="form-imagen-placeholder">📎 Tocá para adjuntar una foto</span>
                  }
                  <input type="file" accept="image/*" onChange={handleImagen} style={{ display: 'none' }} />
                </label>
              )}
              {imagenPreview && (
                <button className="form-imagen-quitar" onClick={() => { setImagen(null); setImagenPreview(null) }}>
                  Quitar imagen
                </button>
              )}
            </div>
          )}

          {/* Checkboxes */}
          <div className="admin-checks">
            {!esNuevo && (
              <label className="filtro-checkbox">
                <input type="checkbox" checked={editando.aprobado} onChange={e => setEditando(prev => ({ ...prev, aprobado: e.target.checked }))} />
                Aprobado
              </label>
            )}
            <label className="filtro-checkbox">
              <input type="checkbox" checked={editando.activo} onChange={e => setEditando(prev => ({ ...prev, activo: e.target.checked }))} />
              Activo
            </label>
          </div>

          {errorForm && <p className="form-error">{errorForm}</p>}

          <div className="avisos-footer">
            <button className="btn-cancelar" onClick={cerrarForm}>Cancelar</button>
            <button className="btn-nuevo-aviso" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Panel principal ────────────────────────────────────────
  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1 className="admin-titulo">HoraBus Admin</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-aprobar" onClick={abrirNuevo}>+ Nuevo aviso</button>
          <button className="btn-cancelar" onClick={() => { setAutenticado(false); setPassword('') }}>Salir</button>
        </div>
      </header>

      <section className="admin-seccion">
        <h2 className="admin-subtitulo">Pendientes de aprobación ({pendientes.length})</h2>
        {pendientes.length === 0
          ? <p className="avisos-estado">No hay avisos pendientes.</p>
          : pendientes.map(a => (
            <AvisoCard key={a.id} aviso={a} onAprobar={() => accion('aprobar', a.id)} onRechazar={() => accion('rechazar', a.id)} onEditar={() => abrirEdicion(a)} />
          ))
        }
      </section>

      <section className="admin-seccion">
        <h2 className="admin-subtitulo">Avisos activos ({activos.length})</h2>
        {activos.length === 0
          ? <p className="avisos-estado">No hay avisos activos.</p>
          : activos.map(a => (
            <AvisoCard key={a.id} aviso={a} onEliminar={() => accion('eliminar', a.id)} onEditar={() => abrirEdicion(a)} />
          ))
        }
      </section>
    </div>
  )
}

function AvisoCard({ aviso, onAprobar, onRechazar, onEliminar, onEditar }) {
  return (
    <div className="admin-aviso-item">
      <div className="admin-aviso-meta">
        <span className="aviso-tipo">{TIPO_LABEL[aviso.tipo]}</span>
        {aviso.empresa && <span className="aviso-empresa">{aviso.empresa}</span>}
        <span className="aviso-meta">{new Date(aviso.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
      </div>
      <p className="aviso-descripcion">{aviso.descripcion}</p>
      {aviso.imagen_url && <img src={aviso.imagen_url} alt="imagen" className="admin-aviso-imagen" />}
      <div className="admin-aviso-acciones">
        {onAprobar && <button className="btn-aprobar" onClick={onAprobar}>✓ Aprobar</button>}
        {onRechazar && <button className="btn-rechazar" onClick={onRechazar}>✕ Rechazar</button>}
        {onEliminar && <button className="btn-rechazar" onClick={onEliminar}>🗑 Eliminar</button>}
        <button className="btn-cancelar" onClick={onEditar}>✏️ Editar</button>
      </div>
    </div>
  )
}
