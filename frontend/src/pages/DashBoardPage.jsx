import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import '../styles/Dashboard.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import NetworkPage from './NetworkPage'; 

export default function DashboardPage({ user, setUser }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const isOwner = user?.role === 'admin';

  const fetchItems = async () => {
    try {
      const res = await API.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemImage(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', newItemName);
      formData.append('quantity', newItemQuantity);
      if (itemImage) {
        formData.append('itemImage', itemImage);
      }

      await API.post('/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setNewItemName('');
      setNewItemQuantity('');
      setItemImage(null);
      setImagePreview(null);
      fetchItems();
      alert("Item added!");
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      try {
        await API.delete(`/items/${id}`);
        fetchItems();
        alert("Item removed successfully");
      } catch (err) {
        alert("Error deleting item: " + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', path: '/dashboard', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )},
    { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )},
    { id: 'alerts', label: 'Alerts', path: '/dashboard/alerts', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )},
    { id: 'network', label: 'Network', path: '/dashboard/network', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    )}
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
          <span>StockLogix</span>
        </div>
        
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1>{isOwner ? "Owner Dashboard" : "Staff Portal"}</h1>
          </div>
          <div className="header-right">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search..." />
            </div>
            <div className="user-info">
              <div className="avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
              <div className="user-details">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content">
          <Routes>
            {/* Overview Route */}
            <Route path="/" element={
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Total Items</span>
                      <span className="stat-value">{items.length}</span>
                    </div>
                  </div>
                  <div className="stat-card warning">
                    <div className="stat-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-label">Low Stock</span>
                      <span className="stat-value">{items.filter(i => i.quantity < 5).length}</span>
                    </div>
                  </div>
                </div>

                <div className="grid-2col">
                  {isOwner && (
                    <div className="card">
                      <div className="card-header">
                        <h3>Add New Stock</h3>
                      </div>
                      <form className="form" onSubmit={handleAddItem}>
                        <div className="form-field">
                          <label>Item Name</label>
                          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Enter item name" required />
                        </div>
                        <div className="form-field">
                          <label>Quantity</label>
                          <input type="number" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} placeholder="Enter quantity" required />
                        </div>
                        <div className="form-field">
                          <label>Item Photo (Optional)</label>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleImageChange}
                            className="file-input"
                          />
                          {imagePreview && (
                            <div className="image-preview">
                              <img src={imagePreview} alt="Preview" />
                              <button 
                                type="button" 
                                className="btn-remove"
                                onClick={() => { setItemImage(null); setImagePreview(null); }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                        <button type="submit" className="btn-primary">Add Item</button>
                      </form>
                    </div>
                  )}

                  <div className={`card ${!isOwner ? 'full-width' : ''}`}>
                    <div className="card-header">
                      <h3>Current Stock</h3>
                      <button className="btn-secondary" onClick={fetchItems}>Refresh</button>
                    </div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Photo</th><th>Item</th><th>Qty</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id}>
                              <td>
                                {item.item_image ? (
                                  <img src={`http://localhost:5000${item.item_image}`} alt={item.item_name} className="thumb" />
                                ) : (
                                  <div className="thumb-placeholder">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                    </svg>
                                  </div>
                                )}
                              </td>
                              <td className="item-name">{item.item_name || item.name}</td>
                              <td>{item.quantity}</td>
                              <td><span className={`badge ${item.quantity < 5 ? 'danger' : 'success'}`}>{item.quantity < 5 ? 'Low' : 'Good'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            } />

            {/* Inventory Route */}
            <Route path="inventory" element={
              <div className="card">
                <div className="card-header">
                  <h3>Inventory Management</h3>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Photo</th><th>Item</th><th>Qty</th><th>Status</th>{isOwner && <th>Action</th>}</tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id}>
                          <td>
                            {item.item_image ? (
                              <img src={`http://localhost:5000${item.item_image}`} alt={item.item_name} className="thumb" />
                            ) : (
                              <div className="thumb-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                                </svg>
                              </div>
                            )}
                          </td>
                          <td className="item-name">{item.item_name || item.name}</td>
                          <td>{item.quantity}</td>
                          <td><span className={`badge ${item.quantity < 5 ? 'danger' : 'success'}`}>{item.quantity < 5 ? 'Low' : 'Good'}</span></td>
                          {isOwner && (
                            <td>
                              <button onClick={() => handleDeleteItem(item.id)} className="btn-delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            } />

            {/* Alerts Route */}
            <Route path="alerts" element={
              <div className="card">
                <div className="card-header">
                  <h3>Stock Alerts</h3>
                </div>
                <div className="alerts-list">
                  {items.filter(i => i.quantity < 5).length === 0 ? (
                    <div className="empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <p>All stock levels are healthy</p>
                    </div>
                  ) : (
                    items.filter(i => i.quantity < 5).map(item => (
                      <div key={item.id} className="alert-item">
                        <div className="alert-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        </div>
                        <div className="alert-content">
                          <strong>{item.item_name}</strong>
                          <span>Only {item.quantity} units remaining</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            } />

            {/* Network Route */}
            <Route path="network" element={<NetworkPage />} />
            
          </Routes>
        </div>
      </main>
    </div>
  );
}