'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import TokenStatusWidget from './TokenStatusWidget';

export default function SettingsView() {
  const { user, updateProfile, updateAvatar, changePassword, error, clearError, setTokens } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Photo upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Photo upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    setSuccessMessage('');
    setPhotoError('');
    clearError();

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const uploadUrl = `${apiUrl}/api/auth/profile/avatar`;
      console.log('Uploading to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('swistack_token')}`,
        },
        body: formData,
      });

      const result = await response.json();
      console.log('Avatar upload response:', result);

      if (!response.ok) {
        console.error('Upload failed with status:', response.status);
        throw new Error(result.error || 'Upload failed');
      }

      if (result.success) {
        console.log('Upload successful, result.data:', result.data);
        setSuccessMessage('Profile photo updated successfully!');
        
        // Update the user context with the new avatar URL
        if (result.data?.user?.avatar) {
          console.log('Updating avatar with user.avatar:', result.data.user.avatar.substring(0, 50) + '...');
          updateAvatar(result.data.user.avatar);
        } else if (result.data?.avatar) {
          console.log('Updating avatar with avatar:', result.data.avatar.substring(0, 50) + '...');
          updateAvatar(result.data.avatar);
        } else {
          console.error('No avatar found in response data');
        }
        
        // Clear the selected file and preview
        setSelectedFile(null);
        setPreviewUrl('');
        
        // Clean up the preview URL to free memory
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Upload failed',
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setPhotoError(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPhotoError('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    clearError();

    try {
      await updateProfile(profileForm);
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');
    clearError();

    try {
      await changePassword(passwordForm);
      setSuccessMessage('Password changed successfully! Please log in again.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      {/* Profile Photo Section */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Profile Photo</h3>
        <div className="flex items-start space-x-6">
          {/* Current/Preview Avatar */}
          <div className="relative">
            {previewUrl || user?.avatar ? (
              <img
                src={previewUrl || user?.avatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-600">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
            {previewUrl && (
              <button
                onClick={handleRemovePhoto}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
          
          {/* Upload Controls */}
          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo</span>
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              
              {selectedFile && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>
                    <button
                      onClick={handleRemovePhoto}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                Recommended: Square image, at least 400x400 pixels. Max size: 5MB.
              </p>
              
              {/* Photo Error Message */}
              {photoError && (
                <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-400">{photoError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      {/* Token Status Widget */}
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Authentication Status</h3>
        <TokenStatusWidget />
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 pr-10 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                  passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-teal-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || passwordForm.newPassword !== passwordForm.confirmPassword}
              className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Changing...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-white">Email Notifications</h4>
              <p className="text-sm text-gray-400">Receive important updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium text-white">Push Notifications</h4>
              <p className="text-sm text-gray-400">Receive real-time notifications in browser</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Theme Preferences</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800 rounded-lg">
            <h4 className="font-medium text-white mb-2">Color Theme</h4>
            <div className="grid grid-cols-3 gap-3">
              <button className="p-3 bg-gray-900 border-2 border-teal-500 rounded-lg text-center">
                <div className="w-full h-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded mb-2"></div>
                <span className="text-xs text-teal-400">Dark (Current)</span>
              </button>
              <button className="p-3 bg-gray-700 border-2 border-transparent hover:border-gray-500 rounded-lg text-center">
                <div className="w-full h-6 bg-gradient-to-r from-white to-gray-100 rounded mb-2"></div>
                <span className="text-xs text-gray-400">Light</span>
              </button>
              <button className="p-3 bg-gray-700 border-2 border-transparent hover:border-gray-500 rounded-lg text-center">
                <div className="w-full h-6 bg-gradient-to-r from-blue-900 to-purple-900 rounded mb-2"></div>
                <span className="text-xs text-gray-400">Auto</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account preferences and settings</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-teal-900/50 border border-teal-500 rounded-lg flex items-center space-x-3">
          <Check className="w-5 h-5 text-teal-400" />
          <p className="text-teal-400">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={clearError}
            className="ml-auto p-1 hover:bg-red-800 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-teal-500/20 border border-teal-500/30 text-teal-400'
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            {activeTab === 'profile' && renderProfileSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}