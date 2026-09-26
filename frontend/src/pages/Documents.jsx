import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const Documents = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const decisionResponse = await api.get("/decisions/");
      const decisionList = decisionResponse.data || [];

      setDecisions(decisionList);

      const documentResults = [];

      for (const decision of decisionList) {
        try {
          const response = await api.get(
            `/decisions/${decision.id}/files/`
          );

          const files = response.data || [];

          files.forEach((file) => {
            documentResults.push({
              ...file,
              decision_title: decision.title,
              decision_id: decision.id,
            });
          });
        } catch (err) {
          console.error(
            `Failed to load files for decision ${decision.id}`,
            err
          );
        }
      }

      documentResults.sort(
        (a, b) =>
          new Date(b.uploaded_at) -
          new Date(a.uploaded_at)
      );

      setDocuments(documentResults);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load documents."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(
    (document) => {
      const searchText = search.toLowerCase();

      return (
        document.file_name
          ?.toLowerCase()
          .includes(searchText) ||
        document.decision_title
          ?.toLowerCase()
          .includes(searchText) ||
        document.file_type
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getFileExtension = (fileName) => {
    if (!fileName || !fileName.includes(".")) {
      return "FILE";
    }

    return fileName
      .split(".")
      .pop()
      .toUpperCase();
  };

  const handleDownload = async (document) => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        `http://127.0.0.1:8000/decisions/${document.decision_id}/files/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to download the document."
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");

      link.href = url;
      link.download = document.file_name;

      window.document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.message ||
          "Unable to download document."
      );
    }
  };

  return (
    <div className="page-container documents-page">

      {/* HEADER */}
      <div className="documents-header">
        <div>
          <div className="documents-eyebrow">
            DOCUMENT MANAGEMENT
          </div>

          <h1>Documents</h1>

          <p>
            Access and manage documents connected
            to your decisions.
          </p>
        </div>

        <div className="documents-count-card">
          <strong>{documents.length}</strong>
          <span>Total Documents</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="documents-toolbar">

        <div className="documents-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search documents or decisions..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="documents-summary">
          {decisions.length} decisions
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="documents-empty">
          <div className="documents-empty-icon">
            ◌
          </div>

          <h3>Loading documents...</h3>

          <p>
            Fetching documents from your decisions.
          </p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="documents-empty">

          <div className="documents-empty-icon">
            📄
          </div>

          <h3>
            {search
              ? "No documents found"
              : "No documents yet"}
          </h3>

          <p>
            {search
              ? "Try another search term."
              : "Upload supporting files from a decision details page."}
          </p>

          {!search && decisions.length > 0 && (
            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  `/decisions/${decisions[0].id}`
                )
              }
            >
              Open a Decision
            </button>
          )}
        </div>
      ) : (
        <div className="documents-list">

          {filteredDocuments.map(
            (document) => (
              <div
                className="document-card"
                key={`${document.decision_id}-${document.id}`}
              >

                <div className="document-file-icon">
                  {getFileExtension(
                    document.file_name
                  )}
                </div>

                <div className="document-main">

                  <div className="document-top-row">

                    <div>
                      <h3>
                        {document.file_name}
                      </h3>

                      <div className="document-meta">
                        <span>
                          {document.file_type ||
                            "Unknown type"}
                        </span>

                        <span>•</span>

                        <span>
                          Uploaded{" "}
                          {formatDate(
                            document.uploaded_at
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      className="document-download-button"
                      onClick={() =>
                        handleDownload(
                          document
                        )
                      }
                    >
                      ↓ Download
                    </button>
                  </div>

                  <div className="document-decision-row">

                    <div>
                      <span>
                        CONNECTED DECISION
                      </span>

                      <strong>
                        {document.decision_title}
                      </strong>
                    </div>

                    <button
                      className="document-view-button"
                      onClick={() =>
                        navigate(
                          `/decisions/${document.decision_id}`
                        )
                      }
                    >
                      View Decision →
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
};

export default Documents;