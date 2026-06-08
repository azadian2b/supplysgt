import React, { useEffect, useState } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import DataInspector from '../utils/DataInspector';
import { isPlatformAdminAttributes } from '../utils/adminUtils';
import './Pages.css';

function Admin() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAdminState = async () => {
      try {
        const attributes = await fetchUserAttributes();
        if (!cancelled) {
          setIsAdmin(isPlatformAdminAttributes(attributes));
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        if (!cancelled) {
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAdminState();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="loading">Checking admin access...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1>Admin Tools</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="page-container admin-tools-page">
      <h1>Admin Tools</h1>
      <p className="page-intro">
        Diagnostics and data repair utilities live here so normal profile setup stays focused.
      </p>
      <DataInspector />
    </div>
  );
}

export default Admin;
