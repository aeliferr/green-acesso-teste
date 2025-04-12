CREATE DATABASE greenacessodb;

CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100),
  ativo BOOLEAN,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO lotes (nome, ativo, criado_em) VALUES ('0017', true, NOW()), ('0018', true, NOW()), ('0019', true, NOW());

CREATE TABLE IF NOT EXISTS boletos (
  id SERIAL PRIMARY KEY,
  nome_sacado VARCHAR(255),
  id_lote INT NOT NULL REFERENCES lotes(id),
  valor DECIMAL,
  linha_digitavel VARCHAR(255),
  ativo BOOLEAN,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mapeamento_ordem_boletos (
  numero_pagina INTEGER UNIQUE,
  id_boleto INT NOT NULL REFERENCES boletos(id)
)

-- executar essa query após fazer upload do arquivo csv
INSERT INTO mapeamento_ordem_boletos (numero_pagina, id_boleto) VALUES (1, 3), (2, 1), (3, 2);