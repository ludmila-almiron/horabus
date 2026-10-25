// Filtros.jsx
// Slider de rango de horario + checkboxes de empresa + botón limpiar.
// El estado vive en App.jsx y llega por props.

// Convierte minutos (0-1440) a string "HH:MM"
function minutosAHora(min) {
  const h = Math.floor(min / 60).toString().padStart(2, '0')
  const m = (min % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export default function Filtros({ rangoHora, setRangoHora, empresasDisponibles, empresasSeleccionadas, toggleEmpresa, hayFiltrosActivos, limpiarFiltros }) {
  return (
    <div className="filtros">
      {/* Slider de rango de horario */}
      <div className="filtros-grupo filtros-grupo--hora">
        <label className="filtros-label">
          Horario de salida: {minutosAHora(rangoHora[0])} – {minutosAHora(rangoHora[1] === 1440 ? 1439 : rangoHora[1])}
        </label>
        <div className="slider-rango">
          <div
            className="slider-track-fill"
            style={{
              left: `${(rangoHora[0] / 1440) * 100}%`,
              right: `${100 - (rangoHora[1] / 1440) * 100}%`
            }}
          />
          <input
            type="range"
            min={0} max={1440} step={15}
            value={rangoHora[0]}
            onChange={e => {
              const val = parseInt(e.target.value)
              if (val < rangoHora[1]) setRangoHora([val, rangoHora[1]])
            }}
            className="slider-input slider-input--min"
          />
          <input
            type="range"
            min={0} max={1440} step={15}
            value={rangoHora[1]}
            onChange={e => {
              const val = parseInt(e.target.value)
              if (val > rangoHora[0]) setRangoHora([rangoHora[0], val])
            }}
            className="slider-input slider-input--max"
          />
        </div>
      </div>

      {/* Checkboxes de empresa */}
      <div className="filtros-grupo">
        <label className="filtros-label">Empresa</label>
        <div className="filtros-checkboxes">
          {empresasDisponibles.map(empresa => (
            <label key={empresa} className="filtro-checkbox">
              <input
                type="checkbox"
                checked={empresasSeleccionadas.includes(empresa)}
                onChange={() => toggleEmpresa(empresa)}
              />
              {empresa}
            </label>
          ))}
        </div>
      </div>

      {/* Botón limpiar (solo si hay filtros activos) */}
      {hayFiltrosActivos && (
        <button className="btn-limpiar" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
