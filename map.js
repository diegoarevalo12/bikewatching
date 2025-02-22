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

// Add an SVG element to the map container
const svg = d3.select(map.getCanvasContainer()).append('svg');
let stations = [];  // Initialize empty stations array

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
  const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
  d3.json(jsonurl).then(jsonData => {
    console.log('Loaded JSON Data:', jsonData);

    // Access the stations array from the loaded JSON data
    stations = jsonData.data.stations;
    console.log('Stations Array:', stations);

    // Function to get coordinates and project them on the map
    function getCoords(station) {
      const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
      const { x, y } = map.project(point);  // Project to pixel coordinates
      return { cx: x, cy: y };  // Return as object for use in SVG attributes
    }

    // Append circles to the SVG for each station
    const circles = svg.selectAll('circle')
      .data(stations)
      .enter()
      .append('circle')
      .attr('r', 5)               // Radius of the circle
      .attr('fill', 'steelblue')  // Circle fill color
      .attr('stroke', 'white')    // Circle border color
      .attr('stroke-width', 1)    // Circle border thickness
      .attr('opacity', 0.8);      // Circle opacity

    // Function to update circle positions when the map moves/zooms
    function updatePositions() {
      circles
        .attr('cx', d => getCoords(d).cx)  // Set the x-position using projected coordinates
        .attr('cy', d => getCoords(d).cy); // Set the y-position using projected coordinates
    }

    // Initial position update when map loads
    updatePositions();

    // Reposition markers on map interactions
    map.on('move', updatePositions);     // Update during map movement
    map.on('zoom', updatePositions);     // Update during zooming
    map.on('resize', updatePositions);   // Update on window resize
    map.on('moveend', updatePositions);  // Final adjustment after movement ends

  }).catch(error => {
    console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails
  });
});
