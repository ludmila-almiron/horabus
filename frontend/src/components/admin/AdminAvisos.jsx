import AvisoCard from './AvisoCard'

export default function AdminAvisos({ avisos, onAprobar, onRechazar, onEliminar, onEditar }) {
  const pendientes = avisos.filter(a => !a.aprobado)
  const publicados = avisos.filter(a => a.aprobado && a.activo)

  return (
    <>
      <section className="admin-seccion">
        <h2 className="admin-subtitulo">Pendientes de aprobación ({pendientes.length})</h2>
        {pendientes.length === 0
          ? <p className="avisos-estado">No hay avisos pendientes.</p>
          : pendientes.map(a => (
            <AvisoCard
              key={a.id}
              aviso={a}
              onAprobar={() => onAprobar(a.id)}
              onRechazar={() => onRechazar(a.id)}
              onEliminar={() => onEliminar(a.id)}
              onEditar={() => onEditar(a)}
            />
          ))
        }
      </section>

      <section className="admin-seccion">
        <h2 className="admin-subtitulo">Publicados ({publicados.length})</h2>
        {publicados.length === 0
          ? <p className="avisos-estado">No hay avisos publicados.</p>
          : publicados.map(a => (
            <AvisoCard
              key={a.id}
              aviso={a}
              onRechazar={() => onRechazar(a.id)}
              onEliminar={() => onEliminar(a.id)}
              onEditar={() => onEditar(a)}
            />
          ))
        }
      </section>
    </>
  )
}
