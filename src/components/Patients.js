
import React, { useState, useEffect } from 'react';
import { patientsAPI, employeesAPI, pharmacyAPI } from '../services/api';
import MedicineSelectionModal from './MedicineSelectionModal';

function Patients({ onBack, patients, setPatients }) {
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    fees: 'PAID',
    amount: '',
    doctor: '',
    treatment: '',
    receivedBy: ''
  });

  const [selectedMedications, setSelectedMedications] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState('');

  // New state for medication modal
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [medicationError, setMedicationError] = useState('');

  // Function to convert 24-hour time to 12-hour format for display
  const convertTo12Hour = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return timeStr;

    const [hour, minute] = timeStr.split(':');
    let hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    hourInt = hourInt % 12;
    hourInt = hourInt ? hourInt : 12; // 0 becomes 12
    return `${hourInt}:${minute} ${ampm}`;
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const employeesData = await employeesAPI.getAll();
        setEmployees(employeesData);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    const fetchMedicines = async () => {
      try {
        const medicinesData = await pharmacyAPI.getAll();
        setMedicines(medicinesData);
      } catch (error) {
        console.error('Failed to fetch medicines:', error);
      }
    };
    fetchEmployees();
    fetchMedicines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedMedications.length === 0) {
      setError('Please select at least one medication before adding the patient.');
      setLoading(false);
      return;
    }

    // Prepare medications data to send only medicineId and quantity
    const medsToSend = selectedMedications.map(med => ({
      medicineId: med.medicineId || med.medicine._id || med.medicineId,
      quantity: med.quantity
    }));

    try {
      const newPatient = await patientsAPI.create(formData, medsToSend);
      setPatients([newPatient, ...patients]);
      setFormData({
        name: '',
        time: '',
        fees: 'PAID',
        amount: '',
        doctor: '',
        treatment: '',
        receivedBy: ''
      });
      setSelectedMedications([]);
    } catch (error) {
      setError(error.message || 'Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Open medication modal for a patient
  const openMedicationModal = (patientId) => {
    setSelectedPatientId(patientId);
    setMedicationError('');
    setIsMedModalOpen(true);
  };

  // Close medication modal
  const closeMedicationModal = () => {
    setSelectedPatientId(null);
    setIsMedModalOpen(false);
  };

  // Save medications for patient
  const saveMedications = async (medications) => {
    setMedicationError('');
    if (!medications || medications.length === 0) {
      setMedicationError('At least one medicine must be selected.');
      return;
    }
    if (selectedPatientId) {
      try {
        const updatedPatient = await patientsAPI.assignMedications(selectedPatientId, medications);
        const updatedPatients = patients.map(p =>
          p._id === updatedPatient._id ? updatedPatient : p
        );
        setPatients(updatedPatients);
        closeMedicationModal();
      } catch (error) {
        console.error('Failed to assign medications:', error);
        setMedicationError(error.message || 'Failed to assign medications. Please try again.');
      }
    } else {
      // For new patient creation, set selected medications state with names
      const medsWithNames = medications.map(med => {
        const medicine = medicines.find(m => m._id === med.medicineId);
        return {
          ...med,
          medicineName: medicine ? medicine.medicineName : `Medicine ID: ${med.medicineId}`
        };
      });
      setSelectedMedications(medsWithNames);
      closeMedicationModal();
    }
  };

  return (
    <div className="patients-container">
      <header className="patients-header">
        <button onClick={onBack} className="back-button">← Back to Dashboard</button>
        <h1>Patients</h1>
      </header>

      <div className="patients-content">
        <div className="patient-form-section">
          <h2>Add New Patient</h2>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="patient-form">
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
                <label>Date:</label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  readOnly
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Time:</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fees Status:</label>
                <select
                  name="fees"
                  value={formData.fees}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="PAID">PAID</option>
                  <option value="UNPAID">UNPAID</option>
                </select>
              </div>
              {formData.fees === 'UNPAID' && (
                <div className="form-group">
                  <label>Amount:</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Doctor:</label>
                <select
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Doctor</option>
                  <option value="Dr.Dayanand Tara">Dr.Dayanand Tara</option>
                  <option value="Dr. Prerna Tara">Dr. Prerna Tara</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Treatment (max 50 characters):</label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                maxLength={50}
                rows="3"
                required
                disabled={loading}
              />
              <span className="char-count">{formData.treatment.length}/50</span>
            </div>

            <div className="form-group">
              <label>Medications:</label>
              <button
                type="button"
                className="submit-button"
                onClick={() => openMedicationModal(null)}
                disabled={loading}
              >
                Select Medications ({selectedMedications.length} selected)
              </button>
              {selectedMedications.length > 0 && (
                <ul style={{ marginTop: '10px' }}>
                  {selectedMedications.map((med, idx) => (
                    <li key={idx}>
                      {med.medicineName || `Medicine ID: ${med.medicineId}`} - Qty: {med.quantity}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="submit-button" disabled={loading || selectedMedications.length === 0}>
              {loading ? 'Adding Patient...' : 'Add Patient'}
            </button>
          </form>
        </div>
        
        <div className="patients-list-section">
          <h2>Patient Records</h2>
          <table className="patients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fees</th>
                <th>Received By</th>
                <th>Doctor</th>
                <th>Treatment</th>
                <th>Medications</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={patient._id || index}>
                  <td>{patient.name}</td>
                  <td>{patient.date ? new Date(patient.date).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                  <td>{convertTo12Hour(patient.time)}</td>
                  <td>
                    <span
                      className={`status ${patient.fees.toLowerCase()}`}
                      title={patient.fees === 'PAID' && patient.receivedBy ? `Received by: ${patient.receivedBy}` : ''}
                      style={{ cursor: patient.fees === 'PAID' && patient.receivedBy ? 'help' : 'default' }}
                    >
                      {patient.fees}
                      {patient.fees === 'UNPAID' && patient.amount && ` (₹${patient.amount})`}
                    </span>
                    {patient.fees === 'UNPAID' && (
                      <div className="payment-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <select
                          value={selectedReceiver}
                          onChange={(e) => setSelectedReceiver(e.target.value)}
                          className="receiver-dropdown"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            color: '#333',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            minWidth: '160px'
                          }}
                        >
                          <option value="">Select Receiver</option>
                          {employees.map(employee => (
                            <option key={employee._id} value={employee.name}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="submit-button"
                          style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: '#4f46e5',
                            color: '#fff',
                            fontSize: '14px',
                            cursor: selectedReceiver ? 'pointer' : 'not-allowed',
                            opacity: selectedReceiver ? 1 : 0.6,
                            transition: 'background-color 0.3s ease'
                          }}
                          onMouseEnter={e => {
                            if (selectedReceiver) e.target.style.backgroundColor = '#4338ca';
                          }}
                          onMouseLeave={e => {
                            if (selectedReceiver) e.target.style.backgroundColor = '#4f46e5';
                          }}
                          onClick={async () => {
                            if (!selectedReceiver) {
                              alert('Please select who received the payment');
                              return;
                            }
                            try {
                              const updatedPatient = await patientsAPI.update(patient._id, {
                                fees: 'PAID',
                                amount: '',
                                receivedBy: selectedReceiver
                              });
                              console.log('Updated patient:', updatedPatient); // Debug log
                              const updatedPatients = patients.map(p =>
                                p._id === patient._id ? updatedPatient : p
                              );
                              setPatients(updatedPatients);
                              setSelectedReceiver('');
                            } catch (error) {
                              console.error('Failed to update fees status:', error);
                              alert('Failed to update fees status. Please try again.');
                            }
                          }}
                          disabled={!selectedReceiver}
                        >
                          Mark as Paid
                        </button>
                      </div>
                    )}
                  </td>
                  <td>{patient.fees === 'PAID' ? patient.receivedBy || '-' : '-'}</td>
                  <td>{patient.doctor}</td>
                  <td>{patient.treatment}</td>
                  <td>
                    {patient.medications && patient.medications.length > 0 ? (
                      <ul>
                        {patient.medications
                          .filter(med => new Date(med.medicine.expiryDate) >= new Date())
                          .map((med, idx) => (
                            <li key={idx}>
                              {med.medicine.medicineName} - Qty: {med.quantity}
                            </li>
                          ))}
                      </ul>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MedicineSelectionModal
        isOpen={isMedModalOpen}
        onClose={closeMedicationModal}
        onSave={saveMedications}
      />
      {medicationError && (
        <div className="error-message" style={{ marginTop: '10px' }}>
          {medicationError}
        </div>
      )}
    </div>
  );
}

export default Patients;
