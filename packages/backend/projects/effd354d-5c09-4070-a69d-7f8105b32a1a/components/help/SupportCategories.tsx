import { Book, Video, Certificate, Settings } from 'lucide-react'
const categories = [
  {
    title: 'Course Access',
    icon: Book,
    description: 'Help with accessing your enrolled courses'
  },
  {
    title: 'Video Playback',
    icon: Video,
    description: 'Troubleshoot video streaming issues'
  },
  {
    title: 'Certificates',
    icon: Certificate,
    description: 'Questions about course certificates'
  },
  {
    title: 'Account Settings',
    icon: Settings,
    description: 'Managing your account preferences'
  }
]
export default function SupportCategories() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Support Categories</h2>
      <div className="space-y-4">
        {categories.map((category, index) => {
          const Icon = category.icon
          return (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">{category.title}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">{category.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}