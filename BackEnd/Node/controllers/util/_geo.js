/*

	Calculate distance(km) between 2 GPS coordinates using haversine.

*/
exports.distance = (lat_1, lat_2, lon_1, lon_2) => {
	// convert unit of distance from degree to radian
	// and pre-calculate
	let d_lat = Math.sin((lat_2 - lat_1) * 3.141592653589793 / 360);
	let d_lon = Math.sin((lon_2 - lon_1) * 3.141592653589793 / 360);

	let a = d_lat * d_lat +
		Math.cos(lat_1 * 0.017453292519943295) * Math.cos(lat_2 * 0.017453292519943295) *
		d_lon * d_lon;

	// 12742: earth diameter (km)
	return 12.742 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/*

	Calculate distance(km) between 2 GPS coordinates approximately.
	The distance can be approximated well at Seoul.

	Criteria:
		1 longitude = 88.18730561892288 km
		1 latitude  = 111.1949266445577 km

		exports.distance(37.525, 37.525, 126.9, 127.1) = 17.637461123784576 km
		exports.distance(37.600, 37.450, 127.0, 127.0) = 16.679238996683655 km

*/
exports.approx_distance = (lat_1, lat_2, lon_1, lon_2) => {
	let d_lat = (lat_1 - lat_2) * 111194.9266445577;
	let d_lon = (lon_1 - lon_2) * 88187.30561892288;

	return Math.sqrt(d_lat * d_lat + d_lon * d_lon);
};

/*

	Calculate walking time(min) between 2 GPS coordinates.
	Walking speed: 4 km/h

	min = h * 60 = km / (km/h) * 60

*/
exports.walking_time = (lat_1, lat_2, lon_1, lon_2) => exports.distance(lat_1, lat_2, lon_1, lon_2) / 4 * 60;
exports.approx_walking_time = (lat_1, lat_2, lon_1, lon_2) => exports.approx_distance(lat_1, lat_2, lon_1, lon_2) / 4 * 60;