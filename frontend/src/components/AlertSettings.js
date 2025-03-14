// frontend/src/components/AlertSettings.js
import React, { useState } from 'react';
import { updateAlertSettings } from '../services/api';

function AlertSettings() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    pushNotifications: false,
    riskThreshold: 7,
    yieldThreshold: 5
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAlertSettings(settings);
      alert('Alert settings updated successfully');
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  };

  return (
    <div className="alert-settings">
      <h3>Alert Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="emailAlerts"
              checked={settings.emailAlerts}
              onChange={handleChange}
            />
            Email Alerts
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="pushNotifications"
              checked={settings.pushNotifications}
              onChange={handleChange}
            />
            Push Notifications
          </label>
        </div>
        <div className="form-group">
          <label>Risk Threshold (1-10)</label>
          <input
            type="number"
            name="riskThreshold"
            value={settings.riskThreshold}
            onChange={handleChange}
            min="1"
            max="10"
            step="1"
          />
        </div>
        <div className="form-group">
          <label>Yield Threshold (%)</label>
          <input
            type="number"
            name="yieldThreshold"
            value={settings.yieldThreshold}
            onChange={handleChange}
            min="0"
            step="0.1"
          />
        </div>
        <button type="submit" className="save-button">Save Settings</button>
      </form>
    </div>
  );
}

export default AlertSettings;