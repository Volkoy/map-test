<script lang="ts">
  import { mapContext } from "svelte-maplibre";
  import { getLocation } from "../lib/api";
  import { Marker, Popup } from "maplibre-gl";

  const { map } = mapContext();
  let popupCreated = false;
  let currentLocationMarker: Marker | null = null;

  $: if ($map && !popupCreated) {
    (async () => {
      popupCreated = true;
      const location = await getLocation();
      
      // Fly to location
      $map.flyTo({ center: location, zoom: 15 });
      
      // Create blue marker for current location
      const el = document.createElement('div');
      el.className = 'current-location-marker';
      el.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        cursor: pointer;
        position: relative;
      `;
      
      currentLocationMarker = new Marker({
        element: el,
        anchor: 'center'
      })
        .setLngLat(location)
        .addTo($map);
    })();
  }
</script>

<style>
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.1;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }
  
  :global(.current-location-marker) {
    transition: opacity 0.2s ease;
  }
  
  :global(.current-location-marker:hover) {
    opacity: 0.8;
  }
</style>