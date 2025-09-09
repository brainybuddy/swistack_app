import Link from "next/link";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2"><span className="text-2xl font-extrabold text-blue-700">EduPlatform</span><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Lite</span></div>
          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <a href="#popular" className="hover:text-white">Courses</a>
            <a href="#" className="hover:text-white">Dashboard</a>
            <a href="#" className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700">Login</a>
          </nav>
        </div>
      </header>

      {/* 1) Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Learn Without Limits</h1>
          <p className="opacity-95 text-lg mb-6">Expert-led courses, hands-on projects, beautiful UI.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#popular" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded shadow hover:bg-blue-50">Explore Courses</a>
            <a href="#popular" className="border border-white/40 text-white px-6 py-3 rounded hover:bg-white/10">Popular Tracks</a>
          </div>
        </div>
      </section>

      {/* 2) Stats */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div><div className="text-4xl font-extrabold text-blue-600">50,000</div><div className="text-gray-600 font-medium">Active Students</div></div>
          <div><div className="text-4xl font-extrabold text-blue-600">1,200</div><div className="text-gray-600 font-medium">Expert Instructors</div></div>
          <div><div className="text-4xl font-extrabold text-blue-600">2,800</div><div className="text-gray-600 font-medium">Online Courses</div></div>
          <div><div className="text-4xl font-extrabold text-blue-600">98%</div><div className="text-gray-600 font-medium">Success Rate</div></div>
        </div>
      </section>

      {/* 3) Categories */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex gap-2 overflow-x-auto">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Web Dev</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Data</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Design</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Cloud</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">Mobile</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">AI/ML</span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full border bg-white text-sm text-gray-700 hover:border-blue-500 hover:text-blue-600">DevOps</span>
        </div>
      </section>

      {/* 4) Popular Courses */}
      <section id="popular" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between mb-6"><h2 className="text-2xl font-bold">Popular Courses</h2><a href="#popular" className="text-blue-600 hover:underline">View all</a></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>
              <h3 className="font-semibold">Web Development Bootcamp</h3>
              <p className="text-sm text-gray-300 mb-3">By Sarah Johnson</p>
              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$89</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>
            </div>
            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>
              <h3 className="font-semibold">Data Science with Python</h3>
              <p className="text-sm text-gray-300 mb-3">By Michael Chen</p>
              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$99</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>
            </div>
            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="h-28 rounded bg-gradient-to-r from-slate-100 to-slate-200 mb-4"/>
              <h3 className="font-semibold">UI/UX Design Fundamentals</h3>
              <p className="text-sm text-gray-300 mb-3">By Emily Carter</p>
              <div className="flex items-center justify-between"><span className="font-bold text-blue-600">$79</span><button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Enroll</button></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5) Learning Paths */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">Learning Paths</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-5">
              <h3 className="font-semibold">Frontend Engineer</h3>
              <p className="text-sm text-gray-300 mt-1">HTML, CSS, JS, React, TS</p>
              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <h3 className="font-semibold">Data Analyst</h3>
              <p className="text-sm text-gray-300 mt-1">SQL, Python, Pandas, Viz</p>
              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>
            </div>
            <div className="bg-white border rounded-lg p-5">
              <h3 className="font-semibold">Cloud Practitioner</h3>
              <p className="text-sm text-gray-300 mt-1">AWS basics, networking, security</p>
              <div className="mt-4"><a className="text-blue-600 hover:underline" href="#">View path</a></div>
            </div>
          </div>
        </div>
      </section>

      {/* 6) Testimonials */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-6">What learners say</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 border rounded-lg p-5">
              <p className="italic text-gray-700">“The UI is clean and fast to customize.”</p>
              <div className="mt-3 text-sm text-gray-300">— Jamie</div>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
              <p className="italic text-gray-700">“I shipped a polished demo in hours.”</p>
              <div className="mt-3 text-sm text-gray-300">— Omar</div>
            </div>
            <div className="bg-gray-50 border rounded-lg p-5">
              <p className="italic text-gray-700">“Perfect starting point for client projects.”</p>
              <div className="mt-3 text-sm text-gray-300">— Leah</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Start learning today</h2>
          <p className="opacity-90 mb-4">Pick a template, save as project, and build.</p>
          <a href="#popular" className="inline-block bg-white text-blue-700 font-semibold px-6 py-3 rounded hover:bg-blue-50">Browse Courses</a>
        </div>
      </section>
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
        <div className="border-t border-gray-800 py-4 text-xs text-gray-400 text-center">
          © 2024 EduPlatform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
