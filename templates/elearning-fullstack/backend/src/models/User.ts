import { Model } from 'objection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { knex } from '../config/database';

Model.knex(knex);

export interface UserProfile {
  id: string;
  userId: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone: string;
  language: string;
  learningGoals?: string[];
  interests?: string[];
  educationLevel?: string;
  occupation?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends Model {
  static tableName = 'users';

  id!: string;
  email!: string;
  username!: string;
  passwordHash!: string;
  firstName!: string;
  lastName!: string;
  role!: 'student' | 'instructor' | 'admin';
  avatarUrl?: string;
  bio?: string;
  title?: string;
  expertise?: string[];
  socialLinks?: Record<string, string>;
  isVerified!: boolean;
  isActive!: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  profile?: UserProfile;
  courses?: any[]; // Courses created by instructor
  enrollments?: any[]; // Courses enrolled in
  reviews?: any[];

  static relationMappings = {
    profile: {
      relation: Model.HasOneRelation,
      modelClass: 'UserProfile',
      join: {
        from: 'users.id',
        to: 'user_profiles.userId'
      }
    },
    courses: {
      relation: Model.HasManyRelation,
      modelClass: 'Course',
      join: {
        from: 'users.id',
        to: 'courses.instructorId'
      }
    },
    enrollments: {
      relation: Model.HasManyRelation,
      modelClass: 'Enrollment',
      join: {
        from: 'users.id',
        to: 'enrollments.userId'
      }
    },
    reviews: {
      relation: Model.HasManyRelation,
      modelClass: 'CourseReview',
      join: {
        from: 'users.id',
        to: 'course_reviews.userId'
      }
    }
  };

  static jsonSchema = {
    type: 'object',
    required: ['email', 'username', 'passwordHash', 'firstName', 'lastName'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email', maxLength: 255 },
      username: { type: 'string', minLength: 3, maxLength: 100 },
      passwordHash: { type: 'string', minLength: 6 },
      firstName: { type: 'string', maxLength: 100 },
      lastName: { type: 'string', maxLength: 100 },
      role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
      avatarUrl: { type: 'string', maxLength: 500 },
      bio: { type: 'string' },
      title: { type: 'string', maxLength: 200 },
      expertise: { type: 'array', items: { type: 'string' } },
      socialLinks: { type: 'object' },
      isVerified: { type: 'boolean' },
      isActive: { type: 'boolean' }
    }
  };

  // Virtual properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isInstructor(): boolean {
    return this.role === 'instructor';
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isStudent(): boolean {
    return this.role === 'student';
  }

  // Hash password before insert
  async $beforeInsert(queryContext: any): Promise<void> {
    await super.$beforeInsert(queryContext);
    
    if (this.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Hash password before update if it's being changed
  async $beforeUpdate(opt: any, queryContext: any): Promise<void> {
    await super.$beforeUpdate(opt, queryContext);
    
    if (this.passwordHash && opt.patch && opt.patch.passwordHash) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    }
    
    this.updatedAt = new Date();
  }

  // Methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }

  generateAccessToken(): string {
    return jwt.sign(
      { 
        id: this.id, 
        email: this.email, 
        role: this.role,
        username: this.username 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'elearning-platform',
        audience: 'elearning-users'
      }
    );
  }

  generateRefreshToken(): string {
    return jwt.sign(
      { 
        id: this.id, 
        tokenType: 'refresh' 
      },
      process.env.JWT_REFRESH_SECRET!,
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
        issuer: 'elearning-platform',
        audience: 'elearning-users'
      }
    );
  }

  // Static methods
  static async findByEmail(email: string): Promise<User | undefined> {
    return this.query().findOne({ email: email.toLowerCase() });
  }

  static async findByUsername(username: string): Promise<User | undefined> {
    return this.query().findOne({ username: username.toLowerCase() });
  }

  static async findByEmailOrUsername(identifier: string): Promise<User | undefined> {
    return this.query()
      .where('email', identifier.toLowerCase())
      .orWhere('username', identifier.toLowerCase())
      .first();
  }

  static async createWithProfile(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'student' | 'instructor' | 'admin';
  }): Promise<User> {
    const trx = await User.startTransaction();
    
    try {
      // Create user
      const user = await User.query(trx).insert({
        email: userData.email.toLowerCase(),
        username: userData.username.toLowerCase(),
        passwordHash: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'student',
        isVerified: false,
        isActive: true
      });

      // Create user profile
      await UserProfile.query(trx).insert({
        userId: user.id,
        timezone: 'UTC',
        language: 'en'
      });

      await trx.commit();
      return user;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    await this.query()
      .findById(id)
      .patch({ lastLoginAt: new Date() });
  }

  static async getInstructorStats(instructorId: string): Promise<{
    totalCourses: number;
    totalStudents: number;
    totalRevenue: number;
    averageRating: number;
  }> {
    const stats = await knex.raw(`
      SELECT 
        COUNT(DISTINCT c.id) as total_courses,
        COUNT(DISTINCT e.user_id) as total_students,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COALESCE(AVG(cr.rating), 0) as average_rating
      FROM users u
      LEFT JOIN courses c ON u.id = c.instructor_id AND c.status = 'published'
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      LEFT JOIN payments p ON c.id = p.course_id AND p.status = 'completed'
      LEFT JOIN course_reviews cr ON c.id = cr.course_id AND cr.is_published = true
      WHERE u.id = ?
      GROUP BY u.id
    `, [instructorId]);

    return {
      totalCourses: parseInt(stats.rows[0]?.total_courses || '0'),
      totalStudents: parseInt(stats.rows[0]?.total_students || '0'),
      totalRevenue: parseFloat(stats.rows[0]?.total_revenue || '0'),
      averageRating: parseFloat(stats.rows[0]?.average_rating || '0')
    };
  }

  static async getStudentStats(studentId: string): Promise<{
    totalEnrollments: number;
    completedCourses: number;
    totalWatchTime: number;
    certificatesEarned: number;
  }> {
    const stats = await knex.raw(`
      SELECT 
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) as completed_courses,
        COALESCE(SUM(lp.watch_time), 0) as total_watch_time,
        COUNT(DISTINCT cert.id) as certificates_earned
      FROM users u
      LEFT JOIN enrollments e ON u.id = e.user_id
      LEFT JOIN lesson_progress lp ON u.id = lp.user_id
      LEFT JOIN certificates cert ON u.id = cert.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [studentId]);

    return {
      totalEnrollments: parseInt(stats.rows[0]?.total_enrollments || '0'),
      completedCourses: parseInt(stats.rows[0]?.completed_courses || '0'),
      totalWatchTime: parseInt(stats.rows[0]?.total_watch_time || '0'),
      certificatesEarned: parseInt(stats.rows[0]?.certificates_earned || '0')
    };
  }
}

export class UserProfile extends Model {
  static tableName = 'user_profiles';

  id!: string;
  userId!: string;
  dateOfBirth?: Date;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone!: string;
  language!: string;
  learningGoals?: string[];
  interests?: string[];
  educationLevel?: string;
  occupation?: string;
  company?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'user_profiles.userId',
        to: 'users.id'
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

export default User;