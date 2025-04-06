// src/components/ConnectionStatus.js
import React, { useState, useEffect } from 'react';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      // Masquer après 3 secondes
      setTimeout(() => setShowStatus(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showStatus) return null;
  
  return (
    <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline 
        ? 'Vous êtes de nouveau en ligne. Synchronisation en cours...' 
        : 'Vous êtes hors ligne. Vos modifications seront synchronisées dès que vous serez reconnecté.'
      }
    </div>
  );
};

export default ConnectionStatus;