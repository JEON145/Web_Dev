import React, { useState, useEffect } from 'react';
import API from '../api/axiosConfig';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [globalInventory, setGlobalInventory] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ name: '', unit: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [userRes, logRes, invRes, catRes] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/logs/requests'),
                API.get('/admin/inventory/summary'),
                API.get('/categories')
            ]);
            setUsers(userRes.data);
            setLogs(logRes.data);
            setGlobalInventory(invRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUserAction = async (userId, action, value) => {
        try {
            await API.patch(`/admin/users/${userId}`, { [action]: value });
            alert(`User updated successfully`);
            fetchData();
        } catch (err) {
            alert("Failed to update user: " + (err.response?.data?.error || err.message));
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/categories', newCategory);
            setNewCategory({ name: '', unit: '' });
            alert("Category added!");
            fetchData();
        } catch (err) {
            alert("Failed to add category");
        }
    };

    if (loading) return <div className="loading">Loading Admin Control...</div>;

    return (
        <div className="admin-dashboard">
            <div className="card-header">
                <h3>🛡️ Admin Control Panel</h3>
                <div className="tab-controls">
                    <button className={`btn-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={`btn-tab ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>Global Stock</button>
                    <button className={`btn-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Audit Logs</button>
                    <button className={`btn-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'users' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Shop Name</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.shop_name}</td>
                                        <td><span className={`badge ${u.role === 'admin' ? 'primary' : 'secondary'}`}>{u.role}</span></td>
                                        <td>
                                            {u.is_banned ? <span className="badge danger">Banned</span> :
                                                u.is_approved ? <span className="badge success">Approved</span> :
                                                    <span className="badge warning">Pending</span>}
                                        </td>
                                        <td className="actions-cell">
                                            {!u.is_approved && <button className="btn-success btn-sm" onClick={() => handleUserAction(u.id, 'is_approved', true)}>Approve</button>}
                                            <button className={`btn-sm ${u.is_banned ? 'btn-success' : 'btn-danger'}`} onClick={() => handleUserAction(u.id, 'is_banned', !u.is_banned)}>
                                                {u.is_banned ? 'Unban' : 'Ban'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <div className="global-stats">
                        <div className="stats-grid">
                            {globalInventory.map(stat => (
                                <div key={stat.category} className="stat-card">
                                    <div className="stat-content">
                                        <span className="stat-label">{stat.category}</span>
                                        <span className="stat-value">{stat.total_quantity} units</span>
                                        <span className="stat-sub">{stat.item_count} unique items</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Requester</th>
                                    <th>Provider</th>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleDateString()}</td>
                                        <td>{log.sender_shop || log.sender_name}</td>
                                        <td>{log.receiver_shop || log.receiver_name || 'Community'}</td>
                                        <td>{log.item_name}</td>
                                        <td>{log.quantity}</td>
                                        <td><span className={`badge ${log.status}`}>{log.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-panel">
                        <div className="card">
                            <div className="card-header"><h4>Add New Category</h4></div>
                            <form onSubmit={handleAddCategory} className="form">
                                <div className="form-field">
                                    <label>Category Name</label>
                                    <input type="text" value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g. Fluids, Grains" required />
                                </div>
                                <div className="form-field">
                                    <label>Unit</label>
                                    <input type="text" value={newCategory.unit} onChange={e => setNewCategory({ ...newCategory, unit: e.target.value })} placeholder="e.g. Liters, kg" required />
                                </div>
                                <button type="submit" className="btn-primary">Create Category</button>
                            </form>
                        </div>

                        <div className="categories-list" style={{ marginTop: '20px' }}>
                            <h4>Existing Categories</h4>
                            <div className="badge-group">
                                {categories.map(c => (
                                    <span key={c.id} className="badge secondary" style={{ margin: '4px' }}>{c.name} ({c.unit})</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
