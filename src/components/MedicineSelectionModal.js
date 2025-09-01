import React, { useState, useEffect } from 'react';
import { pharmacyAPI } from '../services/api';

function MedicineSelectionModal({ isOpen, onClose, onSave }) {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchMedicines();
      setSelectedMedicines([]);
      setError('');
    }
  }, [isOpen]);

  const fetchMedicines = async () => {
    try {
      const data = await pharmacyAPI.getAll();
      // Filter out expired medicines
      const nonExpiredMedicines = data.filter(med => new Date(med.expiryDate) >= new Date());
      setMedicines(nonExpiredMedicines);
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    }
  };

  const handleQuantityChange = (medicineId, quantity) => {
    if (quantity < 0) return;
    setSelectedMedicines(prev => {
      const existing = prev.find(med => med.medicineId === medicineId);
      if (existing) {
        return prev.map(med =>
          med.medicineId === medicineId ? { ...med, quantity } : med
        );
      } else {
        return [...prev, { medicineId, quantity }];
      }
    });
  };

  const handleCheckboxChange = (medicineId, checked) => {
    if (!checked) {
      setSelectedMedicines(prev => prev.filter(med => med.medicineId !== medicineId));
    } else {
      setSelectedMedicines(prev => {
        if (prev.find(med => med.medicineId === medicineId)) return prev;
        return [...prev, { medicineId, quantity: 1 }];
      });
    }
  };

  const validateAndSave = () => {
    setError('');
    // Filter selected medicines with quantity > 0
    const medsToSave = selectedMedicines.filter(med => med.quantity > 0);

    // Validate stock and expiry
    for (const med of medsToSave) {
      const medicine = medicines.find(m => m._id === med.medicineId);
      if (!medicine) {
        setError('Selected medicine not found.');
        return;
      }
      if (med.quantity > medicine.quantity) {
        setError(`Insufficient stock for ${medicine.medicineName}. Available: ${medicine.quantity}`);
        return;
      }
      if (new Date(medicine.expiryDate) < new Date()) {
        setError(`${medicine.medicineName} has expired.`);
        return;
      }
    }

    if (medsToSave.length === 0) {
      setError('Please select at least one medicine with quantity.');
      return;
    }

    onSave(medsToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={overlayStyle}>
      <div className="modal-content" style={modalStyle}>
        <h2>Select Medicines</h2>
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th></th>
                <th>Medicine Name</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(med => {
                const selected = selectedMedicines.find(s => s.medicineId === med._id);
                return (
                  <tr key={med._id} style={{ borderBottom: '1px solid #ccc' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={e => handleCheckboxChange(med._id, e.target.checked)}
                      />
                    </td>
                    <td>{med.medicineName}</td>
                    <td>{med.quantity}</td>
                    <td>{new Date(med.expiryDate).toLocaleDateString()}</td>
                    <td>
                      {selected ? (
                        <input
                          type="number"
                          min="1"
                          max={med.quantity}
                          value={selected.quantity}
                          onChange={e => handleQuantityChange(med._id, parseInt(e.target.value) || 0)}
                          style={{ width: '60px' }}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '15px', textAlign: 'right' }}>
          <button onClick={onClose} style={buttonStyle}>
            Cancel
          </button>
          <button onClick={validateAndSave} style={{ ...buttonStyle, marginLeft: '10px' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '600px',
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
};

const buttonStyle = {
  padding: '8px 16px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#4f46e5',
  color: '#fff',
  cursor: 'pointer'
};

export default MedicineSelectionModal;
