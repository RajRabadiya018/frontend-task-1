import React, { useState, useEffect } from 'react';
import encryptionService from '../services/encryptionService';

const EncryptionModal = ({ isOpen, onClose, onEncrypt, onDecrypt, mode = 'encrypt', noteTitle = '' }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'encrypt' && password) {
      const strength = encryptionService.checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [password, mode]);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setPasswordStrength(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      if (mode === 'encrypt') {
        // Validate passwords match
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsProcessing(false);
          return;
        }

        // Check password strength
        const strength = encryptionService.checkPasswordStrength(password);
        if (!strength.isValid) {
          setError('Password is too weak. ' + strength.feedback.join(', '));
          setIsProcessing(false);
          return;
        }

        await onEncrypt(password);
      } else {
        await onDecrypt(password);
      }

      onClose();
    } catch (error) {
      setError(error.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePassword = () => {
    const generated = encryptionService.generateSecurePassword(16);
    setPassword(generated);
    setConfirmPassword(generated);
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'weak': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'strong': return 'text-blue-600 bg-blue-100';
      case 'very strong': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === 'encrypt' ? 'Encrypt Note' : 'Decrypt Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {noteTitle && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Note: <span className="font-medium">{noteTitle}</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === 'encrypt' ? 'Create Password' : 'Enter Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder={mode === 'encrypt' ? 'Create a strong password' : 'Enter note password'}
                required
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isProcessing}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {mode === 'encrypt' && passwordStrength && (
            <div className="space-y-2">
              <div className={`px-3 py-2 rounded-lg text-sm ${getStrengthColor(passwordStrength.strength)}`}>
                Password strength: <span className="font-medium capitalize">{passwordStrength.strength}</span>
              </div>
              {passwordStrength.feedback.length > 0 && (
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      {feedback}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Confirm Password (Encrypt mode only) */}
          {mode === 'encrypt' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                required
                disabled={isProcessing}
              />
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          )}

          {/* Generate Password Button */}
          {mode === 'encrypt' && (
            <button
              type="button"
              onClick={generatePassword}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              disabled={isProcessing}
            >
              Generate Secure Password
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-xs">
              <strong>Security Notice:</strong> {mode === 'encrypt' 
                ? 'Make sure to remember your password. It cannot be recovered if lost.'
                : 'Enter the password you used to encrypt this note.'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isProcessing || (mode === 'encrypt' && (!passwordStrength?.isValid || password !== confirmPassword))}
            >
              {isProcessing && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {mode === 'encrypt' ? 'Encrypt Note' : 'Decrypt Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EncryptionModal;