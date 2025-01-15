import React, { useState } from 'react';
import { TextField, Box, Typography, Paper, Alert, Button } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';

interface MFAVerificationProps {
  email: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({ email, onSuccess, onCancel }) => {
  const { verifyMFA } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string>('');

  const handleVerify = async () => {
    try {
      setError('');
      await verifyMFA(email, verificationCode);
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Two-Factor Authentication
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ mb: 2 }}>
          Enter the verification code from your authenticator app:
        </Typography>
        
        <TextField
          fullWidth
          value={verificationCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
          placeholder="Enter verification code"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleVerify}
          >
            Verify
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={onCancel}
          >
            Cancel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default MFAVerification; 