import { describe, expect, it, vi } from "vitest";
import { removePreviewMarker, updatePreviewMarker } from "./map-preview-marker";

describe("Safari-compatible map preview marker",()=>{
  it("uses a real, explicitly sized visible DOM element",()=>{
    const markerElements:HTMLElement[]=[];
    const marker={addTo:vi.fn(),remove:vi.fn(),setLngLat:vi.fn()};
    marker.setLngLat.mockReturnValue(marker);
    marker.addTo.mockReturnValue(marker);
    const Marker=vi.fn(function(this:unknown,options:{element:HTMLElement}){markerElements.push(options.element);return marker;});
    const map={} as never;
    const result=updatePreviewMarker({current:null,latitude:50,longitude:14,map,mapboxgl:{Marker:Marker as never}});
    const pin=markerElements[0]?.querySelector<HTMLElement>(".nomadio-map-preview-pin");
    expect(result).toBe(marker);
    expect(pin).not.toBeNull();
    expect(pin?.textContent).toBe("+");
    expect(pin?.style.width).toBe("24px");
    expect(pin?.style.height).toBe("24px");
    expect(pin?.style.display).toBe("flex");
    expect(pin?.style.position).toBe("relative");
    expect(pin?.style.background).not.toBe("");
    expect(pin?.style.transform).toBe("");
    expect(marker.setLngLat).toHaveBeenCalledWith([14,50]);
    expect(marker.setLngLat.mock.invocationCallOrder[0]).toBeLessThan(marker.addTo.mock.invocationCallOrder[0]!);
  });

  it("moves the existing marker and removes it through the shared cleanup",()=>{
    const marker={remove:vi.fn(),setLngLat:vi.fn()};
    expect(updatePreviewMarker({current:marker as never,latitude:49,longitude:16,map:{} as never,mapboxgl:{Marker:vi.fn() as never}})).toBe(marker);
    expect(marker.setLngLat).toHaveBeenCalledWith([16,49]);
    const ref:{current:never|null}={current:marker as never};
    removePreviewMarker(ref);
    expect(marker.remove).toHaveBeenCalledOnce();
    expect(ref.current).toBeNull();
  });

  it("does not create a marker for invalid coordinates or an unavailable map",()=>{
    const Marker=vi.fn();
    expect(updatePreviewMarker({current:null,latitude:Number.NaN,longitude:14,map:{} as never,mapboxgl:{Marker:Marker as never}})).toBeNull();
    expect(updatePreviewMarker({current:null,latitude:50,longitude:14,map:null,mapboxgl:{Marker:Marker as never}})).toBeNull();
    expect(Marker).not.toHaveBeenCalled();
  });
});
