import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabase'
import logo from './pictures/horabuslogo.png'
import Buscador from './components/Buscador'
import Filtros from './components/Filtros'
import Resultados from './components/Resultados'
import './App.css'

export default function App() {
  // ── Estado general ──────────────────────────────────────
  const [localidades, setLocalidades] = useState([])
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [resultados, setResultados] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [buscado, setBuscado] = useState(false)

  // ── Estado de filtros ───────────────────────────────────
  const [rangoHora, setRangoHora] = useState([0, 1440]) // minutos desde medianoche
  const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState([])

  // ── Carga inicial de localidades ────────────────────────
  useEffect(() => {
    supabase
      .from('localidades')
      .select('*')
      .order('id')
      .then(({ data }) => setLocalidades(data || []))
  }, [])

  // ── Helpers de conversión de hora ───────────────────────
  const horaAMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
  }

  // ── Acciones del buscador ───────────────────────────────
  const resetFiltros = () => {
    setRangoHora([0, 1440])
    setEmpresasSeleccionadas([])
  }

  const handleOrigen = (val) => {
    setOrigen(val)
    setResultados(null)
    setBuscado(false)
  }

  const handleDestino = (val) => {
    setDestino(val)
    setResultados(null)
    setBuscado(false)
  }

  const intercambiar = () => {
    setOrigen(destino)
    setDestino(origen)
    setResultados(null)
    setBuscado(false)
    resetFiltros()
  }

  const buscar = async () => {
    if (!origen || !destino) return
    setCargando(true)
    setBuscado(true)
    setResultados(null)
    resetFiltros()

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

  // ── Lógica de filtros ───────────────────────────────────
  const empresasDisponibles = useMemo(() => {
    if (!resultados) return []
    return [...new Set(resultados.map(r => r.empresa))].sort()
  }, [resultados])

  const toggleEmpresa = (empresa) => {
    setEmpresasSeleccionadas(prev =>
      prev.includes(empresa)
        ? prev.filter(e => e !== empresa)
        : [...prev, empresa]
    )
  }

  const resultadosFiltrados = useMemo(() => {
    if (!resultados) return []
    return resultados.filter(r => {
      const minSalida = horaAMinutos(r.salida)
      if (minSalida < rangoHora[0] || minSalida > rangoHora[1]) return false
      if (empresasSeleccionadas.length > 0 && !empresasSeleccionadas.includes(r.empresa)) return false
      return true
    })
  }, [resultados, rangoHora, empresasSeleccionadas])

  const hayFiltrosActivos = rangoHora[0] > 0 || rangoHora[1] < 1440 || empresasSeleccionadas.length > 0

  const limpiarFiltros = () => resetFiltros()

  // ── Helpers de presentación ─────────────────────────────
  const nombreLocalidad = (id) =>
    localidades.find(l => l.id === parseInt(id))?.nombre || ''

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="page">
      <header className="header">
        <img src={logo} alt="HoraBus" className="logo" />
        <p className="tagline">Horarios de colectivos · Misiones, Argentina</p>
      </header>

      <main className="main">
        <Buscador
          localidades={localidades}
          origen={origen}
          destino={destino}
          cargando={cargando}
          onOrigen={handleOrigen}
          onDestino={handleDestino}
          onIntercambiar={intercambiar}
          onBuscar={buscar}
        />

        {buscado && !cargando && resultados?.length > 0 && (
          <Filtros
            rangoHora={rangoHora}
            setRangoHora={setRangoHora}
            empresasDisponibles={empresasDisponibles}
            empresasSeleccionadas={empresasSeleccionadas}
            toggleEmpresa={toggleEmpresa}
            hayFiltrosActivos={hayFiltrosActivos}
            limpiarFiltros={limpiarFiltros}
          />
        )}

        {buscado && !cargando && (
          <Resultados
            origen={nombreLocalidad(origen)}
            destino={nombreLocalidad(destino)}
            resultadosFiltrados={resultadosFiltrados}
            hayFiltrosActivos={hayFiltrosActivos}
          />
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
