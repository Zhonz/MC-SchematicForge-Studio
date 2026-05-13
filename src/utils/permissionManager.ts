export type AccessLevel = 'none' | 'read' | 'write' | 'admin'

export interface Permission {
  resource: string
  actions: string[]
}

export interface Role {
  name: string
  permissions: Permission[]
  inherits?: string[]
}

export interface User {
  id: string
  username: string
  roles: string[]
  attributes?: Record<string, unknown>
}

export interface AccessContext {
  user?: User
  resource?: string
  action?: string
  attributes?: Record<string, unknown>
}

export class PermissionManager {
  private static instance: PermissionManager
  private roles: Map<string, Role> = new Map()
  private userPermissions: Map<string, Set<string>> = new Map()
  private listeners: Set<(userId: string, hasAccess: boolean, context: AccessContext) => void> = new Set()

  private constructor() {
    this.registerDefaultRoles()
  }

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager()
    }
    return PermissionManager.instance
  }

  private registerDefaultRoles(): void {
    this.registerRole({
      name: 'guest',
      permissions: [
        { resource: 'public', actions: ['read'] }
      ]
    })

    this.registerRole({
      name: 'user',
      permissions: [
        { resource: 'public', actions: ['read', 'write'] },
        { resource: 'profile', actions: ['read', 'write'] },
        { resource: 'settings', actions: ['read', 'write'] }
      ],
      inherits: ['guest']
    })

    this.registerRole({
      name: 'admin',
      permissions: [
        { resource: '*', actions: ['*'] }
      ],
      inherits: ['user']
    })
  }

  registerRole(role: Role): void {
    this.roles.set(role.name, role)
  }

  unregisterRole(name: string): void {
    this.roles.delete(name)
  }

  getRole(name: string): Role | undefined {
    return this.roles.get(name)
  }

  setUserRoles(userId: string, roles: string[]): void {
    this.userPermissions.set(userId, new Set(roles))
  }

  addUserRole(userId: string, role: string): void {
    if (!this.userPermissions.has(userId)) {
      this.userPermissions.set(userId, new Set())
    }
    this.userPermissions.get(userId)!.add(role)
  }

  removeUserRole(userId: string, role: string): void {
    this.userPermissions.get(userId)?.delete(role)
  }

  getUserRoles(userId: string): string[] {
    return Array.from(this.userPermissions.get(userId) || [])
  }

  hasPermission(userId: string, resource: string, action: string): boolean {
    const roles = this.getUserRoles(userId)
    return this.checkRolesPermission(roles, resource, action)
  }

  private checkRolesPermission(roles: string[], resource: string, action: string): boolean {
    for (const roleName of roles) {
      if (this.checkRolePermission(roleName, resource, action)) {
        return true
      }
    }
    return false
  }

  private checkRolePermission(roleName: string, resource: string, action: string): boolean {
    const role = this.roles.get(roleName)
    if (!role) return false

    for (const permission of role.permissions) {
      if (this.matchesResource(permission.resource, resource)) {
        if (this.matchesAction(permission.actions, action)) {
          return true
        }
      }
    }

    if (role.inherits) {
      return this.checkRolesPermission(role.inherits, resource, action)
    }

    return false
  }

  private matchesResource(pattern: string, resource: string): boolean {
    if (pattern === '*') return true
    if (pattern === resource) return true

    const patternParts = pattern.split(':')
    const resourceParts = resource.split(':')

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '*') return true
      if (patternParts[i] !== resourceParts[i]) return false
    }

    return patternParts.length === resourceParts.length
  }

  private matchesAction(actions: string[], action: string): boolean {
    if (actions.includes('*')) return true
    if (actions.includes(action)) return true
    return false
  }

  canAccess(context: AccessContext): boolean {
    if (!context.user || !context.resource || !context.action) {
      return false
    }

    const hasAccess = this.hasPermission(
      context.user.id,
      context.resource,
      context.action
    )

    this.listeners.forEach(listener => 
      listener(context.user!.id, hasAccess, context)
    )

    return hasAccess
  }

  filterByPermission<T extends { id: string; resource: string }>(
    userId: string,
    items: T[],
    action: string
  ): T[] {
    return items.filter(item => 
      this.hasPermission(userId, item.resource, action)
    )
  }

  getAccessibleResources(userId: string): string[] {
    const roles = this.getUserRoles(userId)
    const resources = new Set<string>()

    for (const roleName of roles) {
      const role = this.roles.get(roleName)
      if (role) {
        for (const permission of role.permissions) {
          if (permission.resource !== '*') {
            resources.add(permission.resource)
          }
        }
        if (role.inherits) {
          for (const inheritedRole of role.inherits) {
            const inherited = this.roles.get(inheritedRole)
            if (inherited) {
              for (const permission of inherited.permissions) {
                resources.add(permission.resource)
              }
            }
          }
        }
      }
    }

    return Array.from(resources)
  }

  subscribe(listener: (userId: string, hasAccess: boolean, context: AccessContext) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  clearUserPermissions(userId: string): void {
    this.userPermissions.delete(userId)
  }

  reset(): void {
    this.roles.clear()
    this.userPermissions.clear()
    this.registerDefaultRoles()
  }
}

export const permissions = PermissionManager.getInstance()

export function createPermission(resource: string, actions: string[]): Permission {
  return { resource, actions }
}

export function requirePermission(
  resource: string,
  action: string,
  onDeny?: () => void
): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      const userId = 'currentUserId'
      if (!permissions.hasPermission(userId, resource, action)) {
        onDeny?.()
        return
      }
      return original.apply(this, args)
    }

    return descriptor
  }
}
