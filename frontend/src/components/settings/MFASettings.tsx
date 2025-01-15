import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Box, Typography, Button, Paper, Alert } from '@mui/material';
import { MFASetup } from '../auth/MFASetup';

export const MFASettings = () => {
  const { user, enableMFA, disableMFA } = useAuth();
  const [showSetup, setShowSetup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDisableMFA = async () => {
    try {
      await disableMFA();
      setSuccess('MFA has been disabled successfully');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    setSuccess('MFA has been enabled successfully');
  };

  if (showSetup) {
    return <MFASetup email={user?.email || ''} onComplete={handleSetupComplete} />;
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Multi-Factor Authentication
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Status: <strong>{user?.mfa_enabled ? 'Enabled' : 'Disabled'}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.mfa_enabled
            ? 'Your account is protected with multi-factor authentication.'
            : 'Enable multi-factor authentication to add an extra layer of security to your account.'}
        </Typography>
      </Box>

      {user?.mfa_enabled ? (
        <Button
          variant="outlined"
          color="error"
          onClick={handleDisableMFA}
        >
          Disable MFA
        </Button>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowSetup(true)}
        >
          Enable MFA
        </Button>
      )}
    </Paper>
  );
}; 