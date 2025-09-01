import React, { useState, useEffect } from 'react';
import { pharmacyAPI } from '../services/api';

function Pharmacy({ onBack }) {
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    medicineName: '',
    genericName: '',
    category: '',
    strength: '',
    quantity: '',
    unit: '',
    manufacturer: '',
    expiryDate: '',
    price: '',
    supplier: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await pharmacyAPI.getAll();
      setInventory(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch inventory. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.medicineName && formData.genericName && formData.category &&
      formData.strength && formData.quantity && formData.unit &&
      formData.manufacturer && formData.expiryDate && formData.price &&
      formData.supplier && formData.location
    ) {
      try {
        setLoading(true);
        setError('');
        await pharmacyAPI.create(formData);
        setSuccess('Medicine added successfully');
        setFormData({
          medicineName: '',
          genericName: '',
          category: '',
          strength: '',
          quantity: '',
          unit: '',
          manufacturer: '',
          expiryDate: '',
          price: '',
          supplier: '',
          location: ''
        });
        await fetchInventory();
        setLoading(false);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to add medicine. Please try again.');
        setLoading(false);
      }
    } else {
      setError('Please fill in all required fields.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (error) {
      setError('');
    }
  };

  return (
    <div className="pharmacy-container">
      <header className="pharmacy-header">
        <button onClick={onBack} className="back-button" disabled={loading}>← Back to Dashboard</button>
        <h1>Pharmacy Inventory</h1>
      </header>
      
      <div className="pharmacy-content">
        <div className="inventory-form-section">
          <h2>Add New Medicine</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit} className="inventory-form">
            <div className="form-row">
              <div className="form-group">
                <label>Medicine Name:</label>
                <input
                  type="text"
                  name="medicineName"
                  value={formData.medicineName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Generic Name:</label>
                <input
                  type="text"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category:</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Category</option>
                  <option value="Pain Relief">Pain Relief</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Antiviral">Antiviral</option>
                  <option value="Antifungal">Antifungal</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Respiratory">Respiratory</option>
                  <option value="Gastrointestinal">Gastrointestinal</option>
                  <option value="Vitamins">Vitamins</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Strength:</label>
                <input
                  type="text"
                  name="strength"
                  value={formData.strength}
                  onChange={handleInputChange}
                  placeholder="e.g., 500mg, 10ml"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Unit:</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Unit</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Capsules">Capsules</option>
                  <option value="Bottles">Bottles</option>
                  <option value="Vials">Vials</option>
                  <option value="Tubes">Tubes</option>
                  <option value="Packs">Packs</option>
                  <option value="Units">Units</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Manufacturer:</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Expiry Date:</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹):</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Supplier:</label>
                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Storage Location:</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Shelf A1, Refrigerator"
                required
                disabled={loading}
              />
            </div>
            
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Adding...' : 'Add Medicine'}
            </button>
          </form>
        </div>
        
        <div className="inventory-list-section">
          <h2>Inventory Records</h2>
          {loading ? (
            <div className="loading">Loading inventory...</div>
          ) : (
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Strength</th>
                  <th>Quantity</th>
                  <th>Expiry Date</th>
                  <th>Price (₹)</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <strong>{item.medicineName}</strong>
                        <br />
                        <small>{item.genericName}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`category-badge ${item.category.toLowerCase().replace(' ', '-')}`}>
                        {item.category}
                      </span>
                    </td>
                    <td>{item.strength}</td>
                    <td>
                      <span className={`quantity-badge ${item.quantity < 50 ? 'low' : item.quantity < 100 ? 'medium' : 'high'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td>
                      <span className={`expiry-badge ${new Date(item.expiryDate) < new Date() ? 'expired' : 
                        new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'expiring-soon' : 'valid'}`}>
                        {item.expiryDate}
                      </span>
                    </td>
                    <td>₹{item.price}</td>
                    <td>{item.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Pharmacy;
