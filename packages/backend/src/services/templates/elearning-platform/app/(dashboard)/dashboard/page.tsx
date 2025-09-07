'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  PlayCircle,
  CheckCircle2,
  Calendar,
  Target,
  Users,
  Star
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Mock data - in a real app, this would come from your API
const enrolledCourses = [
  {
    id: 1,
    title: 'Complete Web Development Bootcamp',
    instructor: 'Sarah Johnson',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=200&fit=crop',
    progress: 75,
    totalLessons: 120,
    completedLessons: 90,
    nextLesson: 'Building REST APIs with Node.js',
    category: 'Programming',
    level: 'Beginner',
    timeSpent: 45 // hours
  },
  {
    id: 2,
    title: 'Data Science & Machine Learning',
    instructor: 'Dr. Michael Chen',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&h=200&fit=crop',
    progress: 40,
    totalLessons: 85,
    completedLessons: 34,
    nextLesson: 'Introduction to Neural Networks',
    category: 'Data Science',
    level: 'Intermediate',
    timeSpent: 28
  },
  {
    id: 3,
    title: 'UI/UX Design Masterclass',
    instructor: 'Emma Williams',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
    progress: 90,
    totalLessons: 65,
    completedLessons: 58,
    nextLesson: 'Advanced Prototyping Techniques',
    category: 'Design',
    level: 'Beginner',
    timeSpent: 32
  }
]

const recentActivity = [
  {
    id: 1,
    type: 'lesson_completed',
    title: 'JavaScript Fundamentals',
    course: 'Complete Web Development Bootcamp',
    timestamp: '2 hours ago',
    icon: CheckCircle2
  },
  {
    id: 2,
    type: 'quiz_passed',
    title: 'HTML & CSS Quiz',
    course: 'Complete Web Development Bootcamp',
    score: 92,
    timestamp: '1 day ago',
    icon: Award
  },
  {
    id: 3,
    type: 'course_enrolled',
    title: 'UI/UX Design Masterclass',
    timestamp: '3 days ago',
    icon: BookOpen
  }
]

const stats = [
  {
    label: 'Courses Enrolled',
    value: '3',
    change: '+1 this month',
    icon: BookOpen,
    color: 'text-blue-600'
  },
  {
    label: 'Hours Learned',
    value: '105',
    change: '+12 this week',
    icon: Clock,
    color: 'text-green-600'
  },
  {
    label: 'Certificates Earned',
    value: '2',
    change: '+1 this month',
    icon: Award,
    color: 'text-yellow-600'
  },
  {
    label: 'Average Score',
    value: '94%',
    change: '+2% improvement',
    icon: TrendingUp,
    color: 'text-purple-600'
  }
]

const upcomingDeadlines = [
  {
    id: 1,
    title: 'React Project Assignment',
    course: 'Complete Web Development Bootcamp',
    dueDate: '2024-03-15',
    type: 'assignment'
  },
  {
    id: 2,
    title: 'Data Analysis Quiz',
    course: 'Data Science & Machine Learning',
    dueDate: '2024-03-18',
    type: 'quiz'
  }
]

export default function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey and achieve your goals
          </p>
        </div>
        <Button asChild>
          <Link href="/courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-blue-600" />
                Continue Learning
              </CardTitle>
              <CardDescription>
                Pick up where you left off in your courses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600">by {course.instructor}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{course.category}</Badge>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.timeSpent}h spent
                          </span>
                        </div>
                        <Button size="sm" asChild>
                          <Link href={`/courses/${course.id}/learn`}>
                            Continue Learning
                          </Link>
                        </Button>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        <strong>Next:</strong> {course.nextLesson}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your learning progress over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <activity.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <span className="text-sm text-gray-500">{activity.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.course}
                        {activity.score && (
                          <span className="ml-2 text-green-600 font-medium">
                            Score: {activity.score}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{deadline.title}</h4>
                    <Badge variant={deadline.type === 'quiz' ? 'secondary' : 'default'}>
                      {deadline.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{deadline.course}</p>
                  <p className="text-sm text-orange-600 font-medium">
                    Due: {new Date(deadline.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Study Hours</span>
                    <span className="font-medium">8 / 10 hours</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Lessons Completed</span>
                    <span className="font-medium">12 / 15 lessons</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Quiz Average</span>
                    <span className="font-medium">92% / 90%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Update Goals
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse All Courses
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/certificates">
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/profile">
                  <Users className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}