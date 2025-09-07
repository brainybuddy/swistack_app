import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BookOpen, Users, Award, Clock, Star, Play, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const featuredCourses = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and become a full-stack developer',
    instructor: 'Sarah Johnson',
    rating: 4.8,
    students: 12543,
    duration: '42 hours',
    level: 'Beginner',
    price: 89.99,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
    category: 'Programming'
  },
  {
    id: 2,
    title: 'Data Science & Machine Learning',
    description: 'Master Python, pandas, scikit-learn, and build real-world ML projects',
    instructor: 'Dr. Michael Chen',
    rating: 4.9,
    students: 8967,
    duration: '38 hours',
    level: 'Intermediate',
    price: 129.99,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    category: 'Data Science'
  },
  {
    id: 3,
    title: 'UI/UX Design Masterclass',
    description: 'Learn design thinking, Figma, prototyping, and create stunning user experiences',
    instructor: 'Emma Williams',
    rating: 4.7,
    students: 15234,
    duration: '28 hours',
    level: 'Beginner',
    price: 79.99,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
    category: 'Design'
  }
]

const stats = [
  { label: 'Students Enrolled', value: '50,000+', icon: Users },
  { label: 'Expert Instructors', value: '200+', icon: Award },
  { label: 'Course Hours', value: '10,000+', icon: Clock },
  { label: 'Success Rate', value: '95%', icon: TrendingUp }
]

const features = [
  {
    title: 'Expert-Led Courses',
    description: 'Learn from industry professionals with years of real-world experience',
    icon: Award
  },
  {
    title: 'Interactive Learning',
    description: 'Hands-on projects, quizzes, and coding challenges to reinforce your skills',
    icon: Play
  },
  {
    title: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed progress reports and analytics',
    icon: CheckCircle
  },
  {
    title: 'Lifetime Access',
    description: 'Access your purchased courses anytime, anywhere, on any device',
    icon: BookOpen
  }
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">EduPlatform</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/courses" className="text-gray-600 hover:text-gray-900 font-medium">
                Courses
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 font-medium">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Learn Anything,
              <span className="text-blue-600 block">Anytime, Anywhere</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join thousands of learners and advance your career with our comprehensive online courses. 
              From programming to design, we have everything you need to succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" className="px-8 py-3">
                  Browse Courses <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most popular courses taught by industry experts
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">{course.category}</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge>{course.level}</Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>By {course.instructor}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {course.rating}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>{course.students.toLocaleString()} students</span>
                    <span>{course.duration}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      ${course.price}
                    </span>
                    <Button>Enroll Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/courses">
              <Button variant="outline" size="lg">
                View All Courses <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose EduPlatform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide the best learning experience with cutting-edge features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join our community of learners and take the first step towards your dream career
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">EduPlatform</span>
              </div>
              <p className="text-gray-400">
                Empowering learners worldwide with quality education and practical skills.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/courses" className="hover:text-white">Courses</Link></li>
                <li><Link href="/instructors" className="hover:text-white">Instructors</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link href="/community" className="hover:text-white">Community</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} EduPlatform. All rights reserved. | Port: {{PORT}} | Built with SwiStack</p>
          </div>
        </div>
      </footer>
    </div>
  )
}