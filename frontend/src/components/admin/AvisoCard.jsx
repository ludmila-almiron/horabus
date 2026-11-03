import { TIPO_LABEL } from './constants'

export default function AvisoCard({
  aviso,
  onAprobar,
  onRechazar,
  onEliminar,
  onEditar,
  onRestaurar,
  modoHistorial,
}) {
  const estado = aviso.aprobado ? '✓ Aprobado' : '✕ Rechazado'

  return (
    <div className="admin-aviso-item">
      <div className="admin-aviso-meta">
        <span className="aviso-tipo">{TIPO_LABEL[aviso.tipo]}</span>
        {aviso.empresa && <span className="aviso-empresa">{aviso.empresa}</span>}
        <span className="aviso-meta">
          {new Date(aviso.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
        {modoHistorial && (
          <span
            className="aviso-meta"
            style={{ color: aviso.aprobado ? 'var(--color-verde)' : '#b91c1c' }}
          >
            {estado}
          </span>
        )}
      </div>

      <p className="aviso-descripcion">{aviso.descripcion}</p>

      {aviso.imagen_url && (
        <img src={aviso.imagen_url} alt="imagen" className="admin-aviso-imagen" />
      )}

      <div className="admin-aviso-acciones">
        {!modoHistorial && onAprobar && (
          <button className="btn-aprobar" onClick={onAprobar}>✓ Aprobar</button>
        )}
        {!modoHistorial && onRechazar && (
          <button className="btn-rechazar" onClick={onRechazar}>✕ Rechazar</button>
        )}
        {!modoHistorial && onEliminar && (
          <button className="btn-rechazar" onClick={onEliminar}>🗑 Eliminar</button>
        )}
        {modoHistorial && onRestaurar && (
          <button className="btn-aprobar" onClick={onRestaurar}>↩ Restaurar</button>
        )}
        {onEditar && (
          <button className="btn-cancelar" onClick={onEditar}>✏️ Editar</button>
        )}
      </div>
    </div>
  )
}
