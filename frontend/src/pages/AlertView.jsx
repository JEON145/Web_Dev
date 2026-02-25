const AlertsView = ({ items }) => {
  const lowStockItems = items.filter(i => i.quantity < 5);

  return (
    <div className="alerts-container">
      <div className="card">
        <div className="card-header">
          <h3>⚠️ Critical Stock Alerts</h3>
          <span className="badge danger">{lowStockItems.length} Items Need Restock</span>
        </div>
        <div className="alert-grid">
          {lowStockItems.length > 0 ? (
            lowStockItems.map(item => (
              <div key={item.id} className="alert-card-item">
                <div className="alert-info">
                  <h4>{item.item_name}</h4>
                  <p>Current Count: <strong>{item.quantity}</strong></p>
                </div>
                <button className="btn-primary">Order Stock</button>
              </div>
            ))
          ) : (
            <p className="no-data">Everything is well stocked! ✅</p>
          )}
        </div>
      </div>
    </div>
  );
};