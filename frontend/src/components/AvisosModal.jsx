// AvisosModal.jsx
// Muestra los avisos activos y un botón para crear uno nuevo.

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import NuevoAvisoModal from './NuevoAvisoModal'

const TIPO_LABEL = {
  demorado: '🕐 Colectivo demorado',
  cancelado: '❌ Colectivo cancelado',
  corte: '🚧 Corte de ruta',
  otro: '📢 Aviso general',
}

function tiempoRestante(caduca_at) {
  if (!caduca_at) return null
  const diff = new Date(caduca_at) - new Date()
  if (diff <= 0) return 'vencido'
  const horas = Math.floor(diff / 3600000)
  const minutos = Math.floor((diff % 3600000) / 60000)
  if (horas > 0) return `vence en ${horas}h ${minutos}m`
  return `vence en ${minutos}m`
}

export default function AvisosModal({ onClose }) {
  const [avisos, setAvisos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)

  const cargarAvisos = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('avisos')
      .select('*')
      .order('created_at', { ascending: false })
    setAvisos(data || [])
    setCargando(false)
  }

  useEffect(() => {
    cargarAvisos()
  }, [])

  const handleNuevoCreado = () => {
    setMostrarNuevo(false)
    cargarAvisos()
  }

  if (mostrarNuevo) {
    return <NuevoAvisoModal onClose={() => setMostrarNuevo(false)} onCreado={handleNuevoCreado} />
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-titulo">Avisos</h2>
          <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {cargando ? (
          <p className="avisos-estado">Cargando avisos...</p>
        ) : avisos.length === 0 ? (
          <p className="avisos-estado">No hay avisos activos en este momento.</p>
        ) : (
          <ul className="modal-lista">
            {avisos.map(aviso => (
              <li key={aviso.id} className="aviso-item">
                <div className="aviso-tipo">{TIPO_LABEL[aviso.tipo] || aviso.tipo}</div>
                {aviso.empresa && <div className="aviso-empresa">{aviso.empresa}</div>}
                <p className="aviso-descripcion">{aviso.descripcion}</p>
                {aviso.imagen_url && (
                  <a href={aviso.imagen_url} target="_blank" rel="noopener noreferrer">
                    <img src={aviso.imagen_url} alt="Imagen del aviso" className="aviso-imagen" />
                  </a>
                )}
                <div className="aviso-meta">
                  {new Date(aviso.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                  {aviso.caduca_at && (
                    <span className="aviso-caduca"> · {tiempoRestante(aviso.caduca_at)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="avisos-footer">
          <p className="avisos-aclaracion">
            Los avisos son enviados por usuarios de la comunidad. Verificá siempre con la empresa.
          </p>
          <button className="btn-nuevo-aviso" onClick={() => setMostrarNuevo(true)}>
            + Reportar un aviso
          </button>
        </div>
      </div>
    </div>
  )
}
