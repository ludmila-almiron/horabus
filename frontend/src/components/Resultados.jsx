// Resultados.jsx
// Muestra el título con origen→destino, las tarjetas de horarios y el aviso.

// Formatea "HH:MM:SS" → "HH:MM"
function formatHora(hora) {
  return hora?.slice(0, 5) || ''
}

export default function Resultados({ origen, destino, resultadosFiltrados, hayFiltrosActivos }) {
  return (
    <div className="resultados">
      <h2 className="resultados-titulo">
        {origen} → {destino}
        <span className="resultados-cantidad">
          {resultadosFiltrados.length === 0
            ? 'Sin resultados'
            : `${resultadosFiltrados.length} servicio${resultadosFiltrados.length !== 1 ? 's' : ''}`}
        </span>
      </h2>

      {resultadosFiltrados.length === 0 ? (
        <div className="sin-resultados">
          {hayFiltrosActivos
            ? 'Ningún servicio coincide con los filtros aplicados.'
            : 'No encontramos servicios para ese recorrido. Probá cambiando el origen o destino.'}
        </div>
      ) : (
        <div className="tarjetas">
          {resultadosFiltrados.map((r, i) => (
            <div key={i} className="tarjeta">
              <div className="tarjeta-horas">
                <div className="hora-bloque">
                  <span className="hora">{formatHora(r.salida)}</span>
                  <span className="hora-label">salida</span>
                </div>
                <div className="flecha">→</div>
                <div className="hora-bloque">
                  <span className="hora">{formatHora(r.llegada)}</span>
                  <span className="hora-label">{r.punto_parada || 'terminal'}</span>
                </div>
              </div>
              <div className="tarjeta-empresa">{r.empresa}</div>
            </div>
          ))}
        </div>
      )}

      <p className="aviso">
        * Los horarios son orientativos. Verificá con la empresa antes de viajar.
      </p>
    </div>
  )
}
