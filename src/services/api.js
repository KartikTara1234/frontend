const API_BASE_URL = "https://backend-i05v.onrender.com/api";

// Helper function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to set auth token in localStorage
const setAuthToken = (token) => {
  localStorage.setItem("token", token);
};

// Helper function to remove auth token from localStorage
const removeAuthToken = () => {
  localStorage.removeItem("token");
};

// Helper function to make API calls with authentication
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired or invalid
      removeAuthToken();
      window.location.href = "/";
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Something went wrong");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await apiCall("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    return response;
  },

  logout: () => {
    removeAuthToken();
  },

  getProfile: async () => {
    return await apiCall("/auth/profile");
  },
};

// Patients API calls
export const patientsAPI = {
  getAll: async () => {
    return await apiCall("/patients");
  },

  getUnpaid: async () => {
    return await apiCall("/patients/unpaid");
  },

  create: async (patientData, medications = []) => {
    return await apiCall("/patients", {
      method: "POST",
      body: JSON.stringify({ ...patientData, medications }),
    });
  },

  update: async (id, patientData) => {
    return await apiCall(`/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(patientData),
    });
  },

  delete: async (id) => {
    return await apiCall(`/patients/${id}`, {
      method: "DELETE",
    });
  },

  assignMedications: async (id, medications) => {
    return await apiCall(`/patients/${id}/medications`, {
      method: "PUT",
      body: JSON.stringify({ medications }),
    });
  },
};

// Employees API calls
export const employeesAPI = {
  getAll: async () => {
    return await apiCall("/employees");
  },

  create: async (employeeData) => {
    return await apiCall("/employees", {
      method: "POST",
      body: JSON.stringify(employeeData),
    });
  },

  update: async (id, employeeData) => {
    return await apiCall(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employeeData),
    });
  },

  delete: async (id) => {
    return await apiCall(`/employees/${id}`, {
      method: "DELETE",
    });
  },
};

// Pharmacy API calls
export const pharmacyAPI = {
  getAll: async () => {
    return await apiCall("/pharmacy");
  },

  create: async (medicineData) => {
    return await apiCall("/pharmacy", {
      method: "POST",
      body: JSON.stringify(medicineData),
    });
  },

  update: async (id, medicineData) => {
    return await apiCall(`/pharmacy/${id}`, {
      method: "PUT",
      body: JSON.stringify(medicineData),
    });
  },

  delete: async (id) => {
    return await apiCall(`/pharmacy/${id}`, {
      method: "DELETE",
    });
  },

  getLowStock: async () => {
    return await apiCall("/pharmacy/low-stock");
  },

  getExpiring: async () => {
    return await apiCall("/pharmacy/expiring");
  },
};

// Beds API calls
export const bedsAPI = {
  initialize: async () => {
    return await apiCall("/beds/initialize", {
      method: "POST",
    });
  },

  getAll: async () => {
    return await apiCall("/beds");
  },

  getAvailable: async () => {
    return await apiCall("/beds/available");
  },

  getBooked: async () => {
    return await apiCall("/beds/booked");
  },

  book: async (id, bookingData) => {
    return await apiCall(`/beds/${id}/book`, {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  },

  unbook: async (id) => {
    return await apiCall(`/beds/${id}/unbook`, {
      method: "POST",
    });
  },

  getStats: async () => {
    return await apiCall("/beds/stats");
  },
};
