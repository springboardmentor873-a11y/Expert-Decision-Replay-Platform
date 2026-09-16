import api from '../api/client';

/**
 * Downloads a file or report from an authenticated endpoint by requesting a blob,
 * creating an object URL, and triggering a native browser download with proper headers.
 *
 * @param {string} url - API endpoint to fetch file from (e.g. '/reports/decision/xyz/pdf')
 * @param {string} fallbackFilename - Default filename to use if Content-Disposition header is absent
 */
export const downloadFile = async (url, fallbackFilename = 'downloaded_file') => {
  try {
    const res = await api.get(url, {
      responseType: 'blob',
    });

    // Check if the response is actually an error json wrapped as blob
    if (res.data.type === 'application/json') {
      const text = await res.data.text();
      try {
        const json = JSON.parse(text);
        alert(json.message || json.detail || 'Download failed.');
        return;
      } catch (e) {
        // Not JSON
      }
    }

    let filename = fallbackFilename;
    const disposition = res.headers['content-disposition'] || res.headers['Content-Disposition'];
    if (disposition) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    const blob = new Blob([res.data], {
      type: res.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Download error:', err);
    let errMsg = 'Failed to download file. Please check permissions or network connectivity.';
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        errMsg = json.message || json.detail || errMsg;
      } catch (e) {
        // Keep default error message
      }
    } else if (err.response?.data?.message || err.response?.data?.detail) {
      errMsg = err.response.data.message || err.response.data.detail;
    }
    alert(errMsg);
  }
};
