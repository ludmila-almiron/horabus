import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function ContactoModal({ onClose }) {
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase
      .from('empresas')
      .select('id, nombre, telefono, web, email')
      .not('nombre', 'is', null)
      .order('nombre')
      .then(({ data }) => {
        setEmpresas(data || [])
        setCargando(false)
      })
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-titulo">Contacto de empresas</h2>
          <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {cargando ? (
          <p style={{ padding: '16px', color: 'var(--texto-suave)' }}>Cargando...</p>
        ) : (
          <ul className="modal-lista">
            {empresas.map(e => (
              <li key={e.id} className="modal-empresa">
                <p className="modal-empresa-nombre">{e.nombre}</p>
                <div className="modal-contactos">
                  {e.telefono && (
                    <a href={`tel:${e.telefono.replace(/[\s\-\/]/g, '')}`} className="modal-contacto-item">
                      <span className="modal-icono">📞</span>
                      <span>{e.telefono}</span>
                    </a>
                  )}
                  {e.web && (
                    <a href={e.web} target="_blank" rel="noopener noreferrer" className="modal-contacto-item">
                      <span className="modal-icono">🌐</span>
                      <span>{e.web.replace('https://', '').replace(/\/$/, '')}</span>
                    </a>
                  )}
                  {e.email && (
                    <a href={`mailto:${e.email}`} className="modal-contacto-item">
                      <span className="modal-icono">✉️</span>
                      <span>{e.email}</span>
                    </a>
                  )}
                  {!e.telefono && !e.web && !e.email && (
                    <span style={{ color: 'var(--texto-suave)', fontSize: '0.85rem' }}>
                      Sin datos de contacto
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
