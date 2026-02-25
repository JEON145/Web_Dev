import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

export default function NetworkPage() {
  const [communityRequests, setCommunityRequests] = useState([]);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');

  // 1. Fetch all open requests from other shops
  const fetchCommunityNeeds = async () => {
    try {
      const res = await API.get('/requests/community');
      setCommunityRequests(res.data);
    } catch (err) { 
      console.error("Error fetching community board:", err); 
    }
  };

  useEffect(() => { 
    fetchCommunityNeeds(); 
  }, []);

  // 2. Handle broadcasting a new emergency need
  const handlePostRequest = async (e) => {
    e.preventDefault();
    try {
      await API.post('/requests', { 
        item_name: itemName, 
        quantity: quantity 
      });
      alert("Request broadcasted to the network!");
      
      // Clear inputs and refresh the board
      setItemName('');
      setQuantity('');
      fetchCommunityNeeds(); 
    } catch (err) {
      console.error(err);
      alert("Failed to post request. Check if the server is running.");
    }
  };

  // 3. Handle fulfilling someone else's request
  const handleFulfill = async (requestId) => {
    try {
      await API.put(`/requests/${requestId}/fulfill`);
      alert("Thank you! You've successfully offered to help.");
      fetchCommunityNeeds(); // Refresh to remove the fulfilled item from the board
    } catch (err) {
      console.error("Fulfillment error:", err);
      alert("Could not complete the action.");
    }
  };

  return (
    <div className="network-page">
      {/* Post Request Card */}
      <div className="card">
        <div className="card-header">
          <h3>Broadcast a Need</h3>
          <span className="header-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            New
          </span>
        </div>
        <div className="card-body">
          <p className="card-desc">Post what you need so nearby shops can help.</p>
          <form onSubmit={handlePostRequest} className="network-form">
            <div className="form-row">
              <div className="form-field flex-1">
                <label>Item Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Milk, Bread, Rice" 
                  value={itemName} 
                  onChange={(e) => setItemName(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-field" style={{width: '100px'}}>
                <label>Quantity</label>
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
              Post to Network
            </button>
          </form>
        </div>
      </div>

      {/* Community Board Card */}
      <div className="card" style={{marginTop: '20px'}}>
        <div className="card-header">
          <h3>Community Board</h3>
          <button className="btn-secondary" onClick={fetchCommunityNeeds}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
        <div className="card-body">
          <p className="card-desc">Active requests from nearby shopkeepers.</p>
          
          <div className="requests-list">
            {communityRequests.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p>No active requests. All shops are well stocked!</p>
              </div>
            ) : (
              communityRequests.map(req => (
                <div key={req.id} className="request-card">
                  <div className="request-left">
                    <div className="request-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Urgent
                    </div>
                    <div className="request-info">
                      <strong className="shop-name">{req.shop_name}</strong>
                      <span className="request-detail">
                        Needs <span className="highlight">{req.quantity} units</span> of <span className="highlight">{req.item_name}</span>
                      </span>
                      <span className="request-time">
                        {new Date(req.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button className="btn-help" onClick={() => handleFulfill(req.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                      <path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    I can help
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}