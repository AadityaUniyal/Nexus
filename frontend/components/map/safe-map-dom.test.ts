import assert from "node:assert/strict";
import test from "node:test";
import { createSafeMapMarkerElement } from "./safe-map-dom";

class FakeElement {
  className = "";
  textContent = "";
  style: Record<string, string> = {};
  attributes = new Map<string, string>();
  children: FakeElement[] = [];

  set innerHTML(_value: string) {
    throw new Error("Map marker code must not assign innerHTML");
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }

  appendChild(child: FakeElement) {
    this.children.push(child);
    return child;
  }
}

function fakeDocument(): Document {
  return {
    createElement: () => new FakeElement(),
    createElementNS: () => new FakeElement(),
  } as unknown as Document;
}

test("map marker labels remain literal text, including HTML-like input", () => {
  const hostileLabel = '<img src=x onerror="alert(1)">';
  const marker = createSafeMapMarkerElement(fakeDocument(), "warehouse", hostileLabel) as unknown as FakeElement;
  const tooltip = marker.children[1];

  assert.equal(marker.attributes.get("aria-label"), hostileLabel);
  assert.equal(tooltip.textContent, hostileLabel);
  assert.equal(tooltip.children.length, 0);
});

test("map marker heading is normalized before it is used as a style value", () => {
  const marker = createSafeMapMarkerElement(fakeDocument(), "vehicle", "Truck 7", -90) as unknown as FakeElement;
  assert.equal(marker.children[0].style.transform, "rotate(270deg)");
});
