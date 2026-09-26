import React, { useState } from "react";

function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [decisionAlerts, setDecisionAlerts] = useState(true);
  const [activityUpdates, setActivityUpdates] = useState(false);

  return (
    <div className="settings-page">

      {/* PAGE HEADER */}
      <section className="settings-header">
        <div>
          <span className="settings-eyebrow">
            ACCOUNT SETTINGS
          </span>

          <h1>Settings</h1>

          <p>
            Manage your preferences, notifications and account experience.
          </p>
        </div>
      </section>


      {/* SETTINGS GRID */}
      <div className="settings-grid">

        {/* NOTIFICATIONS */}
        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-card-icon">
              🔔
            </div>

            <div>
              <h2>Notifications</h2>
              <p>
                Control how you receive platform updates.
              </p>
            </div>
          </div>


          <div className="settings-option">

            <div>
              <strong>Email notifications</strong>

              <span>
                Receive important account and platform updates.
              </span>
            </div>

            <button
              type="button"
              className={
                emailNotifications
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setEmailNotifications(!emailNotifications)
              }
              aria-label="Toggle email notifications"
            >
              <span />
            </button>

          </div>


          <div className="settings-option">

            <div>
              <strong>Decision alerts</strong>

              <span>
                Get notified about decision workflow changes.
              </span>
            </div>

            <button
              type="button"
              className={
                decisionAlerts
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setDecisionAlerts(!decisionAlerts)
              }
              aria-label="Toggle decision alerts"
            >
              <span />
            </button>

          </div>


          <div className="settings-option">

            <div>
              <strong>Activity updates</strong>

              <span>
                Receive updates about team and workspace activity.
              </span>
            </div>

            <button
              type="button"
              className={
                activityUpdates
                  ? "settings-toggle active"
                  : "settings-toggle"
              }
              onClick={() =>
                setActivityUpdates(!activityUpdates)
              }
              aria-label="Toggle activity updates"
            >
              <span />
            </button>

          </div>

        </section>


        {/* SECURITY */}
        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-card-icon">
              🔐
            </div>

            <div>
              <h2>Security</h2>
              <p>
                Review your account security information.
              </p>
            </div>
          </div>


          <div className="security-status">

            <div className="security-status-icon">
              ✓
            </div>

            <div>
              <strong>Session secured</strong>

              <span>
                Your account is protected using JWT authentication.
              </span>
            </div>

          </div>


          <div className="settings-info-row">
            <span>Authentication</span>
            <strong>JWT</strong>
          </div>

          <div className="settings-info-row">
            <span>Session status</span>
            <strong className="status-active">
              Active
            </strong>
          </div>

        </section>


        {/* APPEARANCE */}
        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-card-icon">
              🎨
            </div>

            <div>
              <h2>Appearance</h2>
              <p>
                Customize your workspace experience.
              </p>
            </div>
          </div>


          <div className="appearance-preview">

            <div className="appearance-preview-top">
              <span />
              <span />
              <span />
            </div>

            <div className="appearance-preview-body">

              <div className="preview-sidebar" />

              <div className="preview-content">
                <div />
                <div />
                <div />
              </div>

            </div>

          </div>


          <div className="theme-info">
            <div>
              <strong>Light workspace</strong>

              <span>
                Clean and professional interface
              </span>
            </div>

            <span className="theme-badge">
              Current
            </span>
          </div>

        </section>


        {/* ACCOUNT */}
        <section className="settings-card">

          <div className="settings-card-header">
            <div className="settings-card-icon">
              👤
            </div>

            <div>
              <h2>Account</h2>
              <p>
                Manage your account preferences.
              </p>
            </div>
          </div>


          <div className="account-action">

            <div>
              <strong>Profile information</strong>

              <span>
                Update your personal information from your profile.
              </span>
            </div>

            <span className="settings-arrow">
              →
            </span>

          </div>


          <div className="account-action">

            <div>
              <strong>Account status</strong>

              <span>
                Your account is currently active.
              </span>
            </div>

            <span className="account-active-badge">
              Active
            </span>

          </div>

        </section>

      </div>

    </div>
  );
}


export default Settings;