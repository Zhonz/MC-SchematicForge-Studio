import { createPortal } from 'react-dom';

export interface PortalOptions {
  container?: HTMLElement;
  id?: string;
}

export class PortalUtils {
  static createContainer(id?: string): HTMLElement {
    const container = document.createElement('div');
    if (id) container.id = id;
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(container);
    return container;
  }

  static getOrCreateContainer(id: string): HTMLElement {
    let container = document.getElementById(id);
    if (!container) {
      container = this.createContainer(id);
    }
    return container;
  }

  static removeContainer(id: string): void {
    const container = document.getElementById(id);
    if (container) {
      container.remove();
    }
  }

  static render(
    element: React.ReactNode,
    options: PortalOptions = {}
  ): React.ReactPortal {
    const container = options.container || this.getOrCreateContainer(options.id || 'portal-root');
    
    return createPortal(element, container);
  }
}

export class ModalPortal {
  private container: HTMLElement;
  private id: string;

  constructor(id: string = 'modal-portal') {
    this.id = id;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    let container = document.getElementById(this.id);
    
    if (!container) {
      container = document.createElement('div');
      container.id = this.id;
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9998;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    return container;
  }

  render(element: React.ReactNode): React.ReactNode {
    return createPortal(element, this.container);
  }

  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export class TooltipPortal {
  private container: HTMLElement;
  private static instance: TooltipPortal | null = null;

  static getInstance(): TooltipPortal {
    if (!TooltipPortal.instance) {
      TooltipPortal.instance = new TooltipPortal();
    }
    return TooltipPortal.instance;
  }

  private constructor() {
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const id = 'tooltip-portal';
    let container = document.getElementById(id);

    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9997;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    return container;
  }

  render(element: React.ReactNode): React.ReactNode {
    return createPortal(element, this.container);
  }

  clear(): void {
    this.container.innerHTML = '';
  }
}

export class ContextMenuPortal {
  private container: HTMLElement;
  private static instance: ContextMenuPortal | null = null;

  static getInstance(): ContextMenuPortal {
    if (!ContextMenuPortal.instance) {
      ContextMenuPortal.instance = new ContextMenuPortal();
    }
    return ContextMenuPortal.instance;
  }

  private constructor() {
    this.container = this.createContainer();
    this.setupListeners();
  }

  private createContainer(): HTMLElement {
    const id = 'context-menu-portal';
    let container = document.getElementById(id);

    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9996;
      `;
      document.body.appendChild(container);
    }

    return container;
  }

  private setupListeners(): void {
    document.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  render(element: React.ReactNode, position: { x: number; y: number }): React.ReactNode {
    this.container.style.left = `${position.x}px`;
    this.container.style.top = `${position.y}px`;
    return createPortal(element, this.container);
  }

  hide(): void {
    this.container.innerHTML = '';
  }
}

export class NotificationPortal {
  private container: HTMLElement;
  private position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  constructor(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right') {
    this.position = position;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const id = 'notification-portal';
    let container = document.getElementById(id);

    if (!container) {
      container = document.createElement('div');
      container.id = id;
      container.style.cssText = `
        position: fixed;
        ${this.position.includes('top') ? 'top' : 'bottom'}: 20px;
        ${this.position.includes('left') ? 'left' : 'right'}: 20px;
        z-index: 9995;
        display: flex;
        flex-direction: ${this.position.includes('top') ? 'column' : 'column-reverse'};
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    return container;
  }

  render(element: React.ReactNode): React.ReactNode {
    return createPortal(element, this.container);
  }

  setPosition(position: typeof this.position): void {
    this.position = position;
    this.container.style.top = position.includes('top') ? '20px' : '';
    this.container.style.bottom = position.includes('bottom') ? '20px' : '';
    this.container.style.left = position.includes('left') ? '20px' : '';
    this.container.style.right = position.includes('right') ? '20px' : '';
  }
}

export default PortalUtils;
