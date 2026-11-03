import AvisoCard from './AvisoCard'

export default function AdminHistorial({ historial, onRestaurar, onEditar, onVolver }) {
  return (
    <section className="admin-seccion">
      <h2 className="admin-subtitulo">Historial — últimos 7 días ({historial.length})</h2>
      {historial.length === 0
        ? <p className="avisos-estado">No hay avisos caducados en los últimos 7 días.</p>
        : historial.map(a => (
          <AvisoCard
            key={a.id}
            aviso={a}
            modoHistorial
            onRestaurar={() => onRestaurar(a.id)}
            onEditar={() => onEditar(a)}
          />
        ))
      }
    </section>
  )
}
