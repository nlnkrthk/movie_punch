import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/ServerWakeup.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

const ServerWakeup = () => {
  const [status, setStatus] = useState('pinging');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Only show the popup if the server takes longer than 1.5 seconds to respond
    const popupTimer = setTimeout(() => {
      if (isMounted && status === 'pinging') {
        setShowPopup(true);
      }
    }, 1500);

    const pingServer = async () => {
      let retries = 5;
      while (retries > 0 && isMounted) {
        try {
          // Send a ping to the root endpoint
          const res = await axios.get(`${API_BASE}/`, { timeout: 15000 });
          if (res.status === 200) {
            if (isMounted) {
              setStatus('awake');
              // Keep the 'connected' message visible for 2 seconds before hiding
              setTimeout(() => {
                if (isMounted) {
                  setShowPopup(false);
                }
              }, 2000);
            }
            return;
          }
        } catch (error) {
          // If we fail, wait for 3 seconds and try again.
          // Render might take up to 50 seconds to wake up the server.
          await new Promise(resolve => setTimeout(resolve, 3000));
          retries--;
        }
      }
      
      if (isMounted) {
        setStatus('error');
      }
    };

    pingServer();

    return () => {
      isMounted = false;
      clearTimeout(popupTimer);
    };
  }, []); // Remove `status` from dependency array so pingServer only runs once on mount.

  if (!showPopup) return null;

  return (
    <div className="server-wakeup-overlay">
      <div className={`server-wakeup-popup ${status}`}>
        {status === 'pinging' && <div className="wakeup-spinner"></div>}
        {status === 'error' && <div className="wakeup-error-icon">!</div>}
        {status === 'awake' && <div className="wakeup-success-icon">✓</div>}
        <div className="wakeup-text">
          {status === 'pinging' ? (
            <>
              <h3>Connecting to server...</h3>
              <p>Hang tight!</p>
            </>
          ) : status === 'awake' ? (
            <>
              <h3>Connected</h3>
              <p>Backend is fully online. Enjoy!</p>
            </>
          ) : status === 'error' ? (
            <>
              <h3>Backend timeout</h3>
              <p>Failed to wake up the server. Please try refreshing.</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ServerWakeup;
