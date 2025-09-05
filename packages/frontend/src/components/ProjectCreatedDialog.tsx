import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckCircle, FolderOpen } from 'lucide-react';

interface ProjectCreatedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onOpenProject?: () => void;
}

export default function ProjectCreatedDialog({ 
  isOpen, 
  onClose, 
  projectName,
  onOpenProject 
}: ProjectCreatedDialogProps) {
  const handleOpenProject = () => {
    onOpenProject?.();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100"
                    >
                      Project Created Successfully!
                    </Dialog.Title>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your project "<span className="font-semibold text-gray-700 dark:text-gray-300">{projectName}</span>" has been created and saved in your repositories.
                  </p>
                </div>

                <div className="flex space-x-3 justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    onClick={onClose}
                  >
                    Close
                  </button>
                  {onOpenProject && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 space-x-2"
                      onClick={handleOpenProject}
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Open Project</span>
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}