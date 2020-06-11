const keys = require('../keys.json');
const U = require('./util');
const oapi = require('./oapi');
const bike = require('./bike');
const bus = require('./bus');

const CONCALL_BIKE_ROUTE_SEARCH   = keys.settings.concall_bike_route_search;
const CONCALL_BUS_ROUTE_SEARCH    = keys.settings.concall_bus_route_search;
const MAX_BIKE_ROUTE_SEARCH       = keys.settings.max_bike_route_search;
const MAX_BIKE_ROUTE_RETURN       = keys.settings.max_bike_route_return;
const MAX_BUS_ROUTE_SEARCH        = keys.settings.max_bus_route_search;
const MAX_BUS_ROUTE_RETURN        = keys.settings.max_bus_route_return;
const BIKESTOP_CANDIDATE_DISTANCE = keys.settings.bikestop_candidate_distance;
const MAX_BUSSTOP_SEARCH          = keys.settings.max_busstop_search;
const MAX_BIKE_SUBROUTE_SEARCH    = keys.settings.max_bike_subroute_search;
const MAX_BIKE_SUBROUTE_RETURN    = keys.settings.max_bike_subroute_return;

/*

	method: GET
	query:
		lat_start: [Number] latitude (값 없음: 경로 없음)
		lon_start: [Number] longitude (값 없음: 경로 없음)
		lat_end: [Number] latitude (값 없음: 경로 없음)
		lon_end: [Number] longitude (값 없음: 경로 없음)
		include_bike: [Y/N] include bike into the route (기본값: Y)
		include_bus: [Y/N] include bike into the route (기본값: Y)

	경로 탐색 후 몇 가지 추천경로를 반환

	response:
		n: 검색된 경로 수
		routes: 경로 목록
			{
				time: 예상 소요시간
				walking_distance: 예상 도보 거리
				brief_list: 간단한 경로 내용
				route_list: 상세한 경로 내용
					[
						{
							type: 경로 타입(도보/자전거/버스 등)
							type_info: 경로 상세(버스 번호 등)
							expected_time: 예상 소요시간
							points: 체크포인트 목록
							start_point_name: 출발지 이름 (정류장, 노선 번호 등)
							end_point_name: 도착지 이름 (정류장, 노선 번호 등)
						},
						...
					]
			}

*/
exports.api_get_routes = (req, res, next) => {
	let lat_start = req.query.lat_start;
	let lon_start = req.query.lon_start;
	let lat_end = req.query.lat_end;
	let lon_end = req.query.lon_end;
	let include_bike = !(req.query.include_bike == 'N');
	let include_bus = !(req.query.include_bus == 'N');
	
	// handle exception: invalid query
	if (U.isInvalid(res, lat_start, lon_start, lat_end, lon_end)) return;
	exports.get_routes(lat_start, lon_start, lat_end, lon_end, include_bike, include_bus)
	.then(routes => {
		U.response(res, true, `${routes.length} route found`, routes);
	})
	.catch(next);
};

exports.get_routes = (lat_start, lon_start, lat_end, lon_end, include_bike, include_bus) =>
	new Promise((resolve, reject) => {
		let o = make_o(lat_start, lon_start, lat_end, lon_end);

		// search all routes
		Promise.all([
			search_pedestrian_route(o),
			(include_bike ? search_bikebus_route(o, 'bike') : Promise.resolve()),
			(include_bus ? search_bikebus_route(o, 'bus') : Promise.resolve())
		])
		.then(() => {
			// end of searching
			U.log(`All routes are found.`);
			// sort by total time
			o.routes.sort((a, b) => a.time - b.time);
			for (let route of o.routes) {
				U.log(`time: ${route.time}`);
			}
			resolve(o.routes);
		});
	});

/*

	search pedestran route

*/
const search_pedestrian_route = async (o) => {
	let result = await oapi.get_pedestrian_route([[o.lat_start, o.lon_start], [o.lat_end, o.lon_end]]);

	// update upperbound for searching routes
	o.time_upperbound_bike = Math.min(o.time_upperbound_bike, result.time);
	o.time_upperbound_bus = Math.min(o.time_upperbound_bus, result.time);

	result.sections[0].type = 1;
	result.sections[0].stationNameStart = null;
	result.sections[0].stationNameEnd = null;
	result.sections[0].stationLatitudeStart = null;
	result.sections[0].stationLongitudeStart = null;
	result.sections[0].stationLatitudeEnd = null;
	result.sections[0].stationLongitudeEnd = null;

	o.routes.push(result);
};

const search_bikebus_route = async (o, type) => {
	let searched_results = [];
	let CONCALL_ROUTE_SEARCH, MAX_ROUTE_RETURN;

	if (type == 'bike') {
		CONCALL_ROUTE_SEARCH = CONCALL_BIKE_ROUTE_SEARCH;
		MAX_ROUTE_RETURN     = MAX_BIKE_ROUTE_RETURN;
	} else if (type == 'bus') {
		CONCALL_ROUTE_SEARCH = CONCALL_BUS_ROUTE_SEARCH;
		MAX_ROUTE_RETURN     = MAX_BUS_ROUTE_RETURN;
	} else if (type == 'subbike') {
		CONCALL_ROUTE_SEARCH = CONCALL_BIKE_ROUTE_SEARCH;
		MAX_ROUTE_RETURN     = MAX_BIKE_SUBROUTE_RETURN;
	}

	let candidate_routes = find_candidate_pairs(o, type);

	// search real time: promise-sequentially
	// it may takes really long time but able to reduce the number of API call.

	// it modify candidate_routes but no problem
	// candidate route info -> promise object for search result (boolean)

	let i = 0;
	while (i < candidate_routes.length) {
		if (
			!(await Promise.all(
				candidate_routes
				.slice(i, i + CONCALL_ROUTE_SEARCH)
				.map(async (c) => {
					let result = await search_candidate_route(o, type, c);
					if (result == null) {
						return false;
					} else {
						searched_results.push(result);
						return true;
					}
				})
			)).some(e => e)
		) break;

		i += CONCALL_ROUTE_SEARCH;
	}

	// after all searching
	U.log(`end of searching (type: ${type}),
	${searched_results.length} routes are really searched with API call.
	time upperbound: ${o.time_upperbound_bike}, ${o.time_upperbound_bus}`);

	// sort result out by its travel time
	searched_results.sort((a, b) => a.time - b.time);
	o.routes = o.routes.concat(searched_results.slice(0, MAX_ROUTE_RETURN));
};

const find_candidate_pairs = (o, type) => {

	let ar_start, ar_end, f_cached_time, f_approx_time, max_num;

	if (type == 'bike') {
		ar_start      = o.bikestops_near_start;
		ar_end        = o.bikestops_near_end;
		f_cached_time = bike.get_traveltime;
		f_approx_time = U.riding_time;
		max_num       = MAX_BIKE_ROUTE_SEARCH;
	} else if (type == 'bus') {
		ar_start      = o.busstops_near_start;
		ar_end        = o.busstops_near_end;
		f_cached_time = bus.get_traveltime;
		f_approx_time = U.driving_time;
		max_num       = MAX_BUS_ROUTE_SEARCH;
	} else if (type == 'subbike') {
		ar_start      = o.bikestops_near_start;
		ar_end        = o.bikestops_near_end;
		f_cached_time = bike.get_traveltime;
		f_approx_time = U.riding_time;
		max_num       = MAX_BIKE_SUBROUTE_SEARCH;
	}

	let traveltime, candidate_routes = [];

	// for every possible pairs
	for (let bs1 of ar_start) {
		for (let bs2 of ar_end) {
			if (bs1.stationId == bs2.stationId) continue;

			// calculate expected riding & walking time (in sec)
			traveltime = (
				f_cached_time(bs1.stationId, bs2.stationId) ||
				f_approx_time(
					bs1.stationLatitude, bs1.stationLongitude,
					bs2.stationLatitude, bs2.stationLongitude
				)
			)
			+ U.walking_time(o.lat_start, o.lon_start, bs1.stationLatitude, bs1.stationLongitude)
			+ U.walking_time(bs2.stationLatitude, bs2.stationLongitude, o.lat_end, o.lon_end);
			// add to the candidates
			candidate_routes.push({
				bs: [bs1, bs2],
				traveltime: traveltime
			});
		}
	}

	// for test
	U.log(`${candidate_routes.length} candidate pairs found, type: ${type}`);

	// sort pairs out by expected travel time
	candidate_routes.sort((a, b) => a.traveltime - b.traveltime);
	return candidate_routes.slice(0, max_num);
};

// return result or null
const search_candidate_route = async (o, type, candidate) => {

	let time_upperbound;

	if (type == 'bike' || type == 'subbike') {
		time_upperbound = o.time_upperbound_bike;
	} else if (type == 'bus') {
		time_upperbound = o.time_upperbound_bus;
	}

	// don't have to search longer way
	if (time_upperbound < candidate.traveltime) {
		U.log(`over the upperbound`);
		return null;
	}

	U.log(`real route searched
	expected minimum travel time: ${candidate.traveltime}, upperbound: ${time_upperbound}`);

	let bs1 = candidate.bs[0];
	let bs2 = candidate.bs[1];
	let result = await oapi.get_pedestrian_route([
		[o.lat_start, o.lon_start],
		[bs1.stationLatitude, bs1.stationLongitude],
		[bs2.stationLatitude, bs2.stationLongitude],
		[o.lat_end, o.lon_end],
	]);

	// for test: handle exception
	// TODO: make it available
	if (result.sections.length != 3) {
		U.error(`unexpected section length: ${result.sections.length}`);
		return null;
	}

	// add more info for response
	result.sections[0].stationNameStart = null;
	result.sections[0].stationNameEnd = null;
	result.sections[0].stationLatitudeStart = null;
	result.sections[0].stationLongitudeStart = null;
	result.sections[0].stationLatitudeEnd = null;
	result.sections[0].stationLongitudeEnd = null;

	result.sections[1].stationNameStart = bs1.stationName;
	result.sections[1].stationNameEnd = bs2.stationName;
	result.sections[1].stationLatitudeStart = bs1.stationLatitude;
	result.sections[1].stationLongitudeStart = bs1.stationLongitude;
	result.sections[1].stationLatitudeEnd = bs2.stationLatitude;
	result.sections[1].stationLongitudeEnd = bs2.stationLongitude;

	result.sections[2].stationNameStart = null;
	result.sections[2].stationNameEnd = null;
	result.sections[2].stationLatitudeStart = null;
	result.sections[2].stationLongitudeStart = null;
	result.sections[2].stationLatitudeEnd = null;
	result.sections[2].stationLongitudeEnd = null;

	if (type == 'bike' || type == 'subbike') {
		result.sections[0].type = 1;
		result.sections[1].type = 2;
		result.sections[2].type = 1;
	} else if (type == 'bus') {
		result.sections[0].type = 1;
		result.sections[1].type = 3;
		result.sections[2].type = 1;
	}

	// re-calculate time since the middle section is for riding, not walking
	if (type == 'bike' || type == 'subbike') {
		result.sections[1].time = U.walking_time_2_riding_time(result.sections[1].time);
		bike.cache_traveltime(bs1.stationId, bs2.stationId, result.sections[1].time);
	} else if (type == 'bus') {

		// result.buspath = await oapi.odsay_get_nbus_routes(
		// 	bs1.stationLatitude, bs1.stationLongitude,
		// 	bs2.stationLatitude, bs2.stationLongitude
		// );
		result.buspath = await oapi.topis_get_nbus_routes(
			bs1.stationLatitude, bs1.stationLongitude,
			bs2.stationLatitude, bs2.stationLongitude
		);

		if (result.buspath == null) {
			U.error('bus route not found!');
			return null;
		}

		result.sections[1].points = result.buspath.points;
		result.sections[1].time = result.buspath.time * 60;
		delete result.buspath.points;
		// bus.cache_traveltime(bs1.stationId, bs2.stationId, result.sections[1].time);

		/*

		*/

		let time_upperbound_bike1 = result.sections[0].time;
		let time_upperbound_bike2 = result.sections[2].time;
		let o_subbike_routes1 = make_o(o.lat_start, o.lon_start, bs1.stationLatitude, bs1.stationLongitude);
		let o_subbike_routes2 = make_o(bs2.stationLatitude, bs2.stationLongitude, o.lat_end, o.lon_end);
		o_subbike_routes1.time_upperbound_bike = time_upperbound_bike1;
		o_subbike_routes2.time_upperbound_bike = time_upperbound_bike2;

		await search_bikebus_route(o_subbike_routes1, 'subbike');
		await search_bikebus_route(o_subbike_routes2, 'subbike');

		let route1 = o_subbike_routes1.routes.slice(0, 1);
		let route2 = o_subbike_routes2.routes.slice(0, 1);
		if (route1.length > 0 && route1[0].time < time_upperbound_bike1) {
			let subsection1 = route1[0];
			//result.bs.splice(0, 0, ...subsection1.bs);
			//result.brief_list.splice(0, 1, ...subsection1.brief_list);
			result.sections.splice(0, 1, ...subsection1.sections);
		}
		if (route2.length > 0 && route2[0].time < time_upperbound_bike2) {
			let subsection2 = route2[0];
			//result.bs.splice(-1, 0, ...subsection2.bs);
			//result.brief_list.splice(-1, 1, ...subsection2.brief_list);
			result.sections.splice(-1, 1, ...subsection2.sections);
		}
	}

	calculate_o_td(result);

	// update time_upperbound
	if (result.time < time_upperbound) {
		if (type == 'bike' || type == 'subbike') {
			o.time_upperbound_bike = result.time;
		} else if (type == 'bus') {
			o.time_upperbound_bus = result.time;
		}
	}

	return result;
};

const make_o = (lat_start, lon_start, lat_end, lon_end) => {
	let o = {
		lat_start: lat_start,
		lon_start: lon_start,
		lat_end: lat_end,
		lon_end: lon_end,
		routes: [],
		time_upperbound_bike: Infinity,
		time_upperbound_bus: Infinity,
		linear_distance: U.distance(lat_start, lon_start, lat_end, lon_end),
		bikestops_near_start: null,
		bikestops_near_end: null,
		busstops_near_start: null,
		busstops_near_end: null,
	};

	o.bikestops_near_start = bike.get_bikestops(o.lat_start, o.lon_start, 0, o.linear_distance * BIKESTOP_CANDIDATE_DISTANCE);
	o.bikestops_near_end = bike.get_bikestops(o.lat_end, o.lon_end, 0, o.linear_distance * BIKESTOP_CANDIDATE_DISTANCE);
	o.busstops_near_start = bus.get_near_stations(o.lat_start, o.lon_start, MAX_BUSSTOP_SEARCH);
	o.busstops_near_end = bus.get_near_stations(o.lat_end, o.lon_end, MAX_BUSSTOP_SEARCH);

	return o;
};

const calculate_o_td = (r) => {
	r.time = r.sections.reduce((prev, current) => prev + current?.time ?? 0, 0);
	r.distance = r.sections.reduce((prev, current) => prev + current?.distance ?? 0, 0);
};