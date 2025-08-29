// Operation is defined locally in this file

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: Date;
}

export interface TextOperation {
  ops: Operation[];
  baseLength: number;
  targetLength: number;
}

export class OperationalTransform {
  static createTextOperation(): TextOperation {
    return {
      ops: [],
      baseLength: 0,
      targetLength: 0
    };
  }

  static retain(op: TextOperation, n: number): TextOperation {
    if (n === 0) return op;
    
    const lastOp = op.ops[op.ops.length - 1];
    if (lastOp && lastOp.type === 'retain') {
      lastOp.length = (lastOp.length || 0) + n;
    } else {
      op.ops.push({
        type: 'retain',
        position: 0, // Will be calculated when applying
        length: n,
        userId: '',
        timestamp: new Date()
      });
    }
    
    op.baseLength += n;
    op.targetLength += n;
    return op;
  }

  static insert(op: TextOperation, text: string, userId: string): TextOperation {
    if (text.length === 0) return op;

    const lastOp = op.ops[op.ops.length - 1];
    if (lastOp && lastOp.type === 'insert' && lastOp.userId === userId) {
      lastOp.content = (lastOp.content || '') + text;
    } else {
      op.ops.push({
        type: 'insert',
        position: 0, // Will be calculated when applying
        content: text,
        userId,
        timestamp: new Date()
      });
    }
    
    op.targetLength += text.length;
    return op;
  }

  static delete(op: TextOperation, n: number, userId: string): TextOperation {
    if (n === 0) return op;

    const lastOp = op.ops[op.ops.length - 1];
    if (lastOp && lastOp.type === 'delete' && lastOp.userId === userId) {
      lastOp.length = (lastOp.length || 0) + n;
    } else {
      op.ops.push({
        type: 'delete',
        position: 0, // Will be calculated when applying
        length: n,
        userId,
        timestamp: new Date()
      });
    }
    
    op.baseLength += n;
    return op;
  }

  static transform(op1: TextOperation, op2: TextOperation, priority: 'left' | 'right' = 'left'): [TextOperation, TextOperation] {
    if (op1.baseLength !== op2.baseLength) {
      throw new Error('Cannot transform operations with different base lengths');
    }

    const newOp1 = this.createTextOperation();
    const newOp2 = this.createTextOperation();
    
    let i1 = 0, i2 = 0;
    let op1Index = 0, op2Index = 0;
    
    while (op1Index < op1.ops.length || op2Index < op2.ops.length) {
      const operation1 = op1.ops[op1Index];
      const operation2 = op2.ops[op2Index];

      if (op1Index >= op1.ops.length) {
        // Only op2 operations left
        const op = operation2;
        if (op.type === 'insert') {
          this.insert(newOp1, op.content || '', op.userId);
          this.retain(newOp2, op.content?.length || 0);
        } else if (op.type === 'retain') {
          this.retain(newOp1, op.length || 0);
          this.retain(newOp2, op.length || 0);
        } else if (op.type === 'delete') {
          // Skip delete operations from the other side
        }
        op2Index++;
      } else if (op2Index >= op2.ops.length) {
        // Only op1 operations left
        const op = operation1;
        if (op.type === 'insert') {
          this.retain(newOp1, op.content?.length || 0);
          this.insert(newOp2, op.content || '', op.userId);
        } else if (op.type === 'retain') {
          this.retain(newOp1, op.length || 0);
          this.retain(newOp2, op.length || 0);
        } else if (op.type === 'delete') {
          // Skip delete operations from the other side
        }
        op1Index++;
      } else {
        // Both operations exist
        const op1Type = operation1.type;
        const op2Type = operation2.type;

        if (op1Type === 'insert' && op2Type === 'insert') {
          if (priority === 'left') {
            this.retain(newOp1, operation1.content?.length || 0);
            this.insert(newOp2, operation1.content || '', operation1.userId);
            op1Index++;
          } else {
            this.insert(newOp1, operation2.content || '', operation2.userId);
            this.retain(newOp2, operation2.content?.length || 0);
            op2Index++;
          }
        } else if (op1Type === 'insert' && op2Type !== 'insert') {
          this.retain(newOp1, operation1.content?.length || 0);
          this.insert(newOp2, operation1.content || '', operation1.userId);
          op1Index++;
        } else if (op1Type !== 'insert' && op2Type === 'insert') {
          this.insert(newOp1, operation2.content || '', operation2.userId);
          this.retain(newOp2, operation2.content?.length || 0);
          op2Index++;
        } else if (op1Type === 'retain' && op2Type === 'retain') {
          const len1 = operation1.length || 0;
          const len2 = operation2.length || 0;
          if (len1 === len2) {
            this.retain(newOp1, len1);
            this.retain(newOp2, len1);
            op1Index++;
            op2Index++;
          } else if (len1 < len2) {
            this.retain(newOp1, len1);
            this.retain(newOp2, len1);
            operation2.length = len2 - len1;
            op1Index++;
          } else {
            this.retain(newOp1, len2);
            this.retain(newOp2, len2);
            operation1.length = len1 - len2;
            op2Index++;
          }
        } else if (op1Type === 'delete' && op2Type === 'delete') {
          const len1 = operation1.length || 0;
          const len2 = operation2.length || 0;
          if (len1 === len2) {
            op1Index++;
            op2Index++;
          } else if (len1 < len2) {
            operation2.length = len2 - len1;
            op1Index++;
          } else {
            operation1.length = len1 - len2;
            op2Index++;
          }
        } else if (op1Type === 'retain' && op2Type === 'delete') {
          const retainLen = operation1.length || 0;
          const deleteLen = operation2.length || 0;
          const minLen = Math.min(retainLen, deleteLen);
          
          this.delete(newOp1, minLen, operation2.userId);
          
          if (retainLen === deleteLen) {
            op1Index++;
            op2Index++;
          } else if (retainLen < deleteLen) {
            operation2.length = deleteLen - minLen;
            op1Index++;
          } else {
            operation1.length = retainLen - minLen;
            op2Index++;
          }
        } else if (op1Type === 'delete' && op2Type === 'retain') {
          const deleteLen = operation1.length || 0;
          const retainLen = operation2.length || 0;
          const minLen = Math.min(deleteLen, retainLen);
          
          this.delete(newOp2, minLen, operation1.userId);
          
          if (deleteLen === retainLen) {
            op1Index++;
            op2Index++;
          } else if (deleteLen < retainLen) {
            operation2.length = retainLen - minLen;
            op1Index++;
          } else {
            operation1.length = deleteLen - minLen;
            op2Index++;
          }
        }
      }
    }

    return [newOp1, newOp2];
  }

  static apply(content: string, operation: TextOperation): string {
    let result = '';
    let index = 0;

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          const retainLength = op.length || 0;
          result += content.slice(index, index + retainLength);
          index += retainLength;
          break;
        case 'insert':
          result += op.content || '';
          break;
        case 'delete':
          index += op.length || 0;
          break;
      }
    }

    // Add remaining content
    result += content.slice(index);
    
    return result;
  }

  static compose(op1: TextOperation, op2: TextOperation): TextOperation {
    if (op1.targetLength !== op2.baseLength) {
      throw new Error('Cannot compose operations: op1.targetLength !== op2.baseLength');
    }

    const composed = this.createTextOperation();
    let i1 = 0, i2 = 0;
    let op1Index = 0, op2Index = 0;

    while (op1Index < op1.ops.length || op2Index < op2.ops.length) {
      const operation1 = op1.ops[op1Index];
      const operation2 = op2.ops[op2Index];

      if (op1Index >= op1.ops.length) {
        const op = operation2;
        if (op.type === 'retain') {
          this.retain(composed, op.length || 0);
        } else if (op.type === 'insert') {
          this.insert(composed, op.content || '', op.userId);
        } else if (op.type === 'delete') {
          this.delete(composed, op.length || 0, op.userId);
        }
        op2Index++;
      } else if (op2Index >= op2.ops.length) {
        const op = operation1;
        if (op.type === 'retain') {
          this.retain(composed, op.length || 0);
        } else if (op.type === 'insert') {
          this.insert(composed, op.content || '', op.userId);
        } else if (op.type === 'delete') {
          this.delete(composed, op.length || 0, op.userId);
        }
        op1Index++;
      } else {
        const op1Type = operation1.type;
        const op2Type = operation2.type;

        if (op1Type === 'retain' && op2Type === 'retain') {
          const len1 = operation1.length || 0;
          const len2 = operation2.length || 0;
          const minLen = Math.min(len1, len2);
          
          this.retain(composed, minLen);
          
          if (len1 === len2) {
            op1Index++;
            op2Index++;
          } else if (len1 < len2) {
            operation2.length = len2 - minLen;
            op1Index++;
          } else {
            operation1.length = len1 - minLen;
            op2Index++;
          }
        } else if (op1Type === 'insert' && op2Type === 'retain') {
          const insertLen = operation1.content?.length || 0;
          const retainLen = operation2.length || 0;
          const minLen = Math.min(insertLen, retainLen);
          
          this.insert(composed, operation1.content?.slice(0, minLen) || '', operation1.userId);
          
          if (insertLen === retainLen) {
            op1Index++;
            op2Index++;
          } else if (insertLen < retainLen) {
            operation2.length = retainLen - minLen;
            op1Index++;
          } else {
            operation1.content = operation1.content?.slice(minLen);
            op2Index++;
          }
        } else if (op1Type === 'insert' && op2Type === 'delete') {
          const insertLen = operation1.content?.length || 0;
          const deleteLen = operation2.length || 0;
          const minLen = Math.min(insertLen, deleteLen);
          
          if (insertLen === deleteLen) {
            op1Index++;
            op2Index++;
          } else if (insertLen < deleteLen) {
            operation2.length = deleteLen - minLen;
            op1Index++;
          } else {
            operation1.content = operation1.content?.slice(minLen);
            op2Index++;
          }
        } else if (op1Type === 'retain' && op2Type === 'delete') {
          const retainLen = operation1.length || 0;
          const deleteLen = operation2.length || 0;
          const minLen = Math.min(retainLen, deleteLen);
          
          this.delete(composed, minLen, operation2.userId);
          
          if (retainLen === deleteLen) {
            op1Index++;
            op2Index++;
          } else if (retainLen < deleteLen) {
            operation2.length = deleteLen - minLen;
            op1Index++;
          } else {
            operation1.length = retainLen - minLen;
            op2Index++;
          }
        } else if (op1Type === 'delete' && op2Type === 'retain') {
          this.delete(composed, operation1.length || 0, operation1.userId);
          op1Index++;
        } else if (op1Type === 'delete' && op2Type === 'delete') {
          this.delete(composed, operation1.length || 0, operation1.userId);
          op1Index++;
        } else if (op1Type === 'insert' && op2Type === 'insert') {
          this.insert(composed, operation1.content || '', operation1.userId);
          op1Index++;
        } else if (op1Type === 'retain' && op2Type === 'insert') {
          this.insert(composed, operation2.content || '', operation2.userId);
          op2Index++;
        }
      }
    }

    return composed;
  }

  static fromDelta(baseText: string, newText: string, userId: string): TextOperation {
    const operation = this.createTextOperation();
    
    let i = 0;
    let j = 0;
    
    while (i < baseText.length || j < newText.length) {
      if (i < baseText.length && j < newText.length && baseText[i] === newText[j]) {
        // Characters match, retain
        let retainLength = 0;
        while (i < baseText.length && j < newText.length && baseText[i] === newText[j]) {
          retainLength++;
          i++;
          j++;
        }
        this.retain(operation, retainLength);
      } else if (j < newText.length && (i >= baseText.length || baseText[i] !== newText[j])) {
        // Insert new character(s)
        let insertText = '';
        const startJ = j;
        while (j < newText.length && (i >= baseText.length || baseText[i] !== newText[j])) {
          insertText += newText[j];
          j++;
        }
        this.insert(operation, insertText, userId);
      } else if (i < baseText.length) {
        // Delete character(s)
        let deleteLength = 0;
        while (i < baseText.length && (j >= newText.length || baseText[i] !== newText[j])) {
          deleteLength++;
          i++;
        }
        this.delete(operation, deleteLength, userId);
      }
    }
    
    return operation;
  }
}

export { OperationalTransform as OT };