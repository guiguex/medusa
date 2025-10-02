// src/viewer/bridge.ts
export type ViewMode = '3d' | 'image';

type BridgeEvent =
  | { type: 'load'; productId: string; glbUrl?: string; metaUrl?: string }
  | { type: 'select-part'; code: string }
  | { type: 'select-option'; code: string }
  | { type: 'camera-to'; code: string }
  | { type: 'view-mode'; mode: ViewMode };

type Sub = (e: BridgeEvent) => void;

class ViewerBridge {
  private subs = new Set<Sub>();
  on(sub: Sub) { this.subs.add(sub); return () => this.subs.delete(sub); }
  emit(e: BridgeEvent) { this.subs.forEach(s => s(e)); }

  load(productId: string, glbUrl?: string, metaUrl?: string) {
    this.emit({ type: 'load', productId, glbUrl, metaUrl });
  }
  selectPart(code: string) { this.emit({ type: 'select-part', code }); }
  selectOption(code: string) { this.emit({ type: 'select-option', code }); }
  cameraTo(code: string) { this.emit({ type: 'camera-to', code }); }
  setViewMode(mode: ViewMode) { this.emit({ type: 'view-mode', mode }); }
}
export const viewerBridge = new ViewerBridge();
