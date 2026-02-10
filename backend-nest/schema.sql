CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  imagen TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2),
  estado VARCHAR(50),
  nombre_comprador VARCHAR(255),
  telefono VARCHAR(50),
  client_id VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS pedido_detalle (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id),
  cantidad INT,
  precio_unitario DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password TEXT,
  cierre_campania DATE
);
