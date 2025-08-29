'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  ArrowRight,
  UserPlus 
} from 'lucide-react';

interface InvitationData {
  id: string;
  project: {
    id: string;
    name: string;
    description: string;
  } | null;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  token: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, httpClient } = useAuth();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    if (user) {
      fetchInvitationDetails();
    }
  }, [user, token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get('/api/invitations/my-invitations');
      
      if (response.success) {
        const matchingInvitation = response.data.invitations.find(
          (inv: InvitationData) => inv.token === token
        );
        
        if (matchingInvitation) {
          setInvitation(matchingInvitation);
        } else {
          setError('Invitation not found or has expired');
        }
      } else {
        setError('Failed to load invitation details');
      }
    } catch (err) {
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await httpClient.post(`/api/invitations/accept/${token}`);

      if (response.success) {
        setSuccess('Invitation accepted! Redirecting to project...');
        
        // Redirect to project after 2 seconds
        setTimeout(() => {
          router.push(`/workspace?project=${response.data.projectId}`);
        }, 2000);
      } else {
        setError(response.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const declineInvitation = async () => {
    if (!confirm('Are you sure you want to decline this invitation?')) return;

    try {
      setProcessing(true);
      setError(null);

      const response = await httpClient.post(`/api/invitations/decline/${token}`);

      if (response.success) {
        setSuccess('Invitation declined');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/workspace');
        }, 2000);
      } else {
        setError(response.error || 'Failed to decline invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access to project settings and members';
      case 'editor': return 'Can edit files and collaborate on the project';
      case 'viewer': return 'Can view the project but not make changes';
      default: return 'Project access';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Mail className="w-16 h-16 text-teal-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Project Invitation</h1>
            <p className="text-gray-300 mb-6">
              You need to be logged in to view this invitation.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-medium text-white mb-2">Loading Invitation</h1>
            <p className="text-gray-400">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Invitation</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => router.push('/workspace')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Success!</h1>
            <p className="text-gray-300 mb-6">{success}</p>
            <div className="flex items-center justify-center text-teal-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation || !invitation.project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Invitation Not Found</h1>
            <p className="text-gray-300 mb-6">
              This invitation may have expired or is no longer valid.
            </p>
            <button
              onClick={() => router.push('/workspace')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
          <p className="text-gray-400">You've been invited to collaborate on a project</p>
        </div>

        {/* Project Details */}
        <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white mb-2">{invitation.project.name}</h2>
              {invitation.project.description && (
                <p className="text-gray-300 mb-4">{invitation.project.description}</p>
              )}
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">Your role:</span>
                <span className={`px-3 py-1 text-xs font-medium border rounded-full ${getRoleBadgeColor(invitation.role)}`}>
                  {invitation.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{getRoleDescription(invitation.role)}</p>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-300">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={acceptInvitation}
            disabled={processing}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Accept Invitation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            onClick={declineInvitation}
            disabled={processing}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Decline</span>
          </button>
        </div>

        {/* Support Text */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <p className="text-xs text-gray-500 text-center">
            By accepting this invitation, you'll gain access to the project and be able to collaborate with the team.
          </p>
        </div>
      </div>
    </div>
  );
}