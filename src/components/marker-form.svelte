<script lang="ts">
  export let currentMarker: Partial<Marker> | null = null;
  export let markers: Marker[] = [];
  
  interface Marker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
  }
  
  let title = "";
  let description = "";
  let draggedIndex: number | null = null;
  let dragOverIndex: number | null = null;
  
  $: if (currentMarker) {
    // Update form when marker position changes
    if (currentMarker.lat !== undefined && currentMarker.lng !== undefined) {
      // Keep existing title and description if they exist
      if (!currentMarker.title) title = title;
      if (!currentMarker.description) description = description;
    }
  }
  
  function saveMarker() {
    if (!currentMarker || !currentMarker.lat || !currentMarker.lng || !title.trim()) {
      alert("Please add a marker position and title");
      return;
    }
    
    const newMarker: Marker = {
      id: currentMarker.id || `marker-${Date.now()}`,
      lat: currentMarker.lat,
      lng: currentMarker.lng,
      title: title.trim(),
      description: description.trim()
    };
    
    // Check if updating existing marker
    const existingIndex = markers.findIndex(m => m.id === newMarker.id);
    if (existingIndex >= 0) {
      markers[existingIndex] = newMarker;
    } else {
      markers = [...markers, newMarker];
    }
    
    clearForm();
  }
  
  function cancelMarker() {
    clearForm();
  }
  
  function clearForm() {
    currentMarker = null;
    title = "";
    description = "";
  }
  
  function editMarker(marker: Marker) {
    currentMarker = { ...marker };
    title = marker.title;
    description = marker.description;
  }
  
  function deleteMarker(markerId: string) {
    markers = markers.filter(m => m.id !== markerId);
    if (currentMarker?.id === markerId) {
      clearForm();
    }
  }
  
  // Drag and drop functions
  function handleDragStart(event: DragEvent, index: number) {
    if (!event.dataTransfer) return;
    
    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', '');
    
    // Add drag styling
    const target = event.target as HTMLElement;
    target.style.opacity = '0.5';
  }
  
  function handleDragEnd(event: DragEvent) {
    draggedIndex = null;
    dragOverIndex = null;
    
    // Reset styling
    const target = event.target as HTMLElement;
    target.style.opacity = '1';
  }
  
  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (!event.dataTransfer) return;
    
    event.dataTransfer.dropEffect = 'move';
    dragOverIndex = index;
  }
  
  function handleDragLeave() {
    dragOverIndex = null;
  }
  
  function handleDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }
    
    // Reorder the markers array
    const newMarkers = [...markers];
    const draggedMarker = newMarkers[draggedIndex];
    
    // Remove dragged item
    newMarkers.splice(draggedIndex, 1);
    
    // Insert at new position
    newMarkers.splice(dropIndex, 0, draggedMarker);
    
    markers = newMarkers;
    draggedIndex = null;
    dragOverIndex = null;
  }
</script>

<div class="p-4">
  <h1 class="text-xl font-bold mb-4">Point of Interest</h1>
  
  <!-- Current Marker Form -->
  {#if currentMarker}
    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <h2 class="text-lg font-semibold mb-3">
        {currentMarker.id ? 'Edit POI' : 'New POI'}
      </h2>
      
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <div class="text-sm text-gray-600">
            Lat: {currentMarker.lat?.toFixed(6) || 'N/A'}<br>
            Lng: {currentMarker.lng?.toFixed(6) || 'N/A'}
          </div>
        </div>
        
        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            bind:value={title}
            placeholder="Enter marker title"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            bind:value={description}
            placeholder="Enter marker description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        
        <div class="flex space-x-2">
          <button
            on:click={saveMarker}
            class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save
          </button>
          <button
            on:click={cancelMarker}
            class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p class="text-blue-800 text-sm">
        Click on the map to add a new marker
      </p>
    </div>
  {/if}
  
  <!-- Existing Markers List -->
  <div class="bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold">Markers ({markers.length})</h2>
      {#if markers.length > 1}
        <p class="text-xs text-gray-500 mt-1">
          💡 Drag and drop to reorder markers
        </p>
      {/if}
    </div>
    
    <div class="max-h-96 overflow-y-auto">
      {#each markers as marker, index (marker.id)}
        <div 
          class="marker-item p-4 border-b border-gray-100 last:border-b-0 transition-colors duration-200"
          class:drag-over={dragOverIndex === index}
          class:being-dragged={draggedIndex === index}
          draggable="true"
          on:dragstart={(e) => handleDragStart(e, index)}
          on:dragend={handleDragEnd}
          on:dragover={(e) => handleDragOver(e, index)}
          on:dragleave={handleDragLeave}
          on:drop={(e) => handleDrop(e, index)}
        >
          <div class="flex items-start space-x-3">
            <!-- Drag handle -->
            <div class="drag-handle flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="text-gray-400">
                <circle cx="3" cy="3" r="1"/>
                <circle cx="3" cy="8" r="1"/>
                <circle cx="3" cy="13" r="1"/>
                <circle cx="8" cy="3" r="1"/>
                <circle cx="8" cy="8" r="1"/>
                <circle cx="8" cy="13" r="1"/>
              </svg>
            </div>
            
            <!-- Marker content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-bold rounded-full">
                      {index + 1}
                    </span>
                    <h3 class="font-medium text-gray-900">{marker.title}</h3>
                  </div>
                  {#if marker.description}
                    <p class="text-sm text-gray-600 mt-1 ml-8">{marker.description}</p>
                  {/if}
                  <p class="text-xs text-gray-500 mt-1 ml-8">
                    {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  </p>
                </div>
                
                <div class="flex space-x-1 ml-2">
                  <button
                    on:click={() => editMarker(marker)}
                    class="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    on:click={() => deleteMarker(marker.id)}
                    class="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <div class="p-4 text-center text-gray-500">
          No markers added yet
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .marker-item {
    cursor: grab;
  }
  
  .marker-item:active {
    cursor: grabbing;
  }
  
  .marker-item.drag-over {
    background-color: #dbeafe;
    border-color: #3b82f6;
  }
  
  .marker-item.being-dragged {
    opacity: 0.5;
    transform: rotate(5deg);
  }
  
  .drag-handle {
    transition: color 0.2s ease;
  }
  
  .marker-item:hover .drag-handle {
    color: #6b7280;
  }
</style>