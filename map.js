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
let trips = [];     // Initialize empty trips array to hold traffic data

map.on('load', () => {
  // Add the Boston and Cambridge bike lanes (from previous steps)
  map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
  });

  map.addLayer({
    id: 'bike-lanes-boston',
    type: 'line',
    source: 'boston_route',
    paint: {
      'line-color': '#32D400',
      'line-width': 5,
      'line-opacity': 0.6
    }
  });

  map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
  });

  map.addLayer({
    id: 'bike-lanes-cambridge',
    type: 'line',
    source: 'cambridge_route',
    paint: {
      'line-color': '#32D400',
      'line-width': 5,
      'line-opacity': 0.6
    }
  });

  // Load the Bluebikes station data
  const stationUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
  d3.json(stationUrl).then(jsonData => {
    stations = jsonData.data.stations;
    console.log('Stations Array:', stations);

    // Load the Bluebikes traffic data
    const trafficUrl = 'https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv';
    d3.csv(trafficUrl, trip => {
      trip.started_at = new Date(trip.started_at);
      trip.ended_at = new Date(trip.ended_at);
      return trip;
    }).then(csvData => {
      trips = csvData;
      console.log('Trips Array:', trips);

      function computeStationTraffic(stations, trips) {
        // Compute departures
        const departures = d3.rollup(
          trips,
          (v) => v.length,
          (d) => d.start_station_id
        );

        // Compute arrivals
        const arrivals = d3.rollup(
          trips,
          (v) => v.length,
          (d) => d.end_station_id
        );

        // Update each station with arrivals, departures, and total traffic
        return stations.map((station) => {
          const id = station.short_name;
          station.arrivals = arrivals.get(id) ?? 0;
          station.departures = departures.get(id) ?? 0;
          station.totalTraffic = station.arrivals + station.departures;
          return station;
        });
      }

      let stationFlow = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);

      // Call the function to compute traffic data
      stations = computeStationTraffic(stations, trips);
      console.log('Updated Stations with Traffic:', stations);

      // Define a square root scale for circle radius based on total traffic
      const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(stations, d => d.totalTraffic)])
        .range([0, 25]);  // Default range for circle radius

      // Function to get coordinates and project them on the map
      function getCoords(station) {
        const point = new mapboxgl.LngLat(+station.lon, +station.lat);
        const { x, y } = map.project(point);  // Project to pixel coordinates
        return { cx: x, cy: y };
      }

      // Append circles to the SVG for each station
      const circles = svg.selectAll('circle')
        .data(stations, d => d.short_name)
        .enter()
        .append('circle')
        .attr('fill', 'steelblue')  // Circle fill color
        .attr('stroke', 'white')    // Circle border color
        .attr('stroke-width', 1)    // Circle border thickness
        .attr('fill-opacity', 0.6)  // Set fill opacity to 60%
        .attr('pointer-events', 'none')  // Disable pointer events for interactivity
        .each(function(d) {
          // Add <title> for browser tooltips
          d3.select(this)
            .append('title')
            .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`)
            .style("--departure-ratio", d => stationFlow(d.departures / d.totalTraffic));
        });

      // Function to update circle positions and sizes when the map moves/zooms
      function updatePositions() {
        circles
          .attr('cx', d => getCoords(d).cx)  // Set x-position
          .attr('cy', d => getCoords(d).cy)  // Set y-position
          .attr('r', d => radiusScale(d.totalTraffic));  // Set radius based on total traffic
      }

      // Initial position update when map loads
      updatePositions();

      // Reposition and resize circles on map interactions
      map.on('move', updatePositions);
      map.on('zoom', updatePositions);
      map.on('resize', updatePositions);
      map.on('moveend', updatePositions);

      // Helper function: convert Date object to minutes since midnight
      function minutesSinceMidnight(date) {
        return date.getHours() * 60 + date.getMinutes();
      }

      // Helper function: filter trips based on selected time
      function filterTripsByTime(trips, timeFilter) {
        return timeFilter === -1
          ? trips  // No filter
          : trips.filter(trip => {
              const startedMinutes = minutesSinceMidnight(trip.started_at);
              const endedMinutes = minutesSinceMidnight(trip.ended_at);
              return (
                Math.abs(startedMinutes - timeFilter) <= 60 ||
                Math.abs(endedMinutes - timeFilter) <= 60
              );
            });
      }

      

      // Function to update scatterplot based on time filter
      function updateScatterPlot(timeFilter) {
        const filteredTrips = filterTripsByTime(trips, timeFilter);
        const filteredStations = computeStationTraffic(stations, filteredTrips);

        // Update radiusScale based on filter
        timeFilter === -1
          ? radiusScale.range([0, 25])
          : radiusScale.range([3, 50]);

        // Update the circles on the map
        circles
          .data(filteredStations, d => d.short_name)
          .join('circle')
          .attr('r', d => radiusScale(d.totalTraffic))
          .style('--departure-ratio', (d) =>
            stationFlow(d.departures / d.totalTraffic),);
      }

      // Time slider and display elements
      const timeSlider = document.getElementById('time-slider');
      const selectedTime = document.getElementById('selected-time');
      const anyTimeLabel = document.getElementById('any-time');

      function formatTime(minutes) {
        const date = new Date(0, 0, 0, 0, minutes);
        return date.toLocaleString('en-US', { timeStyle: 'short' });
      }

      function updateTimeDisplay() {
        const timeFilter = Number(timeSlider.value);

        if (timeFilter === -1) {
          selectedTime.textContent = '';  // Clear display
          anyTimeLabel.style.display = 'block';  // Show "(any time)"
        } else {
          selectedTime.textContent = formatTime(timeFilter);  // Show formatted time
          anyTimeLabel.style.display = 'none';  // Hide "(any time)"
        }

        // Update scatterplot based on the selected time filter
        updateScatterPlot(timeFilter);
      }

      timeSlider.addEventListener('input', updateTimeDisplay);
      updateTimeDisplay();
    }).catch(error => {
      console.error('Error loading CSV:', error);  // Handle CSV loading errors
    });
  }).catch(error => {
    console.error('Error loading JSON:', error);  // Handle JSON loading errors
  });
});
