import React, { useState, useEffect } from 'react';
import { employeesAPI } from '../services/api';

function Employees({ onBack }) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phoneNumber: '',
    gender: '',
    dateOfJoining: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeesAPI.getAll();
      setEmployees(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch employees. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.address && formData.phoneNumber && formData.gender && formData.dateOfJoining) {
      try {
        setLoading(true);
        setError('');
        await employeesAPI.create(formData);
        setSuccess('Employee added successfully');
        setFormData({ name: '', address: '', phoneNumber: '', gender: '', dateOfJoining: '' });
        await fetchEmployees();
        setLoading(false);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to add employee. Please try again.');
        setLoading(false);
      }
    } else {
      setError('Please fill in all required fields.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) {
      setError('');
    }
  };

  return (
    <div className="employees-container">
      <header className="employees-header">
        <button onClick={onBack} className="back-button" disabled={loading}>← Back to Dashboard</button>
        <h1>Employees</h1>
      </header>
      <div className="employees-content">
        <div className="employee-form-section">
          <h2>Add New Employee</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit} className="employee-form">
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Address:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gender:</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Joining:</label>
                <input
                  type="date"
                  name="dateOfJoining"
                  value={formData.dateOfJoining}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Adding...' : 'Add Employee'}
            </button>
          </form>
        </div>
        <div className="employees-list-section">
          <h2>Employee Records</h2>
          {loading ? (
            <div className="loading">Loading employees...</div>
          ) : (
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Phone Number</th>
                <th>Gender</th>
                <th>Date of Joining</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.name}</td>
                  <td>{emp.address}</td>
                  <td>{emp.phoneNumber}</td>
                  <td>{emp.gender}</td>
                  <td>{emp.dateOfJoining}</td>
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

export default Employees;
