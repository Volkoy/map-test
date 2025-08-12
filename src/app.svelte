<script lang="ts">
  import { MapLibre } from "svelte-maplibre";
  import { middleOfUSA } from "./lib/constants";
  import YouAreHere from "./components/you-are-here.svelte";
  import MarkerForm from "./components/marker-form.svelte";
  import InteractiveMap from "./components/interactive-map.svelte";

  interface Marker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description: string;
  }
  
  let markers: Marker[] = [];
  let currentMarker: Partial<Marker> | null = null;
</script>

<div class="flex h-screen">
  
  <div class="w-1/3 bg-gray-100 border-r border-gray-300 overflow-y-auto">
    <MarkerForm 
      bind:currentMarker 
      bind:markers
    />
  </div>
  
  <div class="w-2/3">
    <MapLibre
      center={middleOfUSA}
      zoom={2}
      style="https://tiles.openfreemap.org/styles/bright"
      class="w-full h-full"
    >
      <YouAreHere />
      <InteractiveMap 
        bind:currentMarker 
        bind:markers
      />
    </MapLibre>
  </div>
</div>
