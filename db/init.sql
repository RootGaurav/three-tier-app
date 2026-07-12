CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO items (name, description) VALUES
  ('Sample Item 1', 'This is a demo item'),
  ('Sample Item 2', 'Another demo item');
