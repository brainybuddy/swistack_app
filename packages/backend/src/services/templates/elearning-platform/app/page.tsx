import React from 'react';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* SVG icon for the logo */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.485 9.176 5 7.5 5S4.168 5.485 3 6.253v13C4.168 18.485 5.824 18 7.5 18s3.332.485 4.5 1.253m0-13C13.168 5.485 14.824 5 16.5 5c1.676 0 3.332.485 4.5 1.253v13C19.832 18.485 18.176 18 16.5 18c-1.676 0-3.332.485-4.5 1.253" />
            </svg>
            <span className="text-2xl font-bold text-gray-800">Learnify</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Features</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Courses</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition duration-300">Contact</a>
            <button className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium transition duration-300 hover:bg-blue-700">Sign Up</button>
          </nav>
          <button className="md:hidden text-gray-600 hover:text-blue-600 focus:outline-none">
            {/* SVG for hamburger menu icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            Unlock Your Potential with Expert-Led Courses
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            Learn from industry leaders, master new skills, and land your dream job with our comprehensive e-learning platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold text-lg shadow-lg transition duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1">
              Start Your Free Trial
            </button>
            <button className="bg-white text-blue-600 border-2 border-blue-600 py-3 px-8 rounded-lg font-semibold text-lg shadow-lg transition duration-300 hover:bg-gray-100 hover:shadow-xl transform hover:-translate-y-1">
              Explore Courses
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Learnify?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {/* Feature 1 */}
            <div className="flex flex-col items-center p-8 bg-gray-50 rounded-xl shadow-md transition duration-300 hover:shadow-lg hover:bg-white">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.944 12v6.056c0 1.255.432 2.477 1.253 3.447a12 12 0 008.803.541l.157-.013c.09-.009.18-.018.27-.027a12 12 0 008.803-.541c.821-.97 1.253-2.192 1.253-3.447V12a12.001 12.001 0 00-3.04-8.618z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert-Led Courses</h3>
              <p className="text-gray-500">Learn from top professionals and experts in their fields.</p>
            </div>
            {/* Feature 2 */}
            <div className="flex flex-col items-center p-8 bg-gray-50 rounded-xl shadow-md transition duration-300 hover:shadow-lg hover:bg-white">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Community Support</h3>
              <p className="text-gray-500">Engage with a vibrant community of fellow learners and instructors.</p>
            </div>
            {/* Feature 3 */}
            <div className="flex flex-col items-center p-8 bg-gray-50 rounded-xl shadow-md transition duration-300 hover:shadow-lg hover:bg-white">
              <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Flexible Learning</h3>
              <p className="text-gray-500">Access your courses anytime, anywhere, on any device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Popular Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Course Card 1 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl">
              <img src="https://placehold.co/600x400/38a169/ffffff?text=Machine+Learning" alt="Machine Learning Course" className="w-full h-48 object-cover" />
              <div className="p-6">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full mb-2 inline-block">Beginner</span>
                <h3 className="text-xl font-bold mb-2">Machine Learning for Absolute Beginners</h3>
                <p className="text-gray-600 text-sm mb-4">Learn the fundamentals of machine learning and build your first model.</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Alex Chen</span>
                </div>
                <a href="#" className="w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium transition duration-300 hover:bg-blue-700 inline-block">View Details</a>
              </div>
            </div>
            {/* Course Card 2 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl">
              <img src="https://placehold.co/600x400/4c51bf/ffffff?text=UI%2FUX+Design" alt="UI/UX Design Course" className="w-full h-48 object-cover" />
              <div className="p-6">
                <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full mb-2 inline-block">Intermediate</span>
                <h3 className="text-xl font-bold mb-2">Mastering UI/UX Design with Figma</h3>
                <p className="text-gray-600 text-sm mb-4">Design beautiful and intuitive user interfaces from scratch.</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sarah Lee</span>
                </div>
                <a href="#" className="w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium transition duration-300 hover:bg-blue-700 inline-block">View Details</a>
              </div>
            </div>
            {/* Course Card 3 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-2xl">
              <img src="https://placehold.co/600x400/e53e3e/ffffff?text=Digital+Marketing" alt="Digital Marketing Course" className="w-full h-48 object-cover" />
              <div className="p-6">
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full mb-2 inline-block">All Levels</span>
                <h3 className="text-xl font-bold mb-2">The Complete Digital Marketing Course</h3>
                <p className="text-gray-600 text-sm mb-4">Learn SEO, social media, and content marketing to grow your business.</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>David Kim</span>
                </div>
                <a href="#" className="w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium transition duration-300 hover:bg-blue-700 inline-block">View Details</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-xl shadow-md">
              <p className="text-gray-600 text-lg italic mb-4">&quot;Learnify has completely changed my career path. The courses are high-quality and the instructors are amazing. I highly recommend it!&quot;</p>
              <div className="flex items-center">
                <img className="h-12 w-12 rounded-full object-cover mr-4" src="https://placehold.co/100x100/e2e8f0/64748b?text=JS" alt="Student 1" />
                <div>
                  <p className="font-semibold text-gray-800">Jessica S.</p>
                  <p className="text-sm text-gray-500">Web Developer</p>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-xl shadow-md">
              <p className="text-gray-600 text-lg italic mb-4">&quot;The flexibility of Learnify allowed me to learn at my own pace while working full-time. The community forums are incredibly helpful.&quot;</p>
              <div className="flex items-center">
                <img className="h-12 w-12 rounded-full object-cover mr-4" src="https://placehold.co/100x100/e2e8f0/64748b?text=MS" alt="Student 2" />
                <div>
                  <p className="font-semibold text-gray-800">Michael B.</p>
                  <p className="text-sm text-gray-500">Marketing Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90">Join thousands of students and transform your career today.</p>
          <button className="bg-white text-blue-600 py-3 px-8 rounded-lg font-semibold text-lg shadow-lg transition duration-300 hover:bg-gray-100 transform hover:-translate-y-1">
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Learnify</h3>
            <p className="text-sm text-gray-400">Your path to mastering new skills and achieving your career goals.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Features</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Courses</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Pricing</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Testimonials</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition duration-300">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Careers</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Blog</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition duration-300">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; 2024 Learnify. All rights reserved.
        </div>
      </footer>
    </div>
  );
}