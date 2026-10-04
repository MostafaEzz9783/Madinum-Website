"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Locale } from "@/lib/i18n";

type MapPoint = { reference: string; latitude: number; longitude: number; title: string; price: string; href: string };
export type MapBounds = { north: number; south: number; east: number; west: number };

export function PropertyMap({ points, locale, bounds }: { points: MapPoint[]; locale: Locale; bounds?: MapBounds }) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter(), pathname = usePathname(), query = useSearchParams();
  const ar = locale === "ar";
  useEffect(() => {
    let disposed = false;
    import("leaflet").then(L => {
      if (disposed || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false, zoomControl: true });
      instance.current = map;
      map.setView([23.5, 44.5], 5);
      const tiles = L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      tiles.on("tileerror", () => { if (!disposed) setError(true); });
      tiles.addTo(map);
      const locations: [number, number][] = [];
      for (const point of points) {
        locations.push([point.latitude, point.longitude]);
        const popup = document.createElement("div");
        popup.dir = ar ? "rtl" : "ltr";
        const link = document.createElement("a");
        link.href = point.href;
        link.textContent = `${point.title} — ${point.price}`;
        popup.append(link);
        const iconText = document.createElement("span");
        iconText.textContent = point.price;
        L.marker([point.latitude, point.longitude], { title: point.title, keyboard: true,
          icon: L.divIcon({ className: "map-price-marker", html: iconText, iconSize: [116, 32], iconAnchor: [58, 16] }),
        }).addTo(map).bindPopup(popup);
      }
      if (bounds) map.fitBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]);
      else if (locations.length) map.fitBounds(locations, { padding: [50, 50], maxZoom: 12 });
      setReady(true);
    }).catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; instance.current?.remove(); instance.current = null; };
  }, [points, bounds, ar]);

  function searchArea() {
    if (!instance.current) return;
    const area = instance.current.getBounds();
    const next = new URLSearchParams(query);
    next.set("north", area.getNorth().toFixed(6)); next.set("south", area.getSouth().toFixed(6));
    next.set("east", Math.min(180, area.getEast()).toFixed(6)); next.set("west", Math.max(-180, area.getWest()).toFixed(6));
    next.delete("page");
    router.push(`${pathname}?${next}`, { scroll: false });
  }
  return <section className="map-panel" aria-label={ar ? "خريطة العقارات" : "Property map"}>
    <div className="map-toolbar"><button className="button button-small" disabled={!ready} onClick={searchArea}>{ar ? "ابحث في هذه المنطقة" : "Search this area"}</button><span>{ar ? "مواقع تقريبية" : "Approximate locations"}</span></div>
    {error && <p role="status" className="demo-notice">{ar ? "تعذر تحميل بعض أجزاء الخريطة. يمكنك متابعة التصفح من القائمة." : "Some map tiles could not load. You can continue browsing in list view."}</p>}
    {!points.length && <p className="demo-notice">{ar ? "لا توجد مواقع عامة للنتائج الحالية. جرّب توسيع المنطقة." : "No public locations for these results. Try a wider area."}</p>}
    <div className="map-canvas" ref={container} />
    <p className="map-note">{ar ? "تعرض الخريطة نتائج الصفحة الحالية فقط." : "The map shows results on the current page."} <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">{ar ? "الإبلاغ عن مشكلة في الخريطة" : "Report a map issue"}</a></p>
  </section>;
}
