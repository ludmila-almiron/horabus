// ContactoModal.jsx
// Modal con datos de contacto de todas las empresas.

const empresas = [
  {
    nombre: 'Crucero del Norte',
    telefono: '+54 9 11 6018-9000',
    web: 'https://www.crucerodelnorte.com.ar/',
    email: 'info@crucerodelnorte.com.ar',
  },
  {
    nombre: 'Empresa Argentina',
    telefono: '+54 9 3764 90-8730',
    email: 'martignonihnossrl@hotmail.com',
  },
  {
    nombre: 'Horianski',
    telefono: '+54 9 3764 15-7426 / 376-4596359',
    email: 'mhorianskisrl@arnet.com.ar',
  },
  {
    nombre: 'Río Uruguay',
    telefono: '+54 9 3764 29-2915',
    web: 'https://www.riouruguaybus.com.ar',
    email: 'info@riouruguaybus.com.ar',
  },
  {
    nombre: 'El Cometa',
    web: 'https://elcometabis.com/',
    email: 'atencionalcliente@elcometabis.com',
  },
  {
    nombre: 'Oro Verde',
    telefono: '3765 268723 / 3764 913673',
    email: 'oroverde.misiones@gmail.com',
  },
  {
    nombre: 'Kruse',
    telefono: '03751 48-0103',
    email: 'empresakrusesa@gmail.com',
  },
]

export default function ContactoModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-titulo">Contacto de empresas</h2>
          <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <ul className="modal-lista">
          {empresas.map(e => (
            <li key={e.nombre} className="modal-empresa">
              <p className="modal-empresa-nombre">{e.nombre}</p>
              <div className="modal-contactos">
                {e.telefono && (
                  <a href={`tel:${e.telefono.replace(/\s/g, '')}`} className="modal-contacto-item">
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
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
