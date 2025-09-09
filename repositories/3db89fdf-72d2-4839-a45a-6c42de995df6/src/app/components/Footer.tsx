export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-8 grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300">
        <div>
          <div className="font-semibold text-white mb-2">Product</div>
          <ul className="space-y-1">
            <li><a href="#" className="hover:text-white">Features</a></li>
            <li><a href="#popular" className="hover:text-white">Courses</a></li>
            <li><a href="#" className="hover:text-white">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">Resources</div>
          <ul className="space-y-1">
            <li><a href="#" className="hover:text-white">Blog</a></li>
            <li><a href="#" className="hover:text-white">Guides</a></li>
            <li><a href="#" className="hover:text-white">Help Center</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">Company</div>
          <ul className="space-y-1">
            <li><a href="#" className="hover:text-white">About</a></li>
            <li><a href="#" className="hover:text-white">Careers</a></li>
            <li><a href="#" className="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-2">Legal</div>
          <ul className="space-y-1">
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">License</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-xs text-gray-400 text-center">
        © 2024 EduPlatform. All rights reserved.
      </div>
    </footer>
  );
}
