import { useState } from 'react'

function Select () {

    const paradas =  [
        { value: "capiovi", label: "Capioví" },
        { value: "puerto_rico", label: "Puerto Rico" }
      ]

    const [origen, setOrigen] = useState(''); 
    const [destino, setDestino] = useState('');

const handleDestinoChange = (event) =>{
    console.log(event.target.value)
    setDestino(event.target.value)

}
const handleOrigenChange = (event) =>{
    console.log(event.target.value)
    setOrigen(event.target.value)
}

return (
    <div>
        <select className="selector" id="origen" value={origen} onChange={handleOrigenChange}>
        <option value="" disabled>ORIGEN</option>
        {paradas.map((parada) => (
          <option 
          key={parada.value} 
          value={parada.value}>
            {parada.label}
          </option>
        ))}
      </select>

      <select className="selector" id="destino" value={destino} onChange={handleDestinoChange}>
  <option value="" disabled>DESTINO</option>
  {paradas.map((parada) => (
    origen !== parada.value && (
      <option 
        key={parada.value} 
        value={parada.value}
      >
        {parada.label}
      </option>
    )
  ))}
</select>
    
    <button className="selector">BUSCAR</button>
</div>

)
}

export default Select;