import { useState } from 'react';
import axios from 'axios';

export default function RequestPage({ user }) {
  const [request, setRequest] = useState({ item_name: '', quantity: 1 });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/requests', {
        ...request,
        requester_name: user.username // Automatically uses the logged-in user's name
      });
      setMsg("Request sent successfully!");
    } catch (err) {
      setMsg("Error sending request.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>Request an Item</h3>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Item Name" 
          onChange={(e) => setRequest({...request, item_name: e.target.value})} 
          required 
        />
        <input 
          type="number" 
          placeholder="Quantity" 
          onChange={(e) => setRequest({...request, quantity: e.target.value})} 
          required 
        />
        <button type="submit">Submit Request</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}