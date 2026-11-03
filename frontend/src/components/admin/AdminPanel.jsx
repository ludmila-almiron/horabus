import { useState, useEffect } from 'react'
import { FUNCTION_URL } from './constants'
import { defaultCaducaAt, fechaLocalInput, AVISO_VACIO } from './utils'
import AdminAvisos from './AdminAvisos'
import AdminAvisoForm from './AdminAvisoForm'
import AdminHistorial from './AdminHistorial'
import AdminHorarios from './AdminHorarios'
import logoAdmin from '../../pictures/horabus admin.png'

export default function AdminPanel() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('admin_pw') || '')
  const [autenticado, setAutenticado] = useState(() => !!sessionStorage.getItem('admin_pw'))
  const [errorLogin, setErrorLogin] = useState('')
  const [cargando, setCargando] = useState(false)

  const [avisos, setAvisos] = useState([])
  const [historial, setHistorial] = useState([])
  const [vista, setVista] = useState('avisos')

  const [editando, setEditando] = useState(null)
  const [esNuevo, setEsNuevo] = useState(false)

  useEffect(() => {
    if (!autenticado) return
    const pw = sessionStorage.getItem('admin_pw')
    if (!pw) return
    fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw, accion: 'listar' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          sessionStorage.removeItem('admin_pw')
          setAutenticado(false)
          setPassword('')
        } else {
          setAvisos(data.data || [])
        }
      })
      .catch(() => {
        sessionStorage.removeItem('admin_pw')
        setAutenticado(false)
        setPassword('')
      })
  }, [])

  const llamarFuncion = async (body) => {
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...body }),
      })
      return res.json()
    } catch (e) {
      return { error: e.message }
    }
  }

  const login = async () => {
    setCargando(true)
    setErrorLogin('')
    try {
      const data = await llamarFuncion({ accion: 'listar' })
      if (data.error) {
        setErrorLogin('Contraseña incorrecta.')
      } else {
        sessionStorage.setItem('admin_pw', password)
        setAvisos(data.data || [])
        setAutenticado(true)
      }
    } catch (e) {
      setErrorLogin('Error de conexión. Intentá de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const refrescar = async () => {
    const data = await llamarFuncion({ accion: 'listar' })
    setAvisos(data.data || [])
  }

  const cargarHistorial = async () => {
    const data = await llamarFuncion({ accion: 'historial' })
    setHistorial(data.data || [])
    setVista('historial')
  }

  const cerrarSesion = () => {
    sessionStorage.removeItem('admin_pw')
    setAutenticado(false)
    setPassword('')
  }

  const abrirNuevo = () => {
    setEditando({ ...AVISO_VACIO, caduca_at: defaultCaducaAt() })
    setEsNuevo(true)
  }

  const abrirEdicion = (aviso) => {
    setEditando({
      ...aviso,
      caduca_at: aviso.caduca_at ? fechaLocalInput(aviso.caduca_at) : defaultCaducaAt(),
    })
    setEsNuevo(false)
  }

  const cerrarForm = () => setEditando(null)

  const alGuardar = async () => {
    cerrarForm()
    await refrescar()
  }

  const aprobar = async (id) => {
    await llamarFuncion({ accion: 'aprobar', id })
    await refrescar()
  }

  const rechazar = async (id) => {
    await llamarFuncion({ accion: 'rechazar', id })
    await refrescar()
  }

  const eliminar = async (id) => {
    await llamarFuncion({ accion: 'eliminar', id })
    await refrescar()
  }

  const restaurar = async (id) => {
    await llamarFuncion({ accion: 'restaurar', id })
    await refrescar()
    setVista('avisos')
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <img src={logoAdmin} alt="Horabus Admin" className="admin-logo" />
          <div className="form-grupo">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !cargando && login()}
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

  // ── Formulario ─────────────────────────────────────────────────────────────
  if (editando) {
    return (
      <AdminAvisoForm
        aviso={editando}
        esNuevo={esNuevo}
        onGuardar={alGuardar}
        onCancelar={cerrarForm}
        llamarFuncion={llamarFuncion}
      />
    )
  }

  // ── Panel principal ────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <header className="admin-header">
        <img src={logoAdmin} alt="Horabus Admin" className="admin-logo" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-aprobar" onClick={abrirNuevo}>+ Nuevo aviso</button>
          <button
            className={`btn-cancelar${vista === 'avisos' ? ' btn-activo' : ''}`}
            onClick={() => setVista('avisos')}
          >
            📋 Avisos
          </button>
          <button
            className={`btn-cancelar${vista === 'historial' ? ' btn-activo' : ''}`}
            onClick={vista === 'historial' ? () => setVista('avisos') : cargarHistorial}
          >
            🗂 Historial
          </button>
          <button
            className={`btn-cancelar${vista === 'horarios' ? ' btn-activo' : ''}`}
            onClick={() => setVista(v => v === 'horarios' ? 'avisos' : 'horarios')}
          >
            🕐 Horarios
          </button>
          <button className="btn-cancelar" onClick={cerrarSesion}>Salir</button>
        </div>
      </header>

      <div className="admin-panel">
        {vista === 'avisos' && (
          <AdminAvisos
            avisos={avisos}
            onAprobar={aprobar}
            onRechazar={rechazar}
            onEliminar={eliminar}
            onEditar={abrirEdicion}
          />
        )}

        {vista === 'historial' && (
          <AdminHistorial
            historial={historial}
            onRestaurar={restaurar}
            onEditar={abrirEdicion}
            onVolver={() => setVista('avisos')}
          />
        )}

        {vista === 'horarios' && (
          <AdminHorarios llamarFuncion={llamarFuncion} />
        )}
      </div>

      <footer className="admin-footer">
        Horabus Admin · Misiones
      </footer>
    </div>
  )
}
