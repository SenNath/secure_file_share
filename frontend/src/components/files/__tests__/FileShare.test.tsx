import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FileShareDialog } from '../FileShare';
import { useSharing } from '../../../hooks/useSharing';
import { useToast } from '../../../hooks/use-toast';

// Mock the hooks
jest.mock('../../../hooks/useSharing');
jest.mock('../../../hooks/use-toast');

describe('FileShareDialog', () => {
  const mockShareFile = jest.fn();
  const mockCreateShareLink = jest.fn();
  const mockToast = jest.fn();
  const mockFile = {
    id: '123',
    name: 'test.txt',
    size: 1000,
    mime_type: 'text/plain'
  };

  beforeEach(() => {
    (useSharing as jest.Mock).mockReturnValue({
      shareFile: mockShareFile,
      createShareLink: mockCreateShareLink,
      loading: false
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders share dialog correctly', () => {
    render(<FileShareDialog isOpen={true} onClose={() => {}} onShare={() => Promise.resolve()} />);
    expect(screen.getByText('Share File')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('handles successful file share', async () => {
    const mockOnShare = jest.fn().mockResolvedValue(undefined);
    render(<FileShareDialog isOpen={true} onClose={() => {}} onShare={mockOnShare} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Access Level'), {
      target: { value: 'VIEW' }
    });
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => {
      expect(mockOnShare).toHaveBeenCalledWith({
        shared_with_email: 'test@example.com',
        access_level: 'VIEW',
        notes: undefined
      });
    });
  });

  it('validates email input', async () => {
    const mockOnShare = jest.fn();
    render(<FileShareDialog isOpen={true} onClose={() => {}} onShare={mockOnShare} />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'invalid-email' }
    });
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    expect(mockOnShare).not.toHaveBeenCalled();
  });
}); 