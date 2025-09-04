'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SaveTemplateAsProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  templateId: string;
  onSaveAsProject: (projectName: string) => Promise<void>;
}

export default function SaveTemplateAsProjectModal({
  isOpen,
  onClose,
  templateName,
  templateId,
  onSaveAsProject,
}: SaveTemplateAsProjectModalProps) {
  const [projectName, setProjectName] = useState(templateName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update project name when template name changes
  useEffect(() => {
    setProjectName(templateName);
  }, [templateName]);

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSaveAsProject(projectName.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Save Template as Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-300 mb-3">
            You're viewing a template. To access features like AI Assistant, collaboration, and terminal, please save this template as a project.
          </p>
          
          <div className="bg-orange-600/20 border border-orange-600/30 rounded p-3 mb-4">
            <p className="text-orange-400 text-sm">
              <strong>Template:</strong> {templateName}
            </p>
          </div>

          <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Enter project name"
            disabled={isLoading}
          />
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-800"
            disabled={isLoading}
          >
            Continue with Template
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !projectName.trim()}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save as Project'}
          </button>
        </div>
      </div>
    </div>
  );
}