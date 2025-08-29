'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Sparkles,
  FileText,
  Code2,
  FolderPlus,
  CheckCircle,
  Loader2,
  Rocket,
  Brain,
  Wand2
} from 'lucide-react';

interface AIProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectDescription: string;
}

type CreationStep = 'analyzing' | 'planning' | 'scaffolding' | 'generating' | 'finalizing' | 'complete';

const CREATION_STEPS = {
  analyzing: {
    icon: Brain,
    title: 'Analyzing Requirements',
    description: 'Understanding your project description...',
    progress: 20
  },
  planning: {
    icon: FileText,
    title: 'Planning Architecture',
    description: 'Designing the project structure...',
    progress: 40
  },
  scaffolding: {
    icon: FolderPlus,
    title: 'Creating Structure',
    description: 'Setting up files and folders...',
    progress: 60
  },
  generating: {
    icon: Code2,
    title: 'Generating Code',
    description: 'Writing your application code...',
    progress: 80
  },
  finalizing: {
    icon: Wand2,
    title: 'Finalizing Setup',
    description: 'Installing dependencies and configuring...',
    progress: 95
  },
  complete: {
    icon: CheckCircle,
    title: 'Project Ready!',
    description: 'Your project has been created successfully',
    progress: 100
  }
};

export default function AIProjectCreationModal({
  isOpen,
  onClose,
  projectDescription
}: AIProjectCreationModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<CreationStep>('analyzing');
  const [isComplete, setIsComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');

  // Mock AI project creation process
  useEffect(() => {
    if (!isOpen) return;

    // Reset state when modal opens
    setCurrentStep('analyzing');
    setIsComplete(false);
    setRedirectCountdown(3);
    setGeneratedFiles([]);
    setProjectName('');

    // Generate mock project name from description
    const mockProjectName = generateProjectName(projectDescription);
    setProjectName(mockProjectName);

    // Simulate AI creation process
    const stepSequence: CreationStep[] = ['analyzing', 'planning', 'scaffolding', 'generating', 'finalizing', 'complete'];
    let stepIndex = 0;

    const progressInterval = setInterval(() => {
      if (stepIndex < stepSequence.length - 1) {
        stepIndex++;
        setCurrentStep(stepSequence[stepIndex]);
        
        // Add mock files being generated
        if (stepSequence[stepIndex] === 'scaffolding') {
          setGeneratedFiles(['package.json', 'src/', 'public/', '.gitignore']);
        } else if (stepSequence[stepIndex] === 'generating') {
          setGeneratedFiles(prev => [...prev, 'src/App.tsx', 'src/index.tsx', 'src/components/', 'src/styles/']);
        }
      } else {
        setIsComplete(true);
        clearInterval(progressInterval);
      }
    }, 1500); // Each step takes 1.5 seconds

    return () => clearInterval(progressInterval);
  }, [isOpen, projectDescription]);

  // Countdown and redirect when complete
  useEffect(() => {
    if (!isComplete) return;

    const countdownInterval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Redirect to editor with project data
          const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const projectData = {
            name: projectName,
            slug: projectSlug,
            description: projectDescription,
            language: 'JavaScript',
            template: 'ai-generated',
            createdBy: 'ai'
          };
          router.push(`/editor?project=${encodeURIComponent(JSON.stringify(projectData))}`);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isComplete, projectName, router, onClose]);

  const generateProjectName = (description: string): string => {
    // Mock AI-generated project name based on description
    const keywords = description.toLowerCase().match(/\b(app|website|api|service|tool|game|platform|system|dashboard|blog|shop|chat|social|todo|music|photo|video|news|weather|fitness|food|travel|education|finance|health|productivity|entertainment)\b/g);
    
    if (keywords && keywords.length > 0) {
      const mainKeyword = keywords[0];
      const variations = {
        'app': 'Smart App',
        'website': 'Modern Website',
        'api': 'REST API',
        'tool': 'Developer Tool',
        'dashboard': 'Analytics Dashboard',
        'todo': 'Task Manager',
        'chat': 'Chat Application',
        'shop': 'E-commerce Store',
        'blog': 'Blog Platform'
      };
      return variations[mainKeyword as keyof typeof variations] || 'AI Generated Project';
    }
    
    return 'AI Generated Project';
  };

  const getCurrentStepInfo = () => CREATION_STEPS[currentStep];

  if (!isOpen) return null;

  const stepInfo = getCurrentStepInfo();
  const StepIcon = stepInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Project Creation</h2>
              <p className="text-sm text-gray-400">Creating your project...</p>
            </div>
          </div>
          {!isComplete && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Project Name */}
          {projectName && (
            <div className="mb-6 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">Project Name</p>
              <h3 className="text-lg font-medium text-white">{projectName}</h3>
            </div>
          )}

          {/* Current Step */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isComplete ? 'bg-green-600/20' : 'bg-teal-600/20'
              }`}>
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <StepIcon className="w-5 h-5 text-teal-400 animate-pulse" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-white">{stepInfo.title}</h3>
                <p className="text-sm text-gray-400">{stepInfo.description}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isComplete ? 'bg-green-500' : 'bg-teal-500'
                }`}
                style={{ width: `${stepInfo.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-right">{stepInfo.progress}%</p>
          </div>

          {/* Generated Files (when available) */}
          {generatedFiles.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Generated Files</h4>
              <div className="space-y-1">
                {generatedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span>{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Project Created Successfully!</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Redirecting to your project editor in {redirectCountdown} seconds...
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Opening editor...</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading State (when not complete) */}
          {!isComplete && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is working on your project...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}