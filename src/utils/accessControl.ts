export type Permission = 'read' | 'write' | 'delete' | 'admin';
export type Resource = string;

export interface AccessRule {
  resource: Resource;
  permissions: Permission[];
  conditions?: Record<string, unknown>;
}

export interface User {
  id: string;
  roles: string[];
  attributes?: Record<string, unknown>;
}

export interface AccessContext {
  user: User;
  resource: Resource;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  matchedRule?: AccessRule;
}

export class AccessControl {
  private rules: Map<string, AccessRule[]> = new Map();
  private defaultResult: boolean;

  constructor(defaultResult = false) {
    this.defaultResult = defaultResult;
  }

  grant(role: string, resource: Resource, permissions: Permission[], conditions?: Record<string, unknown>): this {
    const rule: AccessRule = { resource, permissions, conditions };
    const existing = this.rules.get(role) || [];
    existing.push(rule);
    this.rules.set(role, existing);
    return this;
  }

  revoke(role: string, resource: Resource, permissions?: Permission[]): this {
    const rules = this.rules.get(role);
    if (!rules) return this;

    if (permissions) {
      const filtered = rules.filter(r => {
        if (r.resource !== resource) return true;
        r.permissions = r.permissions.filter(p => !permissions.includes(p));
        return r.permissions.length > 0;
      });
      this.rules.set(role, filtered);
    } else {
      this.rules.set(role, rules.filter(r => r.resource !== resource));
    }
    return this;
  }

  can(role: string, resource: Resource, permission: Permission): boolean {
    const rules = this.rules.get(role) || [];
    return rules.some(rule => {
      if (rule.resource !== resource) return false;
      if (!rule.permissions.includes(permission)) return false;
      return true;
    });
  }

  check(context: AccessContext): AccessResult {
    const { user, resource, action } = context;

    for (const role of user.roles) {
      const rules = this.rules.get(role) || [];
      for (const rule of rules) {
        if (!this.matchesResource(rule.resource, resource)) continue;
        
        if (action) {
          const permission = this.actionToPermission(action);
          if (rule.permissions.includes(permission)) {
            if (rule.conditions && !this.evaluateConditions(rule.conditions, user)) {
              continue;
            }
            return { allowed: true, matchedRule: rule };
          }
        } else {
          if (rule.permissions.length > 0) {
            return { allowed: true, matchedRule: rule };
          }
        }
      }
    }

    return { 
      allowed: this.defaultResult, 
      reason: `No matching rule found for resource "${resource}"` 
    };
  }

  private matchesResource(pattern: string, resource: string): boolean {
    if (pattern === '*') return true;
    if (pattern === resource) return true;
    
    const patternParts = pattern.split(':');
    const resourceParts = resource.split(':');
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*') continue;
      if (patternParts[i] !== resourceParts[i]) return false;
    }
    
    return true;
  }

  private actionToPermission(action: string): Permission {
    const mapping: Record<string, Permission> = {
      get: 'read',
      list: 'read',
      view: 'read',
      create: 'write',
      update: 'write',
      edit: 'write',
      add: 'write',
      remove: 'delete',
      delete: 'delete',
      destroy: 'delete',
      manage: 'admin',
    };
    return mapping[action.toLowerCase()] || 'read';
  }

  private evaluateConditions(conditions: Record<string, unknown>, user: User): boolean {
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = user.attributes?.[key];
      if (actual !== expected) return false;
    }
    return true;
  }

  getRoles(): string[] {
    return Array.from(this.rules.keys());
  }

  getRules(role?: string): AccessRule[] {
    if (role) {
      return this.rules.get(role) || [];
    }
    return Array.from(this.rules.values()).flat();
  }

  clear(role?: string): this {
    if (role) {
      this.rules.delete(role);
    } else {
      this.rules.clear();
    }
    return this;
  }
}

export const createAccessControl = (defaultResult = false) => new AccessControl(defaultResult);
