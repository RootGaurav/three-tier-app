import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/api/items`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError('Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch(`${API}/api/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    setName('');
    setDescription('');
    fetchItems();
  };

  const deleteItem = async (id) => {
    await fetch(`${API}/api/items/${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
      <h1>Three-Tier App</h1>
      <p style={{ color: '#666', fontSize: 14 }}>React → Express → PostgreSQL</p>

      <form onSubmit={addItem} style={{ marginBottom: 24 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Item name"
          required
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description (optional)"
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8, boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <button type="submit" style={{ padding: '8px 20px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Add Item
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? <p>Loading...</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map(item => (
            <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 8, border: '1px solid #eee', borderRadius: 4 }}>
              <div>
                <strong>{item.name}</strong>
                {item.description && <p style={{ margin: 0, fontSize: 13, color: '#666' }}>{item.description}</p>}
              </div>
              <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', color: '#c00' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
