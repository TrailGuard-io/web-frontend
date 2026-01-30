import { useEffect, useRef } from "react";
import type { LatLngBounds } from "leaflet";
import { useMapEvents } from "react-leaflet";

type Props = {
  onBoundsChange: (bounds: LatLngBounds) => void;
};

export default function MapEvents({ onBoundsChange }: Props) {
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  const map = useMapEvents({
    load: () => onBoundsChangeRef.current(map.getBounds()),
    moveend: () => onBoundsChangeRef.current(map.getBounds()),
    zoomend: () => onBoundsChangeRef.current(map.getBounds()),
  });

  useEffect(() => {
    onBoundsChangeRef.current(map.getBounds());
  }, [map]);

  return null;
}
