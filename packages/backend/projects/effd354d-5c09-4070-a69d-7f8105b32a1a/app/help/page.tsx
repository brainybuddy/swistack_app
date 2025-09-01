import { LifeBuoy, Book, MessageCircle, Phone } from 'lucide-react';
export default function HelpPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Help & Support</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Book className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Documentation</h2>
          </div>
          <p className="text-gray-600 mb-4">Browse our detailed documentation to learn more about our platform features.</p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">View Documentation →</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">FAQs</h2>
          </div>
          <p className="text-gray-600 mb-4">Find answers to commonly asked questions about our services.</p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">View FAQs →</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <LifeBuoy className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Support Center</h2>
          </div>
          <p className="text-gray-600 mb-4">Get help from our support team for any technical issues.</p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact Support →</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-4">
            <Phone className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold">Contact Us</h2>
          </div>
          <p className="text-gray-600 mb-4">Reach out to us directly for any inquiries or feedback.</p>
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Get in Touch →</a>
        </div>
      </div>
    </div>
  );
}