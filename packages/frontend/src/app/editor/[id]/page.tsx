'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProjectEditorPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { httpClient, isAuthenticated, user } = useAuth();
  const identifier = params.id as string;
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Wait for authentication to be determined
    if (!isAuthenticated && isAuthenticated !== false) {
      console.log('⏳ Authentication status pending...');
      return;
    }

    // Don't attempt to load if not authenticated
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login');
      setError('Please log in to access this project');
      setTimeout(() => router.replace('/login'), 1000);
      return;
    }

    if (!httpClient) {
      console.log('⏳ HTTP client not available yet, waiting...');
      return;
    }

    if (!user?.id) {
      console.log('⏳ User data not loaded yet, waiting...');
      return;
    }

    const loadProject = async () => {
      try {
        console.log('🔍 Loading project with identifier:', identifier);
        console.log('👤 User authenticated:', isAuthenticated, user?.email);
        
        setError('');
        
        // Validate identifier format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        const isSlug = /^[a-z0-9-]+$/.test(identifier);
        
        console.log('📝 Identifier analysis:', { identifier, isUUID, isSlug });
        
        if (!isUUID && !isSlug) {
          throw new Error('Invalid project identifier format');
        }
        
        // Test auth with user projects endpoint first
        console.log('🔑 Testing authentication with user projects...');
        try {
          const authTest = await httpClient.get('/api/projects/my');
          console.log('✅ Auth test successful:', authTest?.data?.success);
        } catch (authError: any) {
          console.error('❌ Auth test failed:', authError?.response?.status, authError?.response?.data);
          throw new Error(`Authentication failed: ${authError?.response?.data?.error || 'Unknown auth error'}`);
        }
        
        // Fetch project data by slug or ID
        console.log('📡 Making API call to:', `/api/projects/${identifier}`);
        let response = await httpClient.get(`/api/projects/${identifier}`);
        
        console.log('✅ API Response received:', response);
        console.log('📋 Response data structure:', {
          hasData: !!response?.data,
          success: response?.data?.success,
          hasProject: !!response?.data?.data?.project,
          errorMessage: response?.data?.error
        });
        
        // If direct lookup failed with 404, fall back to user's projects
        if (!response?.success && (response as any)?.error?.includes?.('404')) {
          try {
            console.log('🔎 Direct lookup 404. Falling back to /api/projects/my search...');
            const myProjectsRes = await httpClient.get('/api/projects/my');
            if (myProjectsRes?.success && (myProjectsRes as any)?.data?.projects) {
              const list = (myProjectsRes as any).data.projects as any[];
              const found = list.find(p => p.id === identifier || p.slug === identifier);
              if (found) {
                console.log('✅ Found project via /my fallback:', { id: found.id, slug: found.slug });
                response = { success: true, data: { project: found } } as any;
              }
            }
          } catch (fallbackErr) {
            console.warn('Fallback /my search failed:', fallbackErr);
          }
        }

        if (response?.data?.success && response?.data?.data?.project || (response as any)?.success && (response as any)?.data?.project) {
          const project = (response as any)?.data?.data?.project || (response as any)?.data?.project;
          console.log('🎉 Project loaded successfully:', {
            id: project.id,
            name: project.name,
            slug: project.slug,
            hasFiles: !!project.files
          });
          
          // Ensure project has necessary data for editor
          if (!project.id || !project.name) {
            throw new Error('Project data incomplete');
          }
          
          // Redirect to main editor with comprehensive project data
          const projectParam = encodeURIComponent(JSON.stringify(project));
          const tabParam = searchParams.get('tab');
          const url = `/editor?project=${projectParam}&projectId=${encodeURIComponent(project.id)}${tabParam ? `&tab=${tabParam}` : ''}`;
          
          console.log('🚀 Redirecting to editor:', url.substring(0, 100) + '...');
          router.replace(url);
        } else {
          const errorMsg = response?.data?.error || 'Project not found or access denied';
          console.error('❌ Project not found:', errorMsg);
          
          // Try to provide helpful error context
          setError(`Unable to load project: ${errorMsg}`);
          setTimeout(() => router.replace('/workspace'), 3000);
        }
      } catch (error: any) {
        console.error('💥 Error loading project:', error);
        
        let errorMessage = 'Unknown error';
        let shouldRedirect = true;
        
        if (error?.response) {
          const status = error.response.status;
          const data = error.response.data;
          
          console.log('📊 HTTP Error details:', { status, data });
          
          if (status === 401) {
            errorMessage = 'Authentication required';
            setError('Please log in to access this project');
            router.replace('/login');
            shouldRedirect = false;
          } else if (status === 403) {
            errorMessage = 'Access forbidden';
            setError('You don\'t have permission to access this project');
          } else if (status === 404) {
            errorMessage = 'Project not found';
            setError('This project doesn\'t exist or has been deleted');
          } else {
            errorMessage = data?.error || `HTTP ${status} error`;
            setError(`Failed to load project: ${errorMessage}`);
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
          setError(`Error: ${errorMessage}`);
        } else {
          setError('An unexpected error occurred');
        }
        
        if (shouldRedirect) {
          setTimeout(() => {
            router.replace(`/workspace?error=project_load_failed&details=${encodeURIComponent(errorMessage)}`);
          }, 2000);
        }
      }
    };

    if (identifier) {
      loadProject();
    }
  }, [identifier, router, httpClient, searchParams, isAuthenticated, user]);

  // Show loading state or error
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => router.push('/workspace')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Workspace
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading project...</p>
            <p className="text-gray-500 text-sm mt-2">Project ID: {identifier}</p>
          </>
        )}
      </div>
    </div>
  );
}
