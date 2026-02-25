// Inventory View
const InventoryView = ({ items }) => (
  <div className="card stock-table-card full-width">
    <div className="card-header"><h3>📦 Full Inventory List</h3></div>
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr><th>Item Name</th><th>Quantity</th><th>Status</th></tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.item_name || item.name}</td>
              <td>{item.quantity}</td>
              <td><span className={`badge ${item.quantity < 5 ? 'danger' : 'success'}`}>
                {item.quantity < 5 ? 'Low' : 'Healthy'}
              </span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

