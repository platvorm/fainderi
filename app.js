var app = (function() {
	// Application object.
	var app = {};

	// Specify your beacon 128bit UUIDs here.
	var regions = [
		{ uuid: '8EC8B69C-34E3-AC64-7984-7E2538AA7354' }
	];

	// Dictionary of beacons.
	var beacons = {};

	// Timer that displays list of beacons.
	var updateTimer = null;

	app.initialize = function() {
		document.addEventListener('deviceready', onDeviceReady, false);
	};

	function onDeviceReady() {
		// Specify a shortcut for the location manager holding the iBeacon functions.
		window.locationManager = cordova.plugins.locationManager;

		// Start tracking beacons!
		startScan();

		// Display refresh timer.
		updateTimer = setInterval(displayBeaconList, 100);
	}

	function startScan() {
		// The delegate object holds the iBeacon callback functions
		// specified below.
		var delegate = new locationManager.Delegate();

		// Called continuously when ranging beacons.
		delegate.didRangeBeaconsInRegion = function(pluginResult) {
			//console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
			for (var i in pluginResult.beacons) {
				// Insert beacon into table of found beacons.
				var beacon = pluginResult.beacons[i];
				beacon.timeStamp = Date.now();
				var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
				beacons[key] = beacon;
			}
		};

		// Called when starting to monitor a region.
		// (Not used in this example, included as a reference.)
		delegate.didStartMonitoringForRegion = function(pluginResult) {
			//console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
		};

		// Called when monitoring and the state of a region changes.
		// (Not used in this example, included as a reference.)
		delegate.didDetermineStateForRegion = function(pluginResult) {
			//console.log('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
		};

		// Set the delegate object to use.
		locationManager.setDelegate(delegate);

		// Request permission from user to access location info.
		// This is needed on iOS 8.
		locationManager.requestAlwaysAuthorization();

		// Start monitoring and ranging beacons.
		for (var i in regions) {
			var beaconRegion = new locationManager.BeaconRegion(i + 1, regions[i].uuid);

			// Start ranging.
			locationManager.startRangingBeaconsInRegion(beaconRegion)
				.fail(console.error)
				.done();

			// Start monitoring.
			// (Not used in this example, included as a reference.)
			locationManager.startMonitoringForRegion(beaconRegion)
				.fail(console.error)
				.done();
		}
	}

	function displayBeaconList() {
		// Clear beacon list.
		$('#found-beacons').empty();

		var timeNow = Date.now();

		// Update beacon list.
		$.each(beacons, function(key, beacon) {
			// console.log(JSON.stringify(beacon, null, 2));

			// Only show beacons that are updated during the last 60 seconds.
			if (beacon.timeStamp + 60000 > timeNow) {
				// Map the RSSI value to a width in percent for the indicator.
				var rssiWidth = 1; // Used when RSSI is zero or greater.
				if (beacon.rssi < -100) { rssiWidth = 100; }
				else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }

				// Create tag to display beacon data.
				var element = $(
					'<li>'
					+	'UUID: ' + beacon.uuid + '<br />'
					+	'Major: ' + beacon.major + '<br />'
					+	'Minor: ' + beacon.minor + '<br />'
					+	'Proximity: ' + beacon.proximity + '<br />'
					+	'RSSI: ' + beacon.rssi + '<br />'
					+	'distance: ' + rssiToDistance(beacon.rssi) + '<br />'
					+	'distance: ' + prettyDistance(rssiToDistance(beacon.rssi)) + '<br />'
					+ 	'<div style="background:rgb(255,128,64);height:20px;width:'
					+ 		rssiWidth + '%;"></div>'
					+ '</li>'
				);

				// $('.data-uuid').html(beacon.uuid + '.' + beacon.major + '.' + beacon.minor);
				// $('.proximity').html(beacon.proximity);

				var dist = rssiToDistance(beacon.rssi);

				$('.number').html(dist);

				if (dist === "searching" || !isFinite(dist)) {
					$('.number').addClass('small');
				}
				else {
					$('.small').removeClass('small');
				}

				$('#warning').remove();
				$('#found-beacons').append(element);
			}
		});
	}

	return app;
})();

app.initialize();

function prettyDistance(beacon) {
	var meters = beacon.distance;
	if (!meters) { return ''; }

	var distance = (meters > 1) ? meters.toFixed(3) + ' m' : (meters * 100).toFixed(3) + ' cm';

	if (meters < 0) { distance = '?'; }

	return distance;
}

function rssiToDistance(rssi) {
	var txPower = 0; 	// hard coded power value. Usually ranges between -59 to -65

	if (rssi === 0) { return -1.0; }

	var ratio = rssi * 1.0 / txPower;

	// var dist = 1000;

	if (ratio < 1.0) {
		return Math.pow(ratio, 10);
		// dist = dist + 'm';
		// dist = 'searching';
	}
	else {
		var distance = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
		return Math.round(distance);
		// dist = dist + 'm';
	}

	// if (dist > 99 || dist < 0) {
	// 	dist = 'searching';
	// }
	// else {
	// 	dist = dist + 'm';
	// }

	// console.log('dist: ' + dist);

	// return dist;
}

// function rssiToDistance(rssi) {
// 	var txPower = 0; 	// hard coded power value. Usually ranges between -59 to -65

// 	if (rssi === 0) { return -1.0; }

// 	var ratio = rssi * 1.0 / txPower;

// 	if (ratio < 1.0) {
// 		return Math.pow(ratio, 10);
// 	}
// 	else {
// 		var distance = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
// 		return Math.round(distance);
// 	}
// }