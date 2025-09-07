'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Home,
  Search,
  User,
  Award,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronDown,
  PlayCircle,
  FileText,
  MessageCircle,
  Calendar,
  Star
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Browse Courses', href: '/courses', icon: Search },
  { name: 'My Learning', href: '/my-courses', icon: BookOpen },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'Certificates', href: '/certificates', icon: Award },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Discussions', href: '/discussions', icon: MessageCircle },
]

const quickActions = [
  { name: 'Continue Learning', href: '/dashboard', icon: PlayCircle, color: 'text-blue-600' },
  { name: 'Take Quiz', href: '/quizzes', icon: FileText, color: 'text-green-600' },
  { name: 'View Achievements', href: '/achievements', icon: Star, color: 'text-yellow-600' },
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 lg:static lg:inset-0 lg:z-auto",
        "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between px-6 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">EduPlatform</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isProfileOpen && "transform rotate-180"
              )} />
            </Button>
          </div>
          
          {isProfileOpen && (
            <div className="mt-3 space-y-2">
              <Link href="/profile" className="block">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </Link>
              <Link href="/settings" className="block">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={onClose}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {item.name}
                  {item.name === 'My Learning' && (
                    <Badge variant="secondary" className="ml-auto">
                      3
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="mt-3 space-y-1">
              {quickActions.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  onClick={onClose}
                >
                  <item.icon className={cn("mr-3 h-4 w-4 flex-shrink-0", item.color)} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="pt-6">
            <div className="px-3 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Weekly Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Study Hours</span>
                  <span className="font-medium">8/10</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Courses</span>
                  <span className="font-medium">2/3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '67%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-2">
          <Link href="/help" className="block">
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & Support
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
          <div className="pt-2 text-center">
            <p className="text-xs text-gray-500">
              Port: {{PORT}} | Built with SwiStack
            </p>
          </div>
        </div>
      </div>
    </>
  )
}