import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Patients from "./components/Patients";
import Pharmacy from "./components/Pharmacy";
import Employees from "./components/Employees";
import Availability from "./components/Availability";
import Login from "./components/Login";
import { authAPI, patientsAPI, bedsAPI } from "./services/api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("overview");
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 4 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load patients and beds data
      const [patientsData, bedsData] = await Promise.all([
        patientsAPI.getAll(),
        bedsAPI.getAll(),
      ]);
      console.log("Loaded patients data:", patientsData);
      console.log("Loaded beds data:", bedsData);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setBeds(Array.isArray(bedsData) ? bedsData : []);
    } catch (error) {
      console.error("Error loading initial data:", error);
      // If token is invalid, logout
      if (error.message.includes("401")) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, TIMEOUT_DURATION);
  };

  const handleUserActivity = () => {
    if (isLoggedIn) {
      resetTimeout();
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // Set up event listeners for user activity
      const events = [
        "mousedown",
        "mousemove",
        "keypress",
        "scroll",
        "touchstart",
        "click",
      ];

      events.forEach((event) => {
        document.addEventListener(event, handleUserActivity, true);
      });

      // Start the timeout
      resetTimeout();

      // Cleanup function
      return () => {
        events.forEach((event) => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [isLoggedIn]);

  const handleLogin = async (loginResponse) => {
    setIsLoggedIn(true);
    await loadInitialData();
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsLoggedIn(false);
    setCurrentView("dashboard");
    setActiveTab("overview");
    setPatients([]);
    setBeds([]);
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const addPatient = async (newPatient) => {
    try {
      const createdPatient = await patientsAPI.create(newPatient);
      setPatients([createdPatient, ...patients]);
    } catch (error) {
      console.error("Error adding patient:", error);
      throw error;
    }
  };

  const updateBeds = async (updatedBeds) => {
    setBeds(updatedBeds);
  };

  const availableBeds = beds.filter((bed) => !bed.isBooked).length;

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

  const handleDownloadReport = () => {
    // Create a modal to select patient from dropdown
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      width: 400px;
      max-width: 90%;
    `;
    
    modalContent.innerHTML = `
      <h3 style="margin-bottom: 15px; color: #333;">Select Patient</h3>
      <select id="patientSelect" style="
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-bottom: 15px;
        font-size: 14px;
      ">
        <option value="">Select a patient...</option>
        ${patients.map(patient => `
          <option value="${patient._id}">
            ${patient.name} - ${patient.time} (${new Date(patient.createdAt || new Date()).toLocaleDateString()})
          </option>
        `).join('')}
      </select>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelBtn" style="
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #f5f5f5;
          cursor: pointer;
        ">Cancel</button>
        <button id="downloadBtn" style="
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #4f46e5;
          color: white;
          cursor: pointer;
        " disabled>Download</button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    const patientSelect = modalContent.querySelector('#patientSelect');
    const cancelBtn = modalContent.querySelector('#cancelBtn');
    const downloadBtn = modalContent.querySelector('#downloadBtn');
    
    patientSelect.addEventListener('change', () => {
      downloadBtn.disabled = !patientSelect.value;
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    downloadBtn.addEventListener('click', () => {
      const selectedPatientId = patientSelect.value;
      if (!selectedPatientId) return;
      
      const patient = patients.find(p => p._id === selectedPatientId);
      if (!patient) return;

      // Create CSV content
      const csvContent = [
        ['Patient Report', ''],
        ['Name', patient.name],
        ['Time', patient.time],
        ['Fees Status', patient.fees],
        ['Amount', patient.amount || 'N/A'],
        ['Received By', patient.receivedBy || 'N/A'],
        ['Doctor', patient.doctor],
        ['Treatment', patient.treatment],
        ['', ''],
        ['Report Generated', new Date().toLocaleString()]
      ];

      // Convert to CSV string
      const csvString = csvContent.map(row => row.join(',')).join('\n');

      // Create download link
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${patient.name}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Close the modal after download
      document.body.removeChild(modal);
    });
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === "patients") {
    return (
      <Patients
        onBack={() => setCurrentView("dashboard")}
        patients={patients}
        setPatients={setPatients}
      />
    );
  }

  if (currentView === "pharmacy") {
    return <Pharmacy onBack={() => setCurrentView("dashboard")} />;
  }

  if (currentView === "employees") {
    return <Employees onBack={() => setCurrentView("dashboard")} />;
  }

  if (currentView === "availability") {
    return (
      <Availability
        onBack={() => setCurrentView("dashboard")}
        beds={beds}
        setBeds={updateBeds}
      />
    );
  }

  const renderDashboardContent = () => {
    switch (activeTab) {
      case "patients":
        const unpaidPatients = patients.filter(
          (patient) => patient.fees === "UNPAID"
        );
        return (
          <div className="room-occupancy">
            <h2>Unpaid Patient Records</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Time</th>
                    <th>Fees</th>
                    <th>Doctor</th>
                    <th>Treatment</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidPatients.map((patient, index) => (
                    <tr key={patient._id || index}>
                      <td>{patient.name}</td>
                      <td>{patient.time}</td>
                      <td>
                        <span
                          className={`status ${patient.fees.toLowerCase()}`}
                        >
                          {patient.fees}
                          {patient.fees === 'UNPAID' && patient.amount && ` (₹${patient.amount})`}
                        </span>
                      </td>
                      <td>{patient.doctor}</td>
                      <td>{patient.treatment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      case "overview":
      default:
        // Filter patients to only those on today's date
        const today = new Date().toLocaleDateString();
        const patientsToday = patients.filter(patient => {
          if (!patient.date) return true; // Include patients without date (legacy data) as today's
          const patientDate = new Date(patient.date).toLocaleDateString();
          return patientDate === today;
        });

        // Divide patients into morning and evening
        const morningPatients = patients.filter(patient => {
          if (!patient.date) return false;
          const patientDate = new Date(patient.date).toLocaleDateString();
          if (patientDate !== today) return false;
          const [hour] = patient.time.split(':');
          return parseInt(hour, 10) < 12;
        });
        const eveningPatients = patients.filter(patient => {
          if (!patient.date) return false;
          const patientDate = new Date(patient.date).toLocaleDateString();
          if (patientDate !== today) return false;
          const [hour] = patient.time.split(':');
          return parseInt(hour, 10) >= 12;
        });

        return (
          <div className="room-occupancy">
            <h2>Today's Patient Records</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="morning-section">
                  <h3>Morning Patients</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Time</th>
                        <th>Fees</th>
                        <th>Doctor</th>
                        <th>Treatment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {morningPatients.map((patient, index) => (
                        <tr key={patient._id || index}>
                          <td
                            style={{ cursor: 'pointer', color: '#4f46e5' }}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowModal(true);
                            }}
                          >
                            {patient.name}
                          </td>
                          <td>{convertTo12Hour(patient.time)}</td>
                          <td>
                            <span
                              className={`status ${patient.fees.toLowerCase()}`}
                            >
                              {patient.fees}
                              {patient.fees === 'UNPAID' && patient.amount && ` (₹${patient.amount})`}
                            </span>
                          </td>
                          <td>{patient.doctor}</td>
                          <td>{patient.treatment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="evening-section">
                  <h3>Evening Patients</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Time</th>
                        <th>Fees</th>
                        <th>Doctor</th>
                        <th>Treatment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eveningPatients.map((patient, index) => (
                        <tr key={patient._id || index}>
                          <td
                            style={{ cursor: 'pointer', color: '#4f46e5' }}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowModal(true);
                            }}
                          >
                            {patient.name}
                          </td>
                          <td>{convertTo12Hour(patient.time)}</td>
                          <td>
                            <span
                              className={`status ${patient.fees.toLowerCase()}`}
                            >
                              {patient.fees}
                              {patient.fees === 'UNPAID' && patient.amount && ` (₹${patient.amount})`}
                            </span>
                          </td>
                          <td>{patient.doctor}</td>
                          <td>{patient.treatment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => window.location.reload()}>
          <div className="logo">T</div>
          <div className="hospital-name">
            Welcome
            <br />
            <span>Tara Hospital</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li
              className={currentView === "dashboard" ? "active" : ""}
              onClick={() => handleNavigation("dashboard")}
            >
              Dashboard
            </li>
            <li
              className={currentView === "patients" ? "active" : ""}
              onClick={() => handleNavigation("patients")}
            >
              Patients
            </li>
            <li
              className={currentView === "employees" ? "active" : ""}
              onClick={() => handleNavigation("employees")}
            >
              Employees
            </li>
            <li
              className={currentView === "pharmacy" ? "active" : ""}
              onClick={() => handleNavigation("pharmacy")}
            >
              Pharmacy
            </li>
            <li
              className={currentView === "availability" ? "active" : ""}
              onClick={() => handleNavigation("availability")}
            >
              Availability
            </li>
          </ul>
        </nav>
        <button
          className="lock-button"
          onClick={handleLogout}
          title="Lock / Logout"
        >
          <span role="img" aria-label="lock">
            🔒
          </span>
        </button>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <h1>Dashboard</h1>
        </header>
        <section className="dashboard-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => handleTabChange("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => handleTabChange("patients")}
          >
            Pending
          </button>
        </section>
        <section className="dashboard-cards">
          <div className="card">
            Beds Available
            <br />
            <span className="card-value">{availableBeds}</span>
          </div>
          <button className="download-report" onClick={handleDownloadReport}>
            Download Report
          </button>
        </section>
        <section className="dashboard-main">{renderDashboardContent()}</section>
      </main>

      {/* Patient Info Modal */}
      {showModal && selectedPatient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Patient Information</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div>
                <strong>Name:</strong> {selectedPatient.name}
              </div>
              <div>
                <strong>Date:</strong> {selectedPatient.date ? new Date(selectedPatient.date).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <strong>Time:</strong> {convertTo12Hour(selectedPatient.time)}
              </div>
              <div>
                <strong>Fees Status:</strong>
                <span style={{
                  color: selectedPatient.fees === 'PAID' ? '#10b981' : '#ef4444',
                  fontWeight: 'bold'
                }}>
                  {selectedPatient.fees}
                  {selectedPatient.fees === 'UNPAID' && selectedPatient.amount && ` (₹${selectedPatient.amount})`}
                </span>
              </div>
              {selectedPatient.fees === 'PAID' && selectedPatient.receivedBy && (
                <div>
                  <strong>Received By:</strong> {selectedPatient.receivedBy}
                </div>
              )}
              <div>
                <strong>Doctor:</strong> {selectedPatient.doctor}
              </div>
              <div>
                <strong>Treatment:</strong> {selectedPatient.treatment}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
