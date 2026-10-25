// Buscador.jsx
// Muestra los dos selects (origen/destino), el botón intercambiar y el botón buscar.
// Todo el estado vive en App.jsx y llega por props.

export default function Buscador({ localidades, origen, destino, cargando, onOrigen, onDestino, onIntercambiar, onBuscar }) {
  return (
    <div className="buscador">
      <div className="campo">
        <label>Desde</label>
        <select value={origen} onChange={e => onOrigen(e.target.value)}>
          <option value="" disabled>Seleccioná origen</option>
          {localidades.map(l => (
            <option key={l.id} value={l.id} disabled={l.id === parseInt(destino)}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      <button className="btn-intercambiar" onClick={onIntercambiar} title="Intercambiar">
        ⇄
      </button>

      <div className="campo">
        <label>Hasta</label>
        <select value={destino} onChange={e => onDestino(e.target.value)}>
          <option value="" disabled>Seleccioná destino</option>
          {localidades.map(l => (
            <option key={l.id} value={l.id} disabled={l.id === parseInt(origen)}>
              {l.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn-buscar"
        onClick={onBuscar}
        disabled={!origen || !destino || cargando}
      >
        {cargando ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
  )
}
