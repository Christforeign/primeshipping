// Prevents React from crashing when Safari translation or extensions move DOM nodes.
let installed = false;

export function installDomGuard() {
  if (installed || typeof window === "undefined" || typeof Node === "undefined") return;
  installed = true;
  const proto = Node.prototype as any;
  const originalRemove = proto.removeChild;
  proto.removeChild = function (child: any) {
    if (child && child.parentNode !== this) {
      if (child.parentNode) child.parentNode.removeChild(child);
      return child;
    }
    return originalRemove.call(this, child);
  };
  const originalInsert = proto.insertBefore;
  proto.insertBefore = function (node: any, ref: any) {
    if (ref && ref.parentNode !== this) return originalInsert.call(this, node, null);
    return originalInsert.call(this, node, ref);
  };
}

installDomGuard();
