import { useState } from 'react';
import axios from 'axios';

export default function AddItem() {
  const [formData, setFormData] = useState({ name: '', quantity: 0, price: 0 });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // This is the bridge to your server.js!
      const response = await axios.post('http://localhost:5000/api/inventory', formData);
      setMessage(response.data.message);
    } catch (err) {
      // This shows the Zod error message on your screen
      setMessage("Error: " + (err.response?.data?.error || "Something went wrong"));
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2>Add New Inventory Item</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input 
          placeholder="Item Name" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        <input 
          type="number" placeholder="Quantity" 
          onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})} 
        />
        <input 
          type="number" placeholder="Price" 
          onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} 
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Save Item</button>
      </form>
      {message && <p className="mt-2 text-sm font-bold">{message}</p>}
    </div>
  );
}