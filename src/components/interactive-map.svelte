<script lang="ts">
  import { mapContext } from "svelte-maplibre";
  import { Marker, Popup } from "maplibre-gl";
  import { onMount, onDestroy } from "svelte";
  
  export let currentMarker: Partial<MarkerType> | null = null;
  export let markers: MarkerType[] = [];
  
  interface MarkerType {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
  }
  
  const { map } = mapContext();
  let mapMarkers: Map<string, Marker> = new Map();
  let tempMarker: Marker | null = null;
  let pathSource: any = null;
  let isSetupComplete = false;
  let isDragging = false;
  let isClickingMarker = false;
  let hiddenMarkerId: string | null = null; // Track which marker is hidden
  
  onMount(() => {
    if ($map) {
      setupMap();
    }
  });
  
  $: if ($map && !isSetupComplete) {
    setupMap();
  }
  
  $: if ($map && markers && isSetupComplete) {
    updateMarkers();
    updatePath();
  }
  
  $: if ($map && currentMarker && isSetupComplete) {
    updateTempMarker();
    updatePath(); // Update path when currentMarker changes
  } else if (!currentMarker && tempMarker) {
    tempMarker.remove();
    tempMarker = null;
    // Restore the hidden marker when done editing
    if (hiddenMarkerId) {
      hiddenMarkerId = null;
      updateMarkers(); // Recreate all markers to restore the hidden one
    }
    // Update path to remove temp marker position
    updatePath();
  }
  
  function setupMap() {
    if (!$map || isSetupComplete) return;
    
    // Wait for map to be fully loaded
    if (!$map.isStyleLoaded()) {
      $map.on('styledata', setupMap);
      return;
    }
    
    // Add click handler for creating new markers
    $map.on('click', handleMapClick);
    
    // Add path source and layer
    if (!$map.getSource('path')) {
      $map.addSource('path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      $map.addLayer({
        id: 'path',
        type: 'line',
        source: 'path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 2] // Dashed line to indicate it's not following roads
        }
      });
    }
    
    isSetupComplete = true;
  }
  
  function handleMapClick(e: any) {
    // Don't create new marker if one is being edited, currently dragging, or clicking on a marker
    if (currentMarker || isDragging || isClickingMarker) return;
    
    const { lng, lat } = e.lngLat;
    currentMarker = {
      id: `marker-${Date.now()}`,
      lat,
      lng,
      title: '',
      description: ''
    };
  }
  
  function updateTempMarker() {
    if (!$map || !currentMarker?.lat || !currentMarker?.lng) {
      return;
    }

    console.log("Updating temp marker", currentMarker);
    
    // If we're editing an existing marker, hide the original
    if (currentMarker.id && hiddenMarkerId !== currentMarker.id) {
      const existingMarker = mapMarkers.get(currentMarker.id);
      if (existingMarker) {
        existingMarker.remove();
        mapMarkers.delete(currentMarker.id);
        hiddenMarkerId = currentMarker.id;
      }
    }
    
    // If marker already exists and position matches, don't recreate
    if (tempMarker) {
      const currentPos = tempMarker.getLngLat();
      if (Math.abs(currentPos.lat - currentMarker.lat) < 0.000001 && 
          Math.abs(currentPos.lng - currentMarker.lng) < 0.000001) {
        return;
      }
      tempMarker.remove();
    }
    
    // Create new temp marker element
    const el = document.createElement('div');
    el.className = 'temp-marker';
    el.style.cssText = `
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #ef4444;
      border: 3px solid white;
      cursor: grab;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    tempMarker = new Marker({
      element: el,
      draggable: true,
      anchor: 'center'
    })
      .setLngLat([currentMarker.lng, currentMarker.lat])
      .addTo($map);
    
    // Handle drag start
    tempMarker.on('dragstart', () => {
      isDragging = true;
      if (el) {
        el.style.cursor = 'grabbing';
      }
    });
    
    // Handle drag events
    tempMarker.on('drag', () => {
      if (!tempMarker) return;
      const lngLat = tempMarker.getLngLat();
      // Update currentMarker reactively
      currentMarker = {
        ...currentMarker,
        lat: lngLat.lat,
        lng: lngLat.lng
      };
    });
    
    // Handle drag end
    tempMarker.on('dragend', () => {
      isDragging = false;
      if (el) {
        el.style.cursor = 'grab';
      }
      if (!tempMarker) return;
      const lngLat = tempMarker.getLngLat();
      currentMarker = {
        ...currentMarker,
        lat: lngLat.lat,
        lng: lngLat.lng
      };
    });
  }
  
  function updateMarkers() {
    if (!$map) return;
    
    // Remove old markers (except the one being edited)
    mapMarkers.forEach((marker, id) => {
      if (id !== hiddenMarkerId) {
        marker.remove();
      }
    });
    mapMarkers.clear();
    
    // Add current markers
    markers.forEach((marker, index) => {
      // Skip displaying this marker if it's currently being edited
      if (currentMarker && currentMarker.id === marker.id) {
        return;
      }
      
      const el = document.createElement('div');
      el.className = 'saved-marker';
      el.style.cssText = `
        width: 25px;
        height: 25px;
        border-radius: 50%;
        background-color: #10b981;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        transition: opacity 0.2s ease;
      `;
      el.textContent = (index + 1).toString();
      
      // Add hover effect using opacity instead of transform
      el.addEventListener('mouseenter', () => {
        el.style.opacity = '0.8';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.opacity = '1';
      });
      
      const mapMarker = new Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([marker.lng, marker.lat])
        .addTo($map);
      
      // Add popup
      const popup = new Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false 
      }).setHTML(`
        <div>
          <h3 style="margin: 0 0 4px 0; font-weight: bold;">${marker.title}</h3>
          ${marker.description ? `<p style="margin: 0; font-size: 14px; color: #666;">${marker.description}</p>` : ''}
        </div>
      `);
      
      mapMarker.setPopup(popup);
      
      // Handle click to prevent new marker creation but allow popup
      mapMarker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        isClickingMarker = true;
        setTimeout(() => {
          isClickingMarker = false;
        }, 100);
      });
      
      mapMarkers.set(marker.id, mapMarker);
    });
  }
  
  function updatePath() {
    if (!$map) return;
    
    if (!pathSource) {
        pathSource = $map.getSource('path');
    }
    
    if (!pathSource) return;
    
    // Get all coordinates - only use saved marker positions when not actively editing
    const waypoints = markers.map((marker, index) => {
        // Only use current marker position if it's being actively edited AND has coordinates AND temp marker exists
        if (currentMarker && 
            currentMarker.id === marker.id && 
            currentMarker.lat && 
            currentMarker.lng &&
            tempMarker) { // Only if temp marker is active (actively editing)
            return [currentMarker.lng, currentMarker.lat];
        }
        // Otherwise use the saved marker position
        return [marker.lng, marker.lat];
    });
    
    // If we have a new marker (no existing id), add it to the end - but only if temp marker exists
    if (currentMarker && 
        !currentMarker.id && 
        currentMarker.lat && 
        currentMarker.lng &&
        tempMarker) { // Only if temp marker is active
        waypoints.push([currentMarker.lng, currentMarker.lat]);
    }
    
    // Create simple straight-line path between waypoints
    pathSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: waypoints
        }
    });
  }
  
  onDestroy(() => {
    if ($map) {
      $map.off('click', handleMapClick);
      $map.off('styledata', setupMap);
    }
    
    // Clean up markers
    mapMarkers.forEach(marker => marker.remove());
    if (tempMarker) {
      tempMarker.remove();
    }
  });
</script>

<style>
  /* Removed all transform-based hover effects that were causing the positioning bug */
</style>