import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then((me) => {
      setFullName(me.full_name);
      setLoading(false);
    });
  }, []);

  async function saveName() {
    try {
      await api.updateMe({ full_name: fullName });
      await refreshUser();
      showToast("Name saved.");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function saveExtended() {
    try {
      await api.updateMyProfile({ phone, department, designation });
      showToast("Profile details saved.");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  if (loading) return <div className="loading-text">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Your account details, visible to reviewers and administrators.</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 420 }}>
        <div className="field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={user?.email || ""} disabled />
        </div>
        <div className="field">
          <label>Role</label>
          <input value={user?.role || ""} disabled />
        </div>
        <button className="btn btn-primary" onClick={saveName}>Save name</button>
      </div>

      <h3 style={{ marginTop: 28, marginBottom: 14 }}>Additional details</h3>
      <div className="form-card" style={{ maxWidth: 420 }}>
        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>Department</label>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className="field">
          <label>Designation</label>
          <input value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={saveExtended}>Save details</button>
      </div>
    </div>
  );
}
