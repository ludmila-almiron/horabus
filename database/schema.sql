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


INSERT INTO paradas (viaje_id, localidad_id, hora) VALUES
-- Viaje 1 (00:00) Posadas → Puerto Iguazú
(1, 24, '00:00'),
(1, 25, '00:20'),
(1, 26, '00:30'),
(1, 27, '00:45'),
(1, 28, '01:00'),
(1, 29, '01:10'),
(1, 30, '01:20'),
(1, 31, '01:45'),
(1, 32, '01:55'),
(1, 33, '02:00'),
(1, 34, '02:10'),
(1, 35, '02:20'),
(1, 36, '02:45'),
(1, 37, '03:00'),
(1, 38, '03:20'),
(1, 39, '03:50'),
(1, 40, '04:00'),
(1, 41, '04:10'),
(1, 42, '04:20'),
(1, 43, '04:50'),
(1, 44, '05:00'),
(1, 45, '05:10'),
(1, 46, '05:50'),

-- Viaje 2 (05:30) Posadas → Puerto Iguazú
(2, 24, '05:30'),
(2, 25, '05:50'),
(2, 26, '06:00'),
(2, 27, '06:20'),
(2, 28, '06:35'),
(2, 29, '06:45'),
(2, 30, '06:55'),
(2, 31, '07:20'),
(2, 32, '07:30'),
(2, 33, '07:40'),
(2, 34, '08:10'),
(2, 35, '08:20'),
(2, 36, '08:45'),
(2, 37, '09:00'),
(2, 38, '09:20'),
(2, 39, '09:45'),
(2, 40, '09:55'),
(2, 41, '10:05'),
(2, 42, '10:15'),
(2, 43, '10:35'),
(2, 44, '10:50'),
(2, 45, '11:00'),
(2, 46, '11:40'),

-- Viaje 3 (13:30) Posadas → Wanda
(3, 24, '13:30'),
(3, 25, '13:40'),
(3, 26, '13:50'),
(3, 27, '14:15'),
(3, 28, '14:30'),
(3, 29, '14:40'),
(3, 30, '14:50'),
(3, 31, '15:00'),
(3, 32, '15:10'),
(3, 33, '15:15'),
(3, 34, '15:25'),
(3, 35, '15:30'),
(3, 36, '15:40'),
(3, 37, '15:50'),
(3, 38, '16:00'),
(3, 39, '16:10'),
(3, 40, '16:20'),
(3, 41, '16:30'),
(3, 42, '16:40'),
(3, 43, '17:00'),
(3, 44, '17:20');

ALTER TABLE paradas ADD COLUMN ingresa_terminal BOOLEAN DEFAULT true;