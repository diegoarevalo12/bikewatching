// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiYXJldmFsYW8iLCJhIjoiY203ZWFwZTVjMGJ3aTJtcTNjaDgwZGgxdiJ9.CcR41ebl3_zRrUWiDQYcmA';

// Initialize the map
const map = new mapboxgl.Map({
  container: 'map', // ID of the div where the map will render
  style: 'mapbox://styles/mapbox/streets-v12', // Map style
  center: [-71.09415, 42.36027], // [longitude, latitude]
  zoom: 12, // Initial zoom level
  minZoom: 5, // Minimum allowed zoom
  maxZoom: 18 // Maximum allowed zoom
});

map.on('load', () => {
  // Add the Boston bike lanes data source
  map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
  });

  // Add a layer for Boston bike lanes
  map.addLayer({
    id: 'bike-lanes-boston', // Unique ID for Boston bike lanes
    type: 'line',
    source: 'boston_route',
    paint: {
      'line-color': '#32D400',  // Bright green using hex code
      'line-width': 5,          // Thicker lines
      'line-opacity': 0.6       // Slightly less transparent
    }
  });

  // Add the Cambridge bike lanes data source
  map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
  });

  // Add a layer for Cambridge bike lanes
  map.addLayer({
    id: 'bike-lanes-cambridge', // Unique ID for Cambridge bike lanes
    type: 'line',
    source: 'cambridge_route',
    paint: {
      'line-color': '#32D400',  // Bright green for Cambridge bike lanes
      'line-width': 5,          // Thicker lines
      'line-opacity': 0.6       // Slightly less transparent
    }
  });

  // Load the Bluebikes station data using D3
  const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json'; // Correct URL for Bluebikes data
  d3.json(jsonurl).then(jsonData => {
    console.log('Loaded JSON Data:', jsonData);  // Log to verify structure

    // Access the stations array from the loaded JSON data
    const stations = jsonData.data.stations;
    console.log('Stations Array:', stations);  // Log stations array

    // You can now add markers for each station here
    // (This part would be handled in the next steps)
  }).catch(error => {
    console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails
  });

});
