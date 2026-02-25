import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const addStock = async (item) => {
  try {
    const newQuantity = item.quantity + 1;
    await axios.put(`http://localhost:5000/api/inventory/${item.id}`, {
      quantity: newQuantity,
      price: item.price
    });
    fetchItems(); // Refresh the table
  } catch (err) {
    console.error("Update failed", err);
  }
};

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/inventory');
      setItems(response.data);
    } catch (err) {
      console.error("Error fetching items", err);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${id}`);
        fetchItems(); // This refreshes the list instantly
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Current Inventory</h2>
        <button onClick={fetchItems}>🔄 Refresh</button>
      </div>
      <table border="1" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#333', color: 'white' }}>
            <th>Name</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
       <tbody>
  {items.map((item) => (
    <tr key={item.id}>
      <td>{item.name}</td>
      <td>{item.quantity}</td>
      <td>${item.price}</td>
      <td>
        {/* --- ADD THESE BUTTONS HERE --- */}
        <button 
          onClick={() => addStock(item)} 
          style={{ marginRight: '10px', padding: '5px', cursor: 'pointer' }}
        >
          +1 Stock
        </button>
        
        <button 
          onClick={() => deleteItem(item.id)}
          style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px', cursor: 'pointer' }}
        >
          Delete
        </button>
        {/* ------------------------------ */}
      </td>
    </tr>
  ))}
</tbody>
      </table>
    </div>
  );
}