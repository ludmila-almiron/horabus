import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import logo from './pictures/horabuslogo.png'
import './App.css'

export default function App() {
  const [localidades, setLocalidades] = useState([])
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [resultados, setResultados] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    supabase
      .from('localidades')
      .select('*')
      .order('id')
      .then(({ data }) => setLocalidades(data || []))
  }, [])

  const intercambiar = () => {
    setOrigen(destino)
    setDestino(origen)
    setResultados(null)
    setBuscado(false)
  }

  const buscar = async () => {
    if (!origen || !destino) return
    setCargando(true)
    setBuscado(true)
    setResultados(null)

    const { data: paradasOrigen } = await supabase
      .from('paradas')
      .select('viaje_id, hora')
      .eq('localidad_id', origen)

    const { data: paradasDestino } = await supabase
      .from('paradas')
      .select('viaje_id, hora, punto_parada')
      .eq('localidad_id', destino)

    if (!paradasOrigen || !paradasDestino) {
      setResultados([])
      setCargando(false)
      return
    }

    const viajesValidos = paradasOrigen
      .map(po => {
        const pd = paradasDestino.find(
          p => p.viaje_id === po.viaje_id && p.hora > po.hora
        )
        if (pd) return { viaje_id: po.viaje_id, salida: po.hora, llegada: pd.hora, punto_parada: pd.punto_parada }
        return null
      })
      .filter(Boolean)

    if (viajesValidos.length === 0) {
      setResultados([])
      setCargando(false)
      return
    }

    const viajeIds = viajesValidos.map(v => v.viaje_id)
    const { data: viajes } = await supabase
      .from('viajes')
      .select('id, empresa_id, empresas(nombre)')
      .in('id', viajeIds)

    const resultadosFinal = viajesValidos.map(v => {
      const viaje = viajes?.find(vj => vj.id === v.viaje_id)
      return {
        ...v,
        empresa: viaje?.empresas?.nombre || 'Desconocida'
      }
    }).sort((a, b) => a.salida.localeCompare(b.salida))

    setResultados(resultadosFinal)
    setCargando(false)
  }

  const nombreLocalidad = (id) =>
    localidades.find(l => l.id === parseInt(id))?.nombre || ''

  const formatHora = (hora) => hora?.slice(0, 5) || ''

  return (
    <div className="page">
      <header className="header">
        <img src={logo} alt="HoraBus" className="logo" />
        <p className="tagline">Horarios de colectivos · Misiones, Argentina</p>
      </header>

      <main className="main">
        <div className="buscador">
          <div className="campo">
            <label>Desde</label>
            <select value={origen} onChange={e => { setOrigen(e.target.value); setResultados(null); setBuscado(false) }}>
              <option value="" disabled>Seleccioná origen</option>
              {localidades.map(l => (
                <option key={l.id} value={l.id} disabled={l.id === parseInt(destino)}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <button className="btn-intercambiar" onClick={intercambiar} title="Intercambiar">⇄</button>

          <div className="campo">
            <label>Hasta</label>
            <select value={destino} onChange={e => { setDestino(e.target.value); setResultados(null); setBuscado(false) }}>
              <option value="" disabled>Seleccioná destino</option>
              {localidades.map(l => (
                <option key={l.id} value={l.id} disabled={l.id === parseInt(origen)}>{l.nombre}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-buscar"
            onClick={buscar}
            disabled={!origen || !destino || cargando}
          >
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {buscado && !cargando && (
          <div className="resultados">
            <h2 className="resultados-titulo">
              {nombreLocalidad(origen)} → {nombreLocalidad(destino)}
              <span className="resultados-cantidad">
                {resultados?.length === 0
                  ? 'Sin resultados'
                  : `${resultados?.length} servicio${resultados?.length !== 1 ? 's' : ''}`}
              </span>
            </h2>

            {resultados?.length === 0 ? (
              <div className="sin-resultados">
                No encontramos servicios para ese recorrido. Probá cambiando el origen o destino.
              </div>
            ) : (
              <div className="tarjetas">
                {resultados?.map((r, i) => (
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
        )}

        {!buscado && (
          <p className="instruccion">Seleccioná origen y destino para ver los horarios disponibles.</p>
        )}
      </main>

      <footer className="footer">
        HoraBus · Misiones · Los horarios pueden variar según el día y la empresa.
      </footer>
    </div>
  )
}