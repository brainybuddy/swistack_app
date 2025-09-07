import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const level = searchParams.get('level') || ''
    const sortBy = searchParams.get('sortBy') || 'popular'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      published: true,
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructor: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (category && category !== 'All') {
      where.category = { name: category }
    }

    if (level && level !== 'All Levels') {
      where.level = level.toUpperCase()
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'price-low':
        orderBy = { price: 'asc' }
        break
      case 'price-high':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        // This would need to be calculated from reviews
        orderBy = { createdAt: 'desc' }
        break
      case 'popular':
      default:
        // This would need to be calculated from enrollments
        orderBy = { createdAt: 'desc' }
        break
    }

    const [courses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              image: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
              modules: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        }
      }),
      prisma.course.count({ where })
    ])

    // Calculate average rating and format response
    const coursesWithStats = courses.map(course => {
      const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        level: course.level,
        duration: course.duration,
        featured: course.featured,
        slug: course.slug,
        instructor: {
          name: course.instructor.name,
          image: course.instructor.image
        },
        category: course.category.name,
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: course.reviews.length,
        studentCount: course._count.enrollments,
        moduleCount: course._count.modules,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      }
    })

    return NextResponse.json({
      courses: coursesWithStats,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Courses API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await req.json()
    const {
      title,
      description,
      thumbnail,
      price,
      level,
      duration,
      categoryId,
      requirements,
      learnings
    } = data

    // Validate required fields
    if (!title || !description || !categoryId) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail,
        price: price || 0,
        level: level || 'BEGINNER',
        duration: duration || 0,
        slug,
        requirements: requirements || [],
        learnings: learnings || [],
        instructorId: session.user.id,
        categoryId,
        published: false
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Course creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}