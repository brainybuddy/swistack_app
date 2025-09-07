import { ProjectService } from './ProjectService';
import { ContainerConfig } from '@swistack/shared/types/project';

export interface PortAllocation {
  projectId: string;
  projectName: string;
  frontendPort: number;
  backendPort: number;
  reservedPorts: number[];
  allocationStrategy: 'block-based' | 'spaced';
  allocatedAt: Date;
}

export interface PortAllocationStrategy {
  name: 'block-based' | 'spaced';
  description: string;
  example: string;
}

export class PortAllocationManager {
  private static instance: PortAllocationManager;
  private allocatedPorts: Map<string, PortAllocation> = new Map();
  private readonly BASE_PORT = 5200;
  private readonly BLOCK_SIZE = 10; // 10 ports per project block
  private readonly SPACE_SIZE = 20;  // 20 port gap between spaced projects

  public static getInstance(): PortAllocationManager {
    if (!PortAllocationManager.instance) {
      PortAllocationManager.instance = new PortAllocationManager();
    }
    return PortAllocationManager.instance;
  }

  private constructor() {
    // Don't load existing allocations in constructor to avoid circular dependency
    // Call loadExistingAllocations() after the ProjectService is fully initialized
  }

  /**
   * Get available port allocation strategies
   */
  public getStrategies(): PortAllocationStrategy[] {
    return [
      {
        name: 'block-based',
        description: 'Allocates 10 consecutive ports per project',
        example: 'Project 1: 5200-5209 (5200=frontend, 5201=backend, 5202-5209=reserved)\nProject 2: 5210-5219 (5210=frontend, 5211=backend, 5212-5219=reserved)'
      },
      {
        name: 'spaced',
        description: 'Allocates ports with 20-port gaps between projects',
        example: 'Project 1: 5200=frontend, 5210=backend, 5201-5209=reserved\nProject 2: 5220=frontend, 5230=backend, 5221-5229=reserved'
      }
    ];
  }

  /**
   * Allocate ports for a new project
   */
  public async allocatePortsForProject(
    projectId: string, 
    projectName: string, 
    strategy: 'block-based' | 'spaced' = 'spaced'
  ): Promise<PortAllocation> {
    // Check if project already has allocation
    const existing = this.allocatedPorts.get(projectId);
    if (existing) {
      return existing;
    }

    const allocation = this.calculateNextAllocation(strategy);
    const portAllocation: PortAllocation = {
      projectId,
      projectName,
      frontendPort: allocation.frontendPort,
      backendPort: allocation.backendPort,
      reservedPorts: allocation.reservedPorts,
      allocationStrategy: strategy,
      allocatedAt: new Date()
    };

    // Store allocation
    this.allocatedPorts.set(projectId, portAllocation);
    
    // Update project's container config with port allocation
    await this.updateProjectPorts(projectId, portAllocation);

    console.log(`🔌 Port allocation for ${projectName}:`, {
      frontend: portAllocation.frontendPort,
      backend: portAllocation.backendPort,
      reserved: portAllocation.reservedPorts,
      strategy
    });

    return portAllocation;
  }

  /**
   * Get port allocation for a specific project
   */
  public getProjectAllocation(projectId: string): PortAllocation | undefined {
    return this.allocatedPorts.get(projectId);
  }

  /**
   * Get all port allocations
   */
  public getAllAllocations(): PortAllocation[] {
    return Array.from(this.allocatedPorts.values());
  }

  /**
   * Check if a specific port is available
   */
  public isPortAvailable(port: number): boolean {
    // Validate port range (1024-65535 for user applications)
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      return false;
    }

    for (const allocation of this.allocatedPorts.values()) {
      if (allocation.frontendPort === port || 
          allocation.backendPort === port || 
          allocation.reservedPorts.includes(port)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reserve specific ports for existing project (like ecommerce)
   */
  public async reservePortsForExistingProject(
    projectId: string,
    projectName: string,
    frontendPort: number,
    backendPort: number,
    reservedPorts: number[]
  ): Promise<PortAllocation> {
    // Validate port format and ranges
    const allPorts = [frontendPort, backendPort, ...reservedPorts];
    for (const port of allPorts) {
      if (!Number.isInteger(port) || port < 1024 || port > 65535) {
        throw new Error(`Port ${port} is invalid. Must be integer between 1024-65535`);
      }
      if (!this.isPortAvailable(port)) {
        throw new Error(`Port ${port} is already allocated`);
      }
    }

    // Check for port conflicts within the request
    const uniquePorts = new Set(allPorts);
    if (uniquePorts.size !== allPorts.length) {
      throw new Error('Duplicate ports found in allocation request');
    }

    const allocation: PortAllocation = {
      projectId,
      projectName,
      frontendPort,
      backendPort,
      reservedPorts,
      allocationStrategy: 'spaced', // Assume spaced for manual allocation
      allocatedAt: new Date()
    };

    this.allocatedPorts.set(projectId, allocation);
    await this.updateProjectPorts(projectId, allocation);

    console.log(`🔌 Manual port reservation for ${projectName}:`, allocation);
    return allocation;
  }

  /**
   * Release port allocation for a project
   */
  public async releaseProjectPorts(projectId: string): Promise<boolean> {
    const allocation = this.allocatedPorts.get(projectId);
    if (!allocation) {
      return false;
    }

    try {
      // Remove ports from database by clearing container config ports
      const { ProjectService } = await import('./ProjectService');
      const project = await ProjectService.getProject(projectId);
      
      if (project) {
        await ProjectService.updateProject(projectId, project.ownerId, {
          settings: {
            ...project.settings,
            containerConfig: {
              ...project.settings.containerConfig,
              ports: undefined // Clear port allocation
            }
          }
        });
      }

      // Remove from memory
      this.allocatedPorts.delete(projectId);
      console.log(`🔌 Released ports for project ${allocation.projectName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to release ports for project ${projectId}:`, error);
      return false;
    }
  }

  /**
   * Calculate next available port allocation based on strategy
   */
  private calculateNextAllocation(strategy: 'block-based' | 'spaced'): {
    frontendPort: number;
    backendPort: number;
    reservedPorts: number[];
  } {
    const existingAllocations = this.getAllAllocations();
    
    if (existingAllocations.length === 0) {
      // First project allocation
      if (strategy === 'block-based') {
        return {
          frontendPort: this.BASE_PORT,
          backendPort: this.BASE_PORT + 1,
          reservedPorts: Array.from({length: 8}, (_, i) => this.BASE_PORT + 2 + i)
        };
      } else {
        // Spaced strategy
        return {
          frontendPort: this.BASE_PORT,
          backendPort: this.BASE_PORT + 10, // 10 port gap
          reservedPorts: Array.from({length: 9}, (_, i) => this.BASE_PORT + 1 + i)
        };
      }
    }

    // Find next available allocation
    const allocatedPorts = new Set<number>();
    for (const allocation of existingAllocations) {
      allocatedPorts.add(allocation.frontendPort);
      allocatedPorts.add(allocation.backendPort);
      allocation.reservedPorts.forEach(port => allocatedPorts.add(port));
    }

    if (strategy === 'block-based') {
      // Find next available block of 10 ports
      let currentBlock = Math.floor(this.BASE_PORT / this.BLOCK_SIZE) * this.BLOCK_SIZE;
      while (true) {
        const blockStart = currentBlock;
        const blockEnd = currentBlock + this.BLOCK_SIZE - 1;
        
        // Check if entire block is available
        let blockAvailable = true;
        for (let port = blockStart; port <= blockEnd; port++) {
          if (allocatedPorts.has(port)) {
            blockAvailable = false;
            break;
          }
        }

        if (blockAvailable) {
          return {
            frontendPort: blockStart,
            backendPort: blockStart + 1,
            reservedPorts: Array.from({length: 8}, (_, i) => blockStart + 2 + i)
          };
        }

        currentBlock += this.BLOCK_SIZE;
        
        // Safety check to avoid infinite loop
        if (currentBlock > this.BASE_PORT + 10000) {
          throw new Error('No available port blocks found');
        }
      }
    } else {
      // Spaced strategy - find next available 20-port space
      let currentSpace = this.BASE_PORT;
      while (true) {
        const frontendPort = currentSpace;
        const backendPort = currentSpace + 10;
        const reservedPorts = Array.from({length: 9}, (_, i) => currentSpace + 1 + i);
        
        // Check if all ports in this space are available
        const spaceAvailable = ![frontendPort, backendPort, ...reservedPorts]
          .some(port => allocatedPorts.has(port));

        if (spaceAvailable) {
          return { frontendPort, backendPort, reservedPorts };
        }

        currentSpace += this.SPACE_SIZE;
        
        // Safety check
        if (currentSpace > this.BASE_PORT + 10000) {
          throw new Error('No available port spaces found');
        }
      }
    }
  }

  /**
   * Update project's container config with allocated ports
   */
  private async updateProjectPorts(projectId: string, allocation: PortAllocation): Promise<void> {
    try {
      // Use dynamic import to avoid circular dependency
      const { ProjectService } = await import('./ProjectService');
      const project = await ProjectService.getProject(projectId);
      
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Create or update container config
      const containerConfig = {
        ...project.settings.containerConfig,
        ports: {
          frontend: allocation.frontendPort,
          backend: allocation.backendPort,
          // Add reserved ports as well for reference
          ...Object.fromEntries(
            allocation.reservedPorts.map((port, i) => [`reserved_${i + 1}`, port])
          )
        }
      };

      // Update project settings
      await ProjectService.updateProject(projectId, project.ownerId, {
        settings: {
          ...project.settings,
          containerConfig
        }
      });

      console.log(`✅ Updated project ${project.name} with port allocation`);
    } catch (error) {
      console.error(`❌ Failed to update project ports:`, error);
      throw error;
    }
  }

  /**
   * Load existing port allocations from database
   */
  public async loadExistingAllocations(): Promise<void> {
    try {
      // Use dynamic import to avoid circular dependency
      const { Project } = await import('../models/Project');
      
      // Get all projects with container configs
      const projects = await Project.query()
        .select('id', 'name', 'settings', 'createdAt')
        .where('status', '!=', 'deleted');

      for (const project of projects) {
        const ports = project.settings?.containerConfig?.ports;
        if (ports && ports.frontend && ports.backend) {
          // Reconstruct allocation from existing project
          const reservedPorts: number[] = [];
          Object.entries(ports).forEach(([key, port]) => {
            if (key.startsWith('reserved_') && typeof port === 'number') {
              reservedPorts.push(port);
            }
          });

          const allocation: PortAllocation = {
            projectId: project.id,
            projectName: project.name,
            frontendPort: ports.frontend as number,
            backendPort: ports.backend as number,
            reservedPorts,
            allocationStrategy: 'spaced', // Default assumption
            allocatedAt: project.createdAt
          };

          this.allocatedPorts.set(project.id, allocation);
        }
      }

      console.log(`🔌 Loaded ${this.allocatedPorts.size} existing port allocations`);
    } catch (error) {
      console.error('❌ Failed to load existing port allocations:', error);
      // Don't throw error during initialization - just log and continue
    }
  }

  /**
   * Generate package.json scripts with allocated ports
   */
  public generatePackageJsonScripts(allocation: PortAllocation): Record<string, string> {
    return {
      "dev": `concurrently "npm run dev:backend" "npm run dev:frontend"`,
      "dev:frontend": `next dev -p ${allocation.frontendPort}`,
      "dev:backend": `tsx watch src/server.ts`,
      "start": `concurrently "npm run start:backend" "npm run start:frontend"`,
      "start:frontend": `next start -p ${allocation.frontendPort}`,
      "start:backend": `node dist/server.js`,
      "build": "next build && tsc",
      "build:frontend": "next build",
      "build:backend": "tsc"
    };
  }

  /**
   * Generate environment variables for allocated ports
   */
  public generateEnvironmentVariables(allocation: PortAllocation): Record<string, string> {
    return {
      FRONTEND_PORT: allocation.frontendPort.toString(),
      BACKEND_PORT: allocation.backendPort.toString(),
      NEXT_PUBLIC_API_URL: `http://localhost:${allocation.backendPort}`,
      PORT: allocation.backendPort.toString() // For backend server
    };
  }
}

export const portAllocationManager = PortAllocationManager.getInstance();