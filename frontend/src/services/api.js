const API_BASE_URL = "http://127.0.0.1:8000";

function handleResponseError(response, errorData) {
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
  }

  const error = new Error(
    errorData.detail || `Request failed: ${response.status}`
  );
  error.status = response.status;
  return error;
}

const api = {
  get: async (url) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleResponseError(response, errorData);
    }

    return {
      data: await response.json(),
    };
  },

  post: async (url, body) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleResponseError(response, errorData);
    }

    return {
      data: await response.json(),
    };
  },

  put: async (url, body) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleResponseError(response, errorData);
    }

    return { data: await response.json() };
  },

  upload: async (url, formData) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleResponseError(response, errorData);
    }
    return { data: await response.json() };
  },

  openDocument: async (url) => {
    const openedWindow = window.open("about:blank", "_blank");
    if (!openedWindow) {
      throw new Error("Allow pop-ups to view this document.");
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw handleResponseError(response, errorData);
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      openedWindow.location.replace(blobUrl);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      openedWindow.close();
      throw error;
    }
    return openedWindow;
  },

  getDocumentBlob: async (url) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw handleResponseError(response, errorData);
    }
    return {
      blob: await response.blob(),
      contentType: response.headers.get("content-type") || "application/octet-stream",
    };
  },
};

export default api;