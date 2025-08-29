import fetch from 'node-fetch';

export class ImageService {
  private static readonly UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  
  /**
   * Get image from Unsplash API
   */
  static async getUnsplashImage(
    query: string,
    width = 800,
    height = 600,
    category = 'education'
  ): Promise<string> {
    if (!this.UNSPLASH_ACCESS_KEY) {
      return this.getFallbackImage(width, height, query);
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' ' + category)}&w=${width}&h=${height}&per_page=1`,
        {
          headers: {
            'Authorization': `Client-ID ${this.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      const data = await response.json();
      return data.results?.[0]?.urls?.regular || this.getFallbackImage(width, height, query);
    } catch (error) {
      console.error('Unsplash API error:', error);
      return this.getFallbackImage(width, height, query);
    }
  }

  /**
   * Get AI-generated image from OpenAI DALL-E
   */
  static async getAIGeneratedImage(
    prompt: string,
    size: '256x256' | '512x512' | '1024x1024' = '512x512'
  ): Promise<string> {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return this.getFallbackImage(512, 512, prompt);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Professional educational image: ${prompt}`,
          size: size,
          quality: 'standard',
          n: 1,
        }),
      });

      const data = await response.json();
      return data.data?.[0]?.url || this.getFallbackImage(512, 512, prompt);
    } catch (error) {
      console.error('OpenAI DALL-E error:', error);
      return this.getFallbackImage(512, 512, prompt);
    }
  }

  /**
   * Smart image selection for templates
   */
  static async getTemplateImage(
    type: 'course' | 'avatar' | 'hero' | 'icon',
    subject: string,
    width = 400,
    height = 300
  ): Promise<string> {
    const queries = {
      course: `${subject} learning education course`,
      avatar: `professional person teacher instructor`,
      hero: `${subject} education learning background`,
      icon: `${subject} icon symbol`
    };

    return await this.getUnsplashImage(queries[type], width, height);
  }

  /**
   * Fallback to placeholder service
   */
  private static getFallbackImage(width: number, height: number, text: string): string {
    const encodedText = encodeURIComponent(text.substring(0, 20));
    return `https://via.placeholder.com/${width}x${height}/4f46e5/ffffff?text=${encodedText}`;
  }

  /**
   * Get educational placeholder images
   */
  static getEducationalPlaceholder(
    type: 'course' | 'avatar' | 'hero',
    index = 1,
    width = 400,
    height = 300
  ): string {
    const seeds = {
      course: [1, 15, 23, 42, 67],
      avatar: [8, 16, 24, 32, 48],
      hero: [5, 10, 20, 30, 40]
    };
    
    const seed = seeds[type][index % seeds[type].length];
    return `https://picsum.photos/${width}/${height}?random=${seed}`;
  }
}