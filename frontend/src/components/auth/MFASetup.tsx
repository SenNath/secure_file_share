import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../hooks/useAuth';
import { Button, TextField, Box, Typography, Paper, Alert, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface MFASetupProps {
  email: string;
  onComplete?: () => void;
}

export const MFASetup = ({ email, onComplete }: MFASetupProps) => {
  const { enableMFA, verifyMFA } = useAuth();
  const [qrUri, setQrUri] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSetupStarted, setIsSetupStarted] = useState(false);

  useEffect(() => {
    const setupMFA = async () => {
      try {
        const response = await enableMFA(email);
        setQrUri(response.qr_uri);
        setBackupCodes(response.backup_codes);
        setIsSetupStarted(true);
      } catch (error) {
        console.error('Failed to setup MFA:', error);
        setError((error as Error).message);
      }
    };
    setupMFA();
  }, [email]);

  const handleVerifyCode = async () => {
    try {
      setError('');
      await verifyMFA(email, verificationCode);
      setSuccess('MFA has been successfully enabled!');
      setIsSetupStarted(false);
      onComplete?.();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Backup codes copied to clipboard!');
  };

  if (!isSetupStarted) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Multi-Factor Authentication
          </Typography>
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => enableMFA(email)}
          >
            Enable MFA
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Set up Multi-Factor Authentication
        </Typography>
        
        {error && (
          <Snackbar 
            open={!!error} 
            autoHideDuration={6000} 
            onClose={() => setError('')}
          >
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </Snackbar>
        )}
        {success && (
          <Snackbar 
            open={!!success} 
            autoHideDuration={6000} 
            onClose={() => setSuccess('')}
          >
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </Snackbar>
        )}

        <Typography variant="body2" sx={{ mb: 2 }}>
          1. Scan this QR code with your authenticator app:
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          {qrUri && <QRCodeSVG value={qrUri} size={200} />}
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          2. Enter the verification code from your authenticator app:
        </Typography>
        
        <TextField
          fullWidth
          value={verificationCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVerificationCode(e.target.value)}
          placeholder="Enter verification code"
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleVerifyCode}
          sx={{ mb: 3 }}
        >
          Verify Code
        </Button>

        <Typography variant="body2" sx={{ mb: 2 }}>
          3. Save these backup codes in a secure location:
        </Typography>
        
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: '#f5f5f5',
            fontFamily: 'monospace',
          }}
        >
          {backupCodes.map((code, index) => (
            <Typography key={index} variant="body2">
              {code}
            </Typography>
          ))}
        </Paper>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<ContentCopyIcon />}
          onClick={copyBackupCodes}
        >
          Copy Backup Codes
        </Button>
      </Paper>
    </Box>
  );
};

export default MFASetup; 