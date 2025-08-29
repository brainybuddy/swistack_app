import { OperationalTransform, TextOperation } from './operational-transform';

export interface ConflictResolution {
  resolved: boolean;
  finalOperation?: TextOperation;
  conflictedOperations: TextOperation[];
  resolutionStrategy: 'merge' | 'override' | 'manual';
  metadata?: {
    timestamp: Date;
    userId: string;
    reason: string;
  };
}

export interface ConflictStrategy {
  name: string;
  priority: number;
  canResolve: (op1: TextOperation, op2: TextOperation) => boolean;
  resolve: (op1: TextOperation, op2: TextOperation, context?: any) => ConflictResolution;
}

export class ConflictResolver {
  private strategies: ConflictStrategy[] = [];

  constructor() {
    // Register default conflict resolution strategies
    this.registerStrategy(new TimestampBasedStrategy());
    this.registerStrategy(new UserPriorityStrategy());
    this.registerStrategy(new ContentMergeStrategy());
    this.registerStrategy(new PositionBasedStrategy());
  }

  registerStrategy(strategy: ConflictStrategy) {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  resolveConflict(
    operations: TextOperation[], 
    context?: {
      baseContent: string;
      userPriorities?: Map<string, number>;
      documentVersion: number;
    }
  ): ConflictResolution {
    if (operations.length < 2) {
      return {
        resolved: true,
        finalOperation: operations[0],
        conflictedOperations: [],
        resolutionStrategy: 'merge'
      };
    }

    // Try each strategy in priority order
    for (const strategy of this.strategies) {
      if (operations.length === 2 && strategy.canResolve(operations[0], operations[1])) {
        const resolution = strategy.resolve(operations[0], operations[1], context);
        if (resolution.resolved) {
          return resolution;
        }
      }
    }

    // If no strategy can resolve, fall back to manual resolution
    return {
      resolved: false,
      conflictedOperations: operations,
      resolutionStrategy: 'manual',
      metadata: {
        timestamp: new Date(),
        userId: 'system',
        reason: 'No automatic resolution strategy available'
      }
    };
  }

  // Detect if operations conflict
  static detectConflict(op1: TextOperation, op2: TextOperation, baseContent: string): boolean {
    try {
      // Apply operations in both orders and see if results differ
      const result1 = OperationalTransform.apply(
        OperationalTransform.apply(baseContent, op1), 
        op2
      );
      const result2 = OperationalTransform.apply(
        OperationalTransform.apply(baseContent, op2), 
        op1
      );
      
      return result1 !== result2;
    } catch (error) {
      // If operations can't be applied in sequence, they likely conflict
      return true;
    }
  }

  // Merge multiple operations into a single operation
  static mergeOperations(operations: TextOperation[], baseContent: string): TextOperation {
    if (operations.length === 0) {
      return OperationalTransform.createTextOperation();
    }

    let result = operations[0];
    for (let i = 1; i < operations.length; i++) {
      try {
        result = OperationalTransform.compose(result, operations[i]);
      } catch (error) {
        console.warn('Failed to compose operations, using last operation:', error);
        result = operations[i];
      }
    }

    return result;
  }
}

// Strategy implementations
class TimestampBasedStrategy implements ConflictStrategy {
  name = 'timestamp-based';
  priority = 1;

  canResolve(op1: TextOperation, op2: TextOperation): boolean {
    // Can resolve if operations have timestamps
    return op1.ops.length > 0 && op2.ops.length > 0 && 
           !!op1.ops[0].timestamp && !!op2.ops[0].timestamp;
  }

  resolve(op1: TextOperation, op2: TextOperation): ConflictResolution {
    const timestamp1 = op1.ops[0].timestamp?.getTime() || 0;
    const timestamp2 = op2.ops[0].timestamp?.getTime() || 0;

    // Later operation wins
    const winnerOp = timestamp1 >= timestamp2 ? op1 : op2;
    const loserOp = timestamp1 >= timestamp2 ? op2 : op1;

    return {
      resolved: true,
      finalOperation: winnerOp,
      conflictedOperations: [loserOp],
      resolutionStrategy: 'override',
      metadata: {
        timestamp: new Date(),
        userId: winnerOp.ops[0].userId,
        reason: 'Resolved using timestamp priority'
      }
    };
  }
}

class UserPriorityStrategy implements ConflictStrategy {
  name = 'user-priority';
  priority = 2;

  canResolve(op1: TextOperation, op2: TextOperation): boolean {
    return op1.ops.length > 0 && op2.ops.length > 0;
  }

  resolve(op1: TextOperation, op2: TextOperation, context?: any): ConflictResolution {
    const userPriorities = context?.userPriorities as Map<string, number> | undefined;
    if (!userPriorities) {
      return { resolved: false, conflictedOperations: [op1, op2], resolutionStrategy: 'manual' };
    }

    const user1Priority = userPriorities.get(op1.ops[0].userId) || 0;
    const user2Priority = userPriorities.get(op2.ops[0].userId) || 0;

    if (user1Priority !== user2Priority) {
      const winnerOp = user1Priority > user2Priority ? op1 : op2;
      const loserOp = user1Priority > user2Priority ? op2 : op1;

      return {
        resolved: true,
        finalOperation: winnerOp,
        conflictedOperations: [loserOp],
        resolutionStrategy: 'override',
        metadata: {
          timestamp: new Date(),
          userId: winnerOp.ops[0].userId,
          reason: 'Resolved using user priority'
        }
      };
    }

    return { resolved: false, conflictedOperations: [op1, op2], resolutionStrategy: 'manual' };
  }
}

class ContentMergeStrategy implements ConflictStrategy {
  name = 'content-merge';
  priority = 3;

  canResolve(op1: TextOperation, op2: TextOperation): boolean {
    // Can attempt to merge if both operations are insertions at different positions
    return this.areNonOverlappingInserts(op1, op2);
  }

  resolve(op1: TextOperation, op2: TextOperation, context?: any): ConflictResolution {
    try {
      // Try to merge operations using operational transform
      const [transformed1, transformed2] = OperationalTransform.transform(op1, op2, 'left');
      const merged = OperationalTransform.compose(transformed1, transformed2);

      return {
        resolved: true,
        finalOperation: merged,
        conflictedOperations: [],
        resolutionStrategy: 'merge',
        metadata: {
          timestamp: new Date(),
          userId: 'system',
          reason: 'Successfully merged non-conflicting operations'
        }
      };
    } catch (error) {
      return { resolved: false, conflictedOperations: [op1, op2], resolutionStrategy: 'manual' };
    }
  }

  private areNonOverlappingInserts(op1: TextOperation, op2: TextOperation): boolean {
    // Simplified check - in reality, would need more sophisticated analysis
    const hasOnlyInserts = (op: TextOperation) => 
      op.ops.every(operation => operation.type === 'insert' || operation.type === 'retain');
    
    return hasOnlyInserts(op1) && hasOnlyInserts(op2);
  }
}

class PositionBasedStrategy implements ConflictStrategy {
  name = 'position-based';
  priority = 4;

  canResolve(op1: TextOperation, op2: TextOperation): boolean {
    // Can resolve if operations affect different positions
    return !this.operationsOverlap(op1, op2);
  }

  resolve(op1: TextOperation, op2: TextOperation): ConflictResolution {
    // If operations don't overlap, we can apply both
    try {
      const [transformed1, transformed2] = OperationalTransform.transform(op1, op2, 'left');
      const merged = OperationalTransform.compose(transformed1, transformed2);

      return {
        resolved: true,
        finalOperation: merged,
        conflictedOperations: [],
        resolutionStrategy: 'merge',
        metadata: {
          timestamp: new Date(),
          userId: 'system',
          reason: 'Merged non-overlapping operations'
        }
      };
    } catch (error) {
      return { resolved: false, conflictedOperations: [op1, op2], resolutionStrategy: 'manual' };
    }
  }

  private operationsOverlap(op1: TextOperation, op2: TextOperation): boolean {
    // Simplified overlap detection
    // In practice, would need more sophisticated position tracking
    let pos1 = 0;
    let pos2 = 0;

    for (const op of op1.ops) {
      if (op.type === 'retain') pos1 += op.length || 0;
      else if (op.type === 'delete') pos1 += op.length || 0;
    }

    for (const op of op2.ops) {
      if (op.type === 'retain') pos2 += op.length || 0;
      else if (op.type === 'delete') pos2 += op.length || 0;
    }

    // This is a very simplified check
    return Math.abs(pos1 - pos2) < 10; // Arbitrary overlap threshold
  }
}

// Utility functions for conflict resolution
export class ConflictUtils {
  static createResolutionSummary(resolution: ConflictResolution): string {
    switch (resolution.resolutionStrategy) {
      case 'merge':
        return 'Operations were successfully merged automatically';
      case 'override':
        return `Conflict resolved by choosing one operation (${resolution.metadata?.reason})`;
      case 'manual':
        return 'Conflict requires manual resolution';
      default:
        return 'Unknown resolution strategy';
    }
  }

  static shouldNotifyUsers(resolution: ConflictResolution): boolean {
    return resolution.resolutionStrategy === 'override' || !resolution.resolved;
  }

  static getAffectedUsers(operations: TextOperation[]): string[] {
    const users = new Set<string>();
    operations.forEach(op => {
      op.ops.forEach(operation => {
        if (operation.userId) {
          users.add(operation.userId);
        }
      });
    });
    return Array.from(users);
  }
}

export { ConflictResolver as default };