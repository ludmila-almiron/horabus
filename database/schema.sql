CREATE TABLE localidades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE viajes (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  tipo_dia VARCHAR(20) NOT NULL DEFAULT 'todos'
);

CREATE TABLE paradas (
  id SERIAL PRIMARY KEY,
  viaje_id INTEGER REFERENCES viajes(id),
  localidad_id INTEGER REFERENCES localidades(id),
  hora TIME NOT NULL
);

INSERT INTO localidades (nombre) VALUES
('Posadas'),
('Garupá'),
('Candelaria'),
('Santa Ana'),
('San Ignacio'),
('Gobernador Roca'),
('Santo Pipó'),
('Jardín América'),
('Puerto Leoni'),
('Capioví'),
('Puerto Rico'),
('Garuhapé'),
('Caraguatay'),
('Montecarlo'),
('Puerto Piray'),
('Eldorado'),
('Colonia Victoria'),
('María Magdalena'),
('Puerto Delicia'),
('Puerto Esperanza'),
('Wanda'),
('Puerto Libertad'),
('Puerto Iguazú');

INSERT INTO empresas (nombre) VALUES
('Kruse'),
('Río Uruguay'),
('Empresa Argentina'),
('Crucero del Norte'),
('Horianski'),
('El Cometa'),
('Oro Verde'),
('Expreso A. Del Valle');