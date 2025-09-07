import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ProxyConfig {
  projectId: string;
  projectName: string;
  userId: string;
  username: string;
  subdomain: string;
  targetPort: number;
  domain: string; // e.g., 'swistack.dev'
  fullDomain: string; // e.g., 'project-username.swistack.dev'
  sslEnabled: boolean;
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
}

export class ProxyManager {
  private static instance: ProxyManager;
  private proxies: Map<string, ProxyConfig> = new Map();
  private readonly nginxConfigDir = '/etc/nginx/sites-available';
  private readonly nginxEnabledDir = '/etc/nginx/sites-enabled';
  private readonly baseDomain = process.env.BASE_DOMAIN || 'swistack.dev';
  private readonly sslEnabled = process.env.SSL_ENABLED === 'true';

  public static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  private constructor() {
    this.initializeNginx();
  }

  private async initializeNginx() {
    try {
      await this.ensureDirectories();
      await this.createMainNginxConfig();
      console.log('✅ Nginx proxy manager initialized');
    } catch (error) {
      console.error('Failed to initialize Nginx proxy manager:', error);
    }
  }

  private async ensureDirectories() {
    try {
      await fs.mkdir(this.nginxConfigDir, { recursive: true });
      await fs.mkdir(this.nginxEnabledDir, { recursive: true });
    } catch (error) {
      // Directories might already exist or we might not have permissions
      // This is fine for development
    }
  }

  private async createMainNginxConfig() {
    const mainConfig = `
# Main nginx configuration for SwiStack
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
    multi_accept on;
    use epoll;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_names_hash_bucket_size 128;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4;

    # Logging Settings
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=preview:10m rate=5r/s;

    # Default server block (catch-all)
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        
        # Redirect to main domain
        return 301 https://${this.baseDomain}$request_uri;
    }

    # Main SwiStack application
    server {
        listen 80;
        listen [::]:80;
        ${this.sslEnabled ? `
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        ssl_certificate /etc/ssl/certs/swistack.pem;
        ssl_certificate_key /etc/ssl/private/swistack.key;
        ` : ''}
        
        server_name ${this.baseDomain};

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Main application (frontend)
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # API backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 60s;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Include project-specific configurations
    include ${this.nginxEnabledDir}/*;
}
`.trim();

    try {
      await fs.writeFile('/tmp/nginx.conf', mainConfig, 'utf8');
      console.log('📝 Generated main nginx configuration at /tmp/nginx.conf');
    } catch (error) {
      console.error('Failed to write nginx config:', error);
    }
  }

  /**
   * Create a custom domain proxy for a project
   */
  async createProjectProxy(
    projectId: string,
    projectName: string,
    userId: string,
    username: string,
    targetPort: number
  ): Promise<ProxyConfig | null> {
    try {
      const subdomain = this.generateSubdomain(projectName, username);
      const fullDomain = `${subdomain}.${this.baseDomain}`;

      const proxyConfig: ProxyConfig = {
        projectId,
        projectName,
        userId,
        username,
        subdomain,
        targetPort,
        domain: this.baseDomain,
        fullDomain,
        sslEnabled: this.sslEnabled,
        status: 'inactive',
        createdAt: new Date()
      };

      // Generate nginx configuration for this project
      await this.generateProjectNginxConfig(proxyConfig);

      // Enable the site
      await this.enableSite(proxyConfig);

      // Reload nginx
      await this.reloadNginx();

      proxyConfig.status = 'active';
      this.proxies.set(projectId, proxyConfig);

      console.log(`✅ Created proxy: ${fullDomain} → localhost:${targetPort}`);
      return proxyConfig;

    } catch (error) {
      console.error('Failed to create project proxy:', error);
      return null;
    }
  }

  /**
   * Remove a project proxy
   */
  async removeProjectProxy(projectId: string): Promise<boolean> {
    const proxyConfig = this.proxies.get(projectId);
    if (!proxyConfig) {
      return false;
    }

    try {
      await this.disableSite(proxyConfig);
      await this.removeNginxConfig(proxyConfig);
      await this.reloadNginx();

      this.proxies.delete(projectId);
      console.log(`✅ Removed proxy for ${proxyConfig.fullDomain}`);
      return true;

    } catch (error) {
      console.error('Failed to remove project proxy:', error);
      return false;
    }
  }

  /**
   * Generate subdomain from project name and username
   */
  private generateSubdomain(projectName: string, username: string): string {
    const cleanProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);
    
    const cleanUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .substring(0, 15);

    return `${cleanProjectName}-${cleanUsername}`;
  }

  /**
   * Generate nginx configuration for a specific project
   */
  private async generateProjectNginxConfig(config: ProxyConfig) {
    const nginxConfig = `
# SwiStack project: ${config.projectName}
# User: ${config.username}
# Generated: ${config.createdAt.toISOString()}

server {
    listen 80;
    listen [::]:80;
    ${config.sslEnabled ? `
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    ssl_certificate /etc/ssl/certs/swistack-wildcard.pem;
    ssl_certificate_key /etc/ssl/private/swistack-wildcard.key;
    ` : ''}
    
    server_name ${config.fullDomain};

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Rate limiting for preview sites
    limit_req zone=preview burst=10 nodelay;

    # Project preview
    location / {
        # CORS headers for preview functionality
        add_header Access-Control-Allow-Origin "https://${this.baseDomain}" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept, Authorization" always;
        
        proxy_pass http://localhost:${config.targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Project-Id "${config.projectId}";
        proxy_set_header X-User-Id "${config.userId}";
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 10s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Handle container startup delays
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
    }

    # Hot reload and WebSocket support for development
    location /_next/webpack-hmr {
        proxy_pass http://localhost:${config.targetPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:${config.targetPort};
        proxy_set_header Host $host;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /_health {
        access_log off;
        proxy_pass http://localhost:${config.targetPort};
        proxy_set_header Host $host;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }

    # Custom error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        return 200 '<!DOCTYPE html><html><head><title>Project Starting</title><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5}h1{color:#666}p{color:#999}</style></head><body><h1>🚀 Project Starting</h1><p>Your project is starting up. Please wait a moment and refresh the page.</p><p><a href="javascript:location.reload()">Refresh</a></p></body></html>';
        add_header Content-Type text/html;
    }
}
`.trim();

    const configPath = path.join('/tmp', `swistack-${config.projectId}.conf`);
    await fs.writeFile(configPath, nginxConfig, 'utf8');
    console.log(`📝 Generated nginx config for ${config.fullDomain}`);
  }

  /**
   * Enable a site (symlink to sites-enabled)
   */
  private async enableSite(config: ProxyConfig) {
    const availablePath = path.join('/tmp', `swistack-${config.projectId}.conf`);
    const enabledPath = path.join('/tmp', `swistack-${config.projectId}-enabled.conf`);
    
    try {
      // In production, this would create symlinks in /etc/nginx/sites-enabled
      await fs.copyFile(availablePath, enabledPath);
      console.log(`✅ Enabled site: ${config.fullDomain}`);
    } catch (error) {
      console.error('Failed to enable site:', error);
    }
  }

  /**
   * Disable a site
   */
  private async disableSite(config: ProxyConfig) {
    const enabledPath = path.join('/tmp', `swistack-${config.projectId}-enabled.conf`);
    
    try {
      await fs.unlink(enabledPath);
      console.log(`✅ Disabled site: ${config.fullDomain}`);
    } catch (error) {
      // File might not exist
    }
  }

  /**
   * Remove nginx configuration files
   */
  private async removeNginxConfig(config: ProxyConfig) {
    const availablePath = path.join('/tmp', `swistack-${config.projectId}.conf`);
    
    try {
      await fs.unlink(availablePath);
    } catch (error) {
      // File might not exist
    }
  }

  /**
   * Reload nginx configuration
   */
  private async reloadNginx() {
    try {
      // In development, we'll just log this
      console.log('🔄 Would reload nginx configuration (nginx -s reload)');
      
      // In production, uncomment this:
      // await execAsync('sudo nginx -t && sudo nginx -s reload');
    } catch (error) {
      console.error('Failed to reload nginx:', error);
    }
  }

  /**
   * Get all active proxies
   */
  getActiveProxies(): ProxyConfig[] {
    return Array.from(this.proxies.values());
  }

  /**
   * Get proxy configuration for a project
   */
  getProxyConfig(projectId: string): ProxyConfig | null {
    return this.proxies.get(projectId) || null;
  }

  /**
   * Test if a domain is available
   */
  async isDomainAvailable(subdomain: string): Promise<boolean> {
    const fullDomain = `${subdomain}.${this.baseDomain}`;
    const existing = Array.from(this.proxies.values())
      .find(proxy => proxy.fullDomain === fullDomain);
    
    return !existing;
  }

  /**
   * Get project URL (custom domain or fallback to localhost)
   */
  getProjectUrl(projectId: string, fallbackPort?: number): string {
    const proxyConfig = this.proxies.get(projectId);
    
    if (proxyConfig && proxyConfig.status === 'active') {
      const protocol = proxyConfig.sslEnabled ? 'https' : 'http';
      return `${protocol}://${proxyConfig.fullDomain}`;
    }
    
    // Fallback to localhost
    if (fallbackPort) {
      return `http://localhost:${fallbackPort}`;
    }
    
    return '';
  }
}

export const proxyManager = ProxyManager.getInstance();