/**
 * Production services loader with graceful fallbacks
 * Only loads Docker/nginx services when available
 */

interface ProductionServicesInterface {
  containerManager?: any;
  proxyManager?: any; 
  productionDevServerManager?: any;
  isProductionMode: boolean;
  isDockerAvailable: boolean;
}

class ProductionServices implements ProductionServicesInterface {
  public containerManager?: any;
  public proxyManager?: any;
  public productionDevServerManager?: any;
  public isProductionMode: boolean = false;
  public isDockerAvailable: boolean = false;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    const isProduction = process.env.NODE_ENV === 'production';
    const forceProduction = process.env.FORCE_PRODUCTION_SERVICES === 'true';
    
    this.isProductionMode = isProduction || forceProduction;

    if (!this.isProductionMode) {
      console.log('🔧 Development mode: Production services disabled');
      return;
    }

    // Try to initialize Docker services
    this.initializeDockerServices();
    
    // Try to initialize proxy services
    this.initializeProxyServices();

    // Initialize production dev server manager if Docker is available
    if (this.isDockerAvailable) {
      this.initializeProductionDevServerManager();
    }
  }

  private initializeDockerServices() {
    try {
      // Dynamically import Docker services only if available
      const { containerManager } = require('./ContainerManager');
      this.containerManager = containerManager;
      this.isDockerAvailable = true;
      console.log('✅ Docker services initialized');
    } catch (error) {
      console.log('⚠️ Docker services not available:', error.message);
      console.log('   This is normal in development - using DevServerManager instead');
    }
  }

  private initializeProxyServices() {
    try {
      const { proxyManager } = require('./ProxyManager');
      this.proxyManager = proxyManager;
      console.log('✅ Proxy services initialized');
    } catch (error) {
      console.log('⚠️ Proxy services not available:', error.message);
      console.log('   Using localhost URLs instead of custom domains');
    }
  }

  private initializeProductionDevServerManager() {
    try {
      const { productionDevServerManager } = require('./ProductionDevServerManager');
      this.productionDevServerManager = productionDevServerManager;
      console.log('✅ Production DevServer Manager initialized');
    } catch (error) {
      console.log('⚠️ Production DevServer Manager not available:', error.message);
    }
  }

  /**
   * Get the appropriate dev server manager for current environment
   */
  public getDevServerManager() {
    if (this.isProductionMode && this.productionDevServerManager) {
      return this.productionDevServerManager;
    }
    
    // Fallback to original DevServerManager
    const { devServerManager } = require('./DevServerManager');
    return devServerManager;
  }

  /**
   * Check if production features are available
   */
  public hasContainerSupport(): boolean {
    return this.isDockerAvailable && !!this.containerManager;
  }

  public hasProxySupport(): boolean {
    return !!this.proxyManager;
  }

  public hasProductionSupport(): boolean {
    return this.hasContainerSupport() && this.hasProxySupport();
  }

  /**
   * Get service status for health checks
   */
  public getServiceStatus() {
    return {
      productionMode: this.isProductionMode,
      dockerAvailable: this.isDockerAvailable,
      containerManager: !!this.containerManager,
      proxyManager: !!this.proxyManager,
      productionDevServerManager: !!this.productionDevServerManager
    };
  }
}

export const productionServices = new ProductionServices();