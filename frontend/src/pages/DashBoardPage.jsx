import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';
import '../styles/Dashboard.css';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import NetworkPage from './NetworkPage';
import MarketplacePage from './MarketplacePage';
import RequestsManager from './RequestsManager';
import AdminDashboard from './AdminDashboard';
export default function DashboardPage({ user, setUser }) {
  const [items, setItems] = useState([]);
  const [adminStats, setAdminStats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname === '/dashboard' ? 'overview' : location.pathname.split('/').pop();

  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  const isOwner = !!user; // Everyone logged in is the owner of their own inventory.
  const isAdmin = user?.role === 'admin';

  // Stats calculation
  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.quantity < 5).length;
  const categoryCount = new Set(items.map(i => i.category_id).filter(Boolean)).size;
  const communitySupportScore = items[0]?.trade_count || 0; // Each item from this user has the same trade_count

  const fetchItems = async () => {
    try {
      const url = isAdmin ? '/admin/inventory/summary' : '/items';
      const res = await API.get(url);
      if (isAdmin) {
        setAdminStats(res.data);
      } else {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchRequests = async () => {
    if (isAdmin) return;
    try {
      const [incoming, outgoing] = await Promise.all([
        API.get('/requests/incoming'),
        API.get('/requests/outgoing')
      ]);
      setIncomingRequests(incoming.data);
      setOutgoingRequests(outgoing.data);
    } catch (err) {
      console.error("Fetch requests error:", err);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await API.get('/uploads');
      setGalleryImages(res.data);
      setIsGalleryOpen(true);
    } catch (err) {
      console.error("Gallery Fetch Error:", err);
      alert("Failed to load gallery");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchRequests();
  }, []);


  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await API.post('/items', {
        name: newItemName,
        quantity: newItemQuantity,
        category_id: newItemCategoryId,
        existingImagePath: selectedGalleryImage
      });

      setNewItemName('');
      setNewItemQuantity('');
      setNewItemCategoryId('');
      setSelectedGalleryImage(null);
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

  const handleEditItem = async (item) => {
    const newQty = prompt(`Update stock for ${item.item_name || item.name}:`, item.quantity);
    if (newQty !== null && !isNaN(newQty)) {
      try {
        await API.put(`/items/${item.id}`, { quantity: parseInt(newQty) });
        fetchItems();
      } catch (err) {
        alert("Failed to update stock");
      }
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await API.patch(`/requests/${requestId}/status`, { status: newStatus });
      fetchRequests();
      fetchItems();
      alert(`Request marked as ${newStatus}`);
    } catch (err) {
      alert("Failed to update request: " + (err.response?.data?.error || err.message));
    }
  };

  const renderCategorySection = (catName, filteredItems, isFullInventory = false) => {
    if (filteredItems.length === 0) return null;
    return (
      <div className="category-section" key={catName}>
        <h4 className="category-title">{catName}</h4>
        <div className="inventory-grid">
          {filteredItems.map(item => {
            const isOwner = user && parseInt(item.user_id) === user.id;
            return (
              <div className={`item-card ${item.is_verified ? 'verified' : ''}`} key={item.id}>
                <div className="card-image-wrapper">
                  {item.item_image ? (
                    <img
                      src={`http://localhost:5000${item.item_image}`}
                      alt={item.item_name}
                      className="card-image"
                    />
                  ) : (
                    <div className="card-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="card-content">
                  <div className="card-header-info">
                    <span className="card-title">{item.item_name || item.name}</span>
                    <span className={`badge ${item.quantity < 5 ? 'danger' : 'success'} card-status-badge`}>
                      {item.quantity < 5 ? 'Low' : 'Good'}
                    </span>
                    {item.is_verified && (
                      <div className="badge-verified" title="Verified Merchant">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="card-stat">
                      <span>Stock Level</span>
                      <b>{item.quantity} {item.unit || 'units'}</b>
                    </div>
                  </div>
                  <div className="card-actions">
                    <label className="market-toggle-wrapper">
                      <input
                        type="checkbox"
                        disabled={!isOwner}
                        checked={item.is_public}
                        onChange={async (e) => {
                          try {
                            await API.patch(`/items/${item.id}/toggle-public`, { isPublic: e.target.checked });
                            fetchItems();
                          } catch (err) { alert("Failed to update visibility"); }
                        }}
                      />
                      Market
                    </label>
                    <div className="card-buttons">
                      {isOwner && (
                        <button onClick={() => handleEditItem(item)} className="btn-secondary btn-sm" title="Edit Stock" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                      {isFullInventory && isOwner && (
                        <button onClick={() => handleDeleteItem(item.id)} className="btn-delete" title="Remove Item">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const menuItems = [
    {
      id: 'overview', label: 'Overview', path: '/dashboard', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'inventory', label: 'Inventory', path: '/dashboard/inventory', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      id: 'alerts', label: 'Alerts', path: '/dashboard/alerts', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    },
    {
      id: 'network', label: 'Network', path: '/dashboard/network', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      )
    },
    {
      id: 'marketplace', label: 'Marketplace', path: '/dashboard/marketplace', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
      )
    },
    {
      id: 'requests', label: 'Requests', path: '/dashboard/requests', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10l-4 4l6 6l4-16l-18 7l4 2l2 6l3-4" />
        </svg>
      )
    },
    ...(user?.role === 'admin' ? [{
      id: 'admin', label: 'Admin Panel', path: '/dashboard/admin', icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    }] : [])
  ];

  return (
    <div className="dashboard">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      
      <nav className={`sidebar ${user?.role === 'admin' ? 'admin' : 'user'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
          <span>Inventory Tracker</span>
        </div>
        <div className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                const path = item.path || `/dashboard/${item.id}`;
                navigate(path);
                setMobileMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>

      <main className="main">
        <header className="header">
          <div className="header-left">
            {/* Mobile hamburger button */}
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
            <h2>
              {isAdmin ? "Admin Dashboard" : `${user?.username}'s StockSage`}
              {isAdmin && <span className="admin-badge">Admin Mode</span>}
            </h2>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <div className="user-details">
                <span className="user-name">{user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content">
          <Routes>
            {/* Overview Route */}
            <Route path="/" element={
              <>
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon purple">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <span className="stat-label">Total Items</span>
                      <span className="stat-value">{totalItems}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M4 12h16M4 17h16" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <span className="stat-label">Categories</span>
                      <span className="stat-value">{categoryCount}</span>
                    </div>
                  </div>
                  <div className={`stat-card ${lowStockCount > 0 ? 'warning' : ''}`}>
                    <div className="stat-icon red">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <span className="stat-label">Low Stock</span>
                      <span className="stat-value">{lowStockCount}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <span className="stat-label">Stock Health</span>
                      <span className="stat-value">{lowStockCount === 0 ? 'Excellent' : 'Action Needed'}</span>
                      <span className="stat-sub">{lowStockCount} items low on stock</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon orange">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </div>
                    <div className="stat-details">
                      <span className="stat-label">Community Support</span>
                      <span className="stat-value">{communitySupportScore} Fulfills</span>
                      <span className="stat-sub">Successful trade history</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-grid">
                  {!isAdmin && (
                    <div className="card">
                      <div className="card-header">
                        <h3>Add New Item</h3>
                      </div>
                      <form className="form" onSubmit={handleAddItem}>
                        <div className="form-field">
                          <label>Item Name</label>
                          <input
                            type="text"
                            placeholder="Enter item name"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Quantity</label>
                          <input
                            type="number"
                            placeholder="Current Stock"
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label>Category</label>
                          <select
                            value={newItemCategoryId}
                            onChange={(e) => setNewItemCategoryId(e.target.value)}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name} ({cat.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label>Item Portrait</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {!selectedGalleryImage ? (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={fetchGallery}
                                style={{ padding: '12px', fontSize: '1rem', background: '#4f46e5' }}
                              >
                                🖼️ Select Image From Gallery
                              </button>
                            ) : (
                              <div className="image-preview" style={{ position: 'relative' }}>
                                <img
                                  src={`http://localhost:5000${selectedGalleryImage}`}
                                  alt="Selected from gallery"
                                />
                                <button
                                  type="button"
                                  className="btn-remove"
                                  style={{ position: 'absolute', top: '10px', right: '10px' }}
                                  onClick={() => setSelectedGalleryImage(null)}
                                >
                                  Change Image
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{ marginTop: '10px' }}
                          disabled={!selectedGalleryImage}
                        >
                          Add Item to Inventory
                        </button>
                      </form>
                    </div>
                  )}

                  {isGalleryOpen && (
                    <div className="gallery-modal-overlay">
                      <div className="gallery-modal">
                        <div className="modal-header">
                          <h3>Pick an Image from Uploads</h3>
                          <button className="close-btn" onClick={() => setIsGalleryOpen(false)}>&times;</button>
                        </div>
                        <div className="gallery-grid">
                          {galleryImages.map(img => (
                            <div
                              key={img}
                              className={`gallery-item ${selectedGalleryImage === img ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedGalleryImage(img);
                                setItemImage(null);
                                setImagePreview(null);
                                setIsGalleryOpen(false);
                              }}
                            >
                              <img src={`http://localhost:5000${img}`} alt="upload" />
                            </div>
                          ))}
                        </div>
                        {galleryImages.length === 0 && <p className="empty-state">No images found in uploads.</p>}
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="card">
                      <div className="card-header">
                        <h3>Admin Quick Actions</h3>
                      </div>
                      <div className="card-body" style={{ padding: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <button className="btn-primary" style={{ flex: 1, minWidth: '150px' }} onClick={() => navigate('/dashboard/admin')}>
                          Manage Users
                        </button>
                        <button className="btn-secondary" style={{ flex: 1, minWidth: '150px' }} onClick={() => navigate('/dashboard/admin')}>
                          Add New Category
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={`card ${isAdmin ? 'full-width' : ''}`} style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
                    <div className="card-header" style={{ padding: '0 0 20px 0', border: 'none' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
                        {isAdmin ? "Global Stock Monitoring" : "Shop Stock Overview"}
                      </h3>
                      <button className="btn-secondary" onClick={fetchItems}>Refresh</button>
                    </div>

                    {isAdmin ? (
                      <div className="inventory-grid">
                        {adminStats.map(item => (
                          <div key={item.id} className={`item-card ${item.is_verified ? 'verified' : ''}`}>
                            <div className="card-image-wrapper">
                              {item.item_image ? (
                                <img src={`http://localhost:5000${item.item_image}`} alt={item.item_name} className="card-image" />
                              ) : (
                                <div className="card-placeholder">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                              <div className="card-badge" style={{ position: 'absolute', top: '10px', right: '10px' }}>{item.category_name}</div>
                            </div>
                            <div className="card-content">
                              <div className="card-header-info">
                                <span className="card-title">{item.item_name}</span>
                                <span className={`badge ${item.quantity < 5 ? 'danger' : 'success'}`}>
                                  {item.quantity < 5 ? 'Low Stock' : 'In Stock'}
                                </span>
                                {item.is_verified && (
                                  <div className="badge-verified" title="Verified Merchant">
                                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                    Verified
                                  </div>
                                )}
                              </div>
                              <div className="card-body">
                                <div className="card-stat">
                                  <span>Quantity</span>
                                  <b>{item.quantity} {item.unit || 'units'}</b>
                                </div>
                                <div className="card-stat">
                                  <span>Owner Shop</span>
                                  <b>{item.shop_name}</b>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {adminStats.length === 0 && <p className="empty-state">No system-wide items found.</p>}
                      </div>
                    ) : (
                      <>
                        <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
                          <div className="card">
                            <div className="card-header">
                              <h3>Active Goods Requests (Give & Take)</h3>
                            </div>
                            <div className="card-body" style={{ padding: '0 20px 20px' }}>
                              {(incomingRequests.length === 0 && outgoingRequests.length === 0) ? (
                                <div className="empty-state" style={{ padding: '20px' }}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '40px', height: '40px', marginBottom: '10px' }}>
                                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                  <p>No active peer requests at the moment.</p>
                                </div>
                              ) : (
                                <div className="requests-mini-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {/* Incoming - "Give" Opportunity */}
                                  {incomingRequests.map(req => (
                                    <div key={req.id} className="request-mini-card" style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="badge warning" style={{ fontSize: '0.7rem' }}>INCOMING: Someone Needs Goods</span>
                                        <b style={{ color: '#0f172a' }}>{req.quantity} {req.item_name}</b>
                                      </div>
                                      <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '12px' }}>
                                        <b>{req.sender_shop}</b> is asking for help.
                                      </p>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        {req.status === 'pending' && <button className="btn-primary btn-sm" onClick={() => handleUpdateStatus(req.id, 'accepted')}>Accept & Give</button>}
                                        {req.status === 'accepted' && <button className="btn-info btn-sm" onClick={() => handleUpdateStatus(req.id, 'shipped')}>Mark Shipped</button>}
                                      </div>
                                    </div>
                                  ))}

                                  {/* Outgoing - "Take" Status */}
                                  {outgoingRequests.map(req => (
                                    <div key={req.id} className="request-mini-card" style={{ padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="badge primary" style={{ fontSize: '0.7rem' }}>OUTGOING: You Asked for Goods</span>
                                        <b style={{ color: '#0f172a' }}>{req.quantity} {req.item_name}</b>
                                      </div>
                                      <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '12px' }}>
                                        Status: <span className={`badge ${req.status}`}>{req.status}</span>
                                      </p>
                                      {req.status === 'shipped' && (
                                        <button className="btn-success btn-sm" onClick={() => handleUpdateStatus(req.id, 'received')}>Confirm Received</button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {categories.map(cat =>
                          renderCategorySection(cat.name, items.filter(i => parseInt(i.category_id) === cat.id))
                        )}
                        {renderCategorySection('Uncategorized', items.filter(i => !i.category_id))}

                        {items.length === 0 && (
                          <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p>Your inventory is empty. Start adding items to track your stock.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            } />

            {/* Inventory Route */}
            <Route path="inventory" element={
              <div className="card" style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}>
                <div className="card-header" style={{ padding: '0 0 24px 0', border: 'none' }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
                    {isAdmin ? "System-Wide Inventory Ledger" : "Your Shop Inventory Management"}
                  </h3>
                </div>

                {isAdmin ? (
                  <div className="inventory-grid" style={{ marginTop: '20px' }}>
                    {adminStats.length === 0 ? (
                      <p className="empty-state">No system-wide items found.</p>
                    ) : (
                      adminStats.map(item => (
                        <div key={item.id} className="item-card">
                          <div className="card-image-wrapper">
                            {item.item_image ? (
                              <img src={`http://localhost:5000${item.item_image}`} alt={item.item_name} className="card-image" />
                            ) : (
                              <div className="card-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                </svg>
                              </div>
                            )}
                            <div className="card-badge">{item.category_name}</div>
                          </div>
                          <div className="card-content">
                            <div className="card-header-info">
                              <span className="card-title">{item.item_name}</span>
                              <span className={`badge ${item.quantity < 5 ? 'danger' : 'success'}`}>
                                {item.quantity < 5 ? 'Low Stock' : 'In Stock'}
                              </span>
                              {item.is_verified && (
                                <div className="badge-verified" title="Verified Merchant">
                                  <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                  Verified
                                </div>
                              )}
                            </div>
                            <div className="card-body">
                              <div className="card-stat">
                                <span>Quantity</span>
                                <b>{item.quantity} {item.unit || 'units'}</b>
                              </div>
                              <div className="card-stat">
                                <span>Shop</span>
                                <b>{item.shop_name}</b>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <>
                    {categories.map(cat =>
                      renderCategorySection(cat.name, items.filter(i => parseInt(i.category_id) === cat.id), true)
                    )}
                    {renderCategorySection('Uncategorized Items', items.filter(i => !i.category_id), true)}
                  </>
                )}
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
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <p>All stock levels are healthy</p>
                    </div>
                  ) : (
                    items.filter(i => i.quantity < 5).map(item => (
                      <div key={item.id} className="alert-item">
                        <div className="alert-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
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

            {/* Marketplace Route */}
            <Route path="marketplace" element={<MarketplacePage user={user} />} />

            {/* Requests Route */}
            <Route path="requests" element={<RequestsManager user={user} />} />

            {/* Admin Route */}
            {user?.role === 'admin' && (
              <Route path="admin" element={<AdminDashboard />} />
            )}

          </Routes>
        </div>
      </main>
    </div>
  );
}