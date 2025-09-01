import { Model } from 'objection';
import { knex } from '../config/database';
import User from './User';

Model.knex(knex);

export class Course extends Model {
  static tableName = 'courses';

  id!: string;
  title!: string;
  slug!: string;
  shortDescription?: string;
  description?: string;
  instructorId!: string;
  categoryId?: string;
  level!: 'beginner' | 'intermediate' | 'advanced';
  language!: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  price!: number;
  discountPrice?: number;
  currency!: string;
  durationHours!: number;
  requirements?: string[];
  learningOutcomes?: string[];
  tags?: string[];
  status!: 'draft' | 'published' | 'archived';
  isFeatured!: boolean;
  isFree!: boolean;
  enrollmentLimit?: number;
  enrollmentCount!: number;
  ratingAvg!: number;
  ratingCount!: number;
  publishedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  instructor?: User;
  category?: any;
  modules?: CourseModule[];
  lessons?: Lesson[];
  enrollments?: any[];
  reviews?: any[];

  static relationMappings = {
    instructor: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'courses.instructorId',
        to: 'users.id'
      }
    },
    category: {
      relation: Model.BelongsToOneRelation,
      modelClass: 'Category',
      join: {
        from: 'courses.categoryId',
        to: 'categories.id'
      }
    },
    modules: {
      relation: Model.HasManyRelation,
      modelClass: 'CourseModule',
      join: {
        from: 'courses.id',
        to: 'course_modules.courseId'
      }
    },
    lessons: {
      relation: Model.HasManyRelation,
      modelClass: 'Lesson',
      join: {
        from: 'courses.id',
        to: 'lessons.courseId'
      }
    },
    enrollments: {
      relation: Model.HasManyRelation,
      modelClass: 'Enrollment',
      join: {
        from: 'courses.id',
        to: 'enrollments.courseId'
      }
    },
    reviews: {
      relation: Model.HasManyRelation,
      modelClass: 'CourseReview',
      join: {
        from: 'courses.id',
        to: 'course_reviews.courseId'
      }
    }
  };

  static jsonSchema = {
    type: 'object',
    required: ['title', 'instructorId'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string', maxLength: 200 },
      slug: { type: 'string', maxLength: 200 },
      shortDescription: { type: 'string' },
      description: { type: 'string' },
      instructorId: { type: 'string', format: 'uuid' },
      categoryId: { type: 'string', format: 'uuid' },
      level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
      language: { type: 'string', maxLength: 10 },
      price: { type: 'number', minimum: 0 },
      discountPrice: { type: 'number', minimum: 0 },
      currency: { type: 'string', maxLength: 3 },
      durationHours: { type: 'integer', minimum: 0 },
      requirements: { type: 'array', items: { type: 'string' } },
      learningOutcomes: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
      status: { type: 'string', enum: ['draft', 'published', 'archived'] },
      isFeatured: { type: 'boolean' },
      isFree: { type: 'boolean' },
      enrollmentLimit: { type: 'integer', minimum: 1 }
    }
  };

  // Virtual properties
  get effectivePrice(): number {
    return this.discountPrice || this.price;
  }

  get hasDiscount(): boolean {
    return !!this.discountPrice && this.discountPrice < this.price;
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    return Math.round(((this.price - this.discountPrice!) / this.price) * 100);
  }

  get isPublished(): boolean {
    return this.status === 'published';
  }

  get canEnroll(): boolean {
    return this.isPublished && 
           (!this.enrollmentLimit || this.enrollmentCount < this.enrollmentLimit);
  }

  async $beforeInsert(queryContext: any): Promise<void> {
    await super.$beforeInsert(queryContext);
    
    if (!this.slug && this.title) {
      this.slug = await this.generateUniqueSlug(this.title);
    }
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate(opt: any, queryContext: any): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    
    // Update slug if title changed
    if (opt.patch && opt.patch.title && opt.patch.title !== this.title) {
      this.slug = await this.generateUniqueSlug(opt.patch.title);
    }
    
    // Set published timestamp
    if (opt.patch && opt.patch.status === 'published' && this.status !== 'published') {
      this.publishedAt = new Date();
    }
    
    this.updatedAt = new Date();
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await Course.query().findOne({ slug });
      if (!existing || existing.id === this.id) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Static methods for querying courses
  static async findPublished(options: {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    language?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    featured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 12,
      category,
      level,
      language,
      minPrice,
      maxPrice,
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    let query = this.query()
      .where('status', 'published')
      .withGraphFetched('[instructor(selectBasic), category]');

    // Apply filters
    if (category) query = query.where('categoryId', category);
    if (level) query = query.where('level', level);
    if (language) query = query.where('language', language);
    if (minPrice !== undefined) query = query.where('price', '>=', minPrice);
    if (maxPrice !== undefined) query = query.where('price', '<=', maxPrice);
    if (featured) query = query.where('isFeatured', true);
    
    if (search) {
      query = query.where(builder => {
        builder.whereILike('title', `%${search}%`)
               .orWhereILike('description', `%${search}%`)
               .orWhereRaw('? = ANY(tags)', [search]);
      });
    }

    // Get total count
    const total = await query.resultSize();

    // Apply pagination and sorting
    const courses = await query
      .orderBy(sortBy, sortOrder)
      .page(page - 1, limit);

    return {
      courses: courses.results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async findByInstructor(instructorId: string, options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 10, status, search } = options;

    let query = this.query()
      .where('instructorId', instructorId)
      .withGraphFetched('[category]');

    if (status) query = query.where('status', status);
    
    if (search) {
      query = query.where(builder => {
        builder.whereILike('title', `%${search}%`)
               .orWhereILike('description', `%${search}%`);
      });
    }

    const total = await query.resultSize();
    const courses = await query
      .orderBy('updatedAt', 'desc')
      .page(page - 1, limit);

    return {
      courses: courses.results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getPopular(limit: number = 10) {
    return this.query()
      .where('status', 'published')
      .orderBy([
        { column: 'enrollmentCount', order: 'desc' },
        { column: 'ratingAvg', order: 'desc' }
      ])
      .limit(limit)
      .withGraphFetched('[instructor(selectBasic), category]');
  }

  static async getFeatured(limit: number = 6) {
    return this.query()
      .where('status', 'published')
      .where('isFeatured', true)
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .withGraphFetched('[instructor(selectBasic), category]');
  }

  async updateRating() {
    const stats = await knex('course_reviews')
      .where('courseId', this.id)
      .where('isPublished', true)
      .avg('rating as avgRating')
      .count('* as reviewCount')
      .first();

    await this.$query().patch({
      ratingAvg: parseFloat(stats.avgRating) || 0,
      ratingCount: parseInt(stats.reviewCount) || 0
    });
  }

  async incrementEnrollment() {
    await this.$query().increment('enrollmentCount', 1);
  }

  async decrementEnrollment() {
    await this.$query().decrement('enrollmentCount', 1);
  }
}

export class CourseModule extends Model {
  static tableName = 'course_modules';

  id!: string;
  courseId!: string;
  title!: string;
  description?: string;
  sortOrder!: number;
  isPublished!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  course?: Course;
  lessons?: Lesson[];

  static relationMappings = {
    course: {
      relation: Model.BelongsToOneRelation,
      modelClass: Course,
      join: {
        from: 'course_modules.courseId',
        to: 'courses.id'
      }
    },
    lessons: {
      relation: Model.HasManyRelation,
      modelClass: 'Lesson',
      join: {
        from: 'course_modules.id',
        to: 'lessons.moduleId'
      }
    }
  };

  async $beforeInsert(queryContext: any): Promise<void> {
    await super.$beforeInsert(queryContext);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate(opt: any, queryContext: any): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    this.updatedAt = new Date();
  }
}

export class Lesson extends Model {
  static tableName = 'lessons';

  id!: string;
  courseId!: string;
  moduleId!: string;
  title!: string;
  description?: string;
  contentType!: 'video' | 'text' | 'quiz' | 'assignment' | 'live';
  videoUrl?: string;
  videoDuration?: number;
  textContent?: string;
  attachments?: any[];
  sortOrder!: number;
  isPreview!: boolean;
  isPublished!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  course?: Course;
  module?: CourseModule;
  progress?: any[];

  static relationMappings = {
    course: {
      relation: Model.BelongsToOneRelation,
      modelClass: Course,
      join: {
        from: 'lessons.courseId',
        to: 'courses.id'
      }
    },
    module: {
      relation: Model.BelongsToOneRelation,
      modelClass: CourseModule,
      join: {
        from: 'lessons.moduleId',
        to: 'course_modules.id'
      }
    }
  };

  get isVideo(): boolean {
    return this.contentType === 'video';
  }

  get isText(): boolean {
    return this.contentType === 'text';
  }

  get isQuiz(): boolean {
    return this.contentType === 'quiz';
  }

  get isAssignment(): boolean {
    return this.contentType === 'assignment';
  }

  async $beforeInsert(queryContext: any): Promise<void> {
    await super.$beforeInsert(queryContext);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  async $beforeUpdate(opt: any, queryContext: any): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    this.updatedAt = new Date();
  }
}

export default Course;