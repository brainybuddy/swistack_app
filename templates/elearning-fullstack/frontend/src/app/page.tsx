import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { FeaturedCourses } from '@/components/home/FeaturedCourses';
import { InstructorsSection } from '@/components/home/InstructorsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { StatsSection } from '@/components/home/StatsSection';
import { CTASection } from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Featured Courses */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Courses
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover our most popular and highly-rated courses across various categories
            </p>
          </div>
          <FeaturedCourses />
        </div>
      </section>
      
      {/* Top Instructors */}
      <InstructorsSection />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <CTASection />
    </div>
  );
}

export const metadata = {
  title: 'E-Learning Platform - Learn New Skills Online',
  description: 'Join thousands of students learning from expert instructors. Discover courses in web development, data science, design, and more.',
  keywords: 'online learning, courses, education, skills, web development, data science, design',
  openGraph: {
    title: 'E-Learning Platform - Learn New Skills Online',
    description: 'Join thousands of students learning from expert instructors. Discover courses in web development, data science, design, and more.',
    type: 'website',
    url: 'https://your-domain.com',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'E-Learning Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-Learning Platform - Learn New Skills Online',
    description: 'Join thousands of students learning from expert instructors.',
    images: ['/images/twitter-image.jpg'],
  },
};