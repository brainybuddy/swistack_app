'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  BookOpen,
  Award,
  BarChart3
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick: () => void
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const notifications = [
  {
    id: 1,
    title: 'New course available',
    description: 'Advanced React Patterns is now live',
    time: '2 hours ago',
    type: 'course',
    unread: true
  },
  {
    id: 2,
    title: 'Assignment due soon',
    description: 'React Project is due tomorrow',
    time: '4 hours ago',
    type: 'assignment',
    unread: true
  },
  {
    id: 3,
    title: 'Quiz completed',
    description: 'You scored 95% on JavaScript Fundamentals',
    time: '1 day ago',
    type: 'achievement',
    unread: false
  }
]

const messages = [
  {
    id: 1,
    sender: 'Sarah Johnson',
    message: 'Great job on your project submission!',
    time: '1 hour ago',
    unread: true
  },
  {
    id: 2,
    sender: 'Course Assistant',
    message: 'Your question about React hooks has been answered',
    time: '3 hours ago',
    unread: true
  },
  {
    id: 3,
    sender: 'Dr. Michael Chen',
    message: 'New resources added to Data Science module',
    time: '1 day ago',
    unread: false
  }
]

export function Header({ onMenuClick, user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const unreadNotifications = notifications.filter(n => n.unread).length
  const unreadMessages = messages.filter(m => m.unread).length

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search courses, instructors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-gray-50 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Mobile search */}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <Badge variant="secondary">{unreadNotifications} new</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start space-x-3 p-4 cursor-pointer"
                    >
                      <div className={`p-2 rounded-full ${
                        notification.type === 'course' ? 'bg-blue-100' :
                        notification.type === 'assignment' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        {notification.type === 'course' && <BookOpen className="h-4 w-4 text-blue-600" />}
                        {notification.type === 'assignment' && <BarChart3 className="h-4 w-4 text-orange-600" />}
                        {notification.type === 'achievement' && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${notification.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </p>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center p-3">
                  <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-700">
                    View all notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Messages */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadMessages}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Messages</span>
                  {unreadMessages > 0 && (
                    <Badge variant="secondary">{unreadMessages} new</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <DropdownMenuItem
                      key={message.id}
                      className="flex items-start space-x-3 p-4 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${message.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                            {message.sender}
                          </p>
                          {message.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {message.time}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center p-3">
                  <Link href="/messages" className="text-sm text-blue-600 hover:text-blue-700">
                    View all messages
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || ''}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-courses" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>My Courses</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/certificates" className="flex items-center">
                    <Award className="mr-2 h-4 w-4" />
                    <span>Certificates</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}