'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Navigation } from '@/components/layout/Navigation'
import { 
  Search, 
  Filter,
  Star,
  Clock,
  Users,
  BookOpen,
  TrendingUp,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Mock data - in a real app, this would come from your API
const courses = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and become a full-stack developer. Build real projects and deploy them to the cloud.',
    instructor: 'Sarah Johnson',
    instructorImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    rating: 4.8,
    reviewCount: 1245,
    students: 12543,
    duration: 42, // hours
    lessons: 120,
    level: 'Beginner',
    price: 89.99,
    originalPrice: 199.99,
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop',
    category: 'Programming',
    tags: ['JavaScript', 'React', 'Node.js', 'Web Development'],
    featured: true,
    bestseller: true,
    lastUpdated: '2024-02-15'
  },
  {
    id: 2,
    title: 'Data Science & Machine Learning',
    description: 'Master Python, pandas, scikit-learn, and TensorFlow. Build real-world ML projects and understand the theory behind algorithms.',
    instructor: 'Dr. Michael Chen',
    instructorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    rating: 4.9,
    reviewCount: 892,
    students: 8967,
    duration: 38,
    lessons: 85,
    level: 'Intermediate',
    price: 129.99,
    originalPrice: 299.99,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    category: 'Data Science',
    tags: ['Python', 'Machine Learning', 'Data Analysis', 'TensorFlow'],
    featured: true,
    bestseller: false,
    lastUpdated: '2024-02-10'
  },
  {
    id: 3,
    title: 'UI/UX Design Masterclass',
    description: 'Learn design thinking, Figma, prototyping, and create stunning user experiences. Build a portfolio of real projects.',
    instructor: 'Emma Williams',
    instructorImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    rating: 4.7,
    reviewCount: 1567,
    students: 15234,
    duration: 28,
    lessons: 65,
    level: 'Beginner',
    price: 79.99,
    originalPrice: 179.99,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop',
    category: 'Design',
    tags: ['Figma', 'UI Design', 'UX Research', 'Prototyping'],
    featured: false,
    bestseller: true,
    lastUpdated: '2024-02-12'
  },
  {
    id: 4,
    title: 'Digital Marketing Mastery',
    description: 'Learn SEO, social media marketing, Google Ads, email marketing, and analytics. Grow any business online.',
    instructor: 'James Rodriguez',
    instructorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 4.6,
    reviewCount: 723,
    students: 9876,
    duration: 35,
    lessons: 78,
    level: 'Beginner',
    price: 69.99,
    originalPrice: 149.99,
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop',
    category: 'Marketing',
    tags: ['SEO', 'Google Ads', 'Social Media', 'Analytics'],
    featured: false,
    bestseller: false,
    lastUpdated: '2024-01-28'
  },
  {
    id: 5,
    title: 'Mobile App Development with React Native',
    description: 'Build iOS and Android apps with React Native. Learn navigation, state management, and publish to app stores.',
    instructor: 'Alex Kim',
    instructorImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
    rating: 4.5,
    reviewCount: 456,
    students: 5432,
    duration: 32,
    lessons: 92,
    level: 'Intermediate',
    price: 99.99,
    originalPrice: 219.99,
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=225&fit=crop',
    category: 'Mobile Development',
    tags: ['React Native', 'JavaScript', 'Mobile', 'iOS', 'Android'],
    featured: false,
    bestseller: false,
    lastUpdated: '2024-02-05'
  },
  {
    id: 6,
    title: 'Photography Fundamentals',
    description: 'Master camera settings, composition, lighting, and post-processing. Take stunning photos like a professional.',
    instructor: 'Lisa Parker',
    instructorImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    rating: 4.8,
    reviewCount: 892,
    students: 7654,
    duration: 24,
    lessons: 56,
    level: 'Beginner',
    price: 59.99,
    originalPrice: 129.99,
    thumbnail: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&h=225&fit=crop',
    category: 'Photography',
    tags: ['Photography', 'Lightroom', 'Photoshop', 'Portrait'],
    featured: false,
    bestseller: false,
    lastUpdated: '2024-01-15'
  }
]

const categories = ['All', 'Programming', 'Design', 'Data Science', 'Marketing', 'Mobile Development', 'Photography']
const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']
const sortOptions = ['Most Popular', 'Highest Rated', 'Newest', 'Price: Low to High', 'Price: High to Low']

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All Levels')
  const [sortBy, setSortBy] = useState('Most Popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  
  const coursesPerPage = 6
  const totalPages = Math.ceil(courses.length / coursesPerPage)
  const startIndex = (currentPage - 1) * coursesPerPage
  const endIndex = startIndex + coursesPerPage

  // Filter and sort courses
  let filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
    const matchesLevel = selectedLevel === 'All Levels' || course.level === selectedLevel
    
    return matchesSearch && matchesCategory && matchesLevel
  })

  // Sort courses
  filteredCourses = filteredCourses.sort((a, b) => {
    switch (sortBy) {
      case 'Highest Rated':
        return b.rating - a.rating
      case 'Newest':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      case 'Price: Low to High':
        return a.price - b.price
      case 'Price: High to Low':
        return b.price - a.price
      case 'Most Popular':
      default:
        return b.students - a.students
    }
  })

  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Our Courses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover thousands of courses taught by expert instructors. 
              Learn at your own pace and advance your career.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search courses, instructors, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center space-x-2">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Course Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {paginatedCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {course.bestseller && <Badge className="bg-orange-500">Bestseller</Badge>}
                    {course.featured && <Badge className="bg-blue-500">Featured</Badge>}
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary">{course.level}</Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{course.category}</Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({course.reviewCount})</span>
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 group-hover:text-blue-600 transition-colors">
                    <Link href={`/courses/${course.id}`}>
                      {course.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Image
                        src={course.instructorImage}
                        alt={course.instructor}
                        width={24}
                        height={24}
                        className="rounded-full mr-2"
                      />
                      {course.instructor}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {course.duration}h
                      </span>
                      <span className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {course.lessons} lessons
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {course.students.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">
                        ${course.price}
                      </span>
                      {course.originalPrice > course.price && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${course.originalPrice}
                        </span>
                      )}
                    </div>
                    <Button asChild>
                      <Link href={`/courses/${course.id}`}>
                        View Course
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6 mb-12">
            {paginatedCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <div className="flex">
                  <div className="w-64 h-40 relative overflow-hidden rounded-l-lg flex-shrink-0">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge variant="secondary">{course.level}</Badge>
                          {course.bestseller && <Badge className="bg-orange-500">Bestseller</Badge>}
                          {course.featured && <Badge className="bg-blue-500">Featured</Badge>}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          <Link href={`/courses/${course.id}`}>
                            {course.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mt-2 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${course.price}
                        </div>
                        {course.originalPrice > course.price && (
                          <div className="text-sm text-gray-500 line-through">
                            ${course.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Image
                          src={course.instructorImage}
                          alt={course.instructor}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                        {course.instructor}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {course.rating} ({course.reviewCount} reviews)
                      </div>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {course.duration} hours
                      </span>
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {course.students.toLocaleString()} students
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {course.tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button asChild>
                        <Link href={`/courses/${course.id}`}>
                          View Course
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  onClick={() => setCurrentPage(page)}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}