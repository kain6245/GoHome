const keys = require('../keys.json');
const U = require('./util');

const request = require('request-promise');
const xml2js = require('xml2js');
const iconv = require('iconv-lite');

/*

	Return all bikestops.
	Refer to: http://data.seoul.go.kr/dataList/OA-15493/A/1/datasetView.do
	
	Example of a bikestop:
	{
		"rackTotCnt": "22",
		"stationName": "102. 망원역 1번출구 앞",
		"parkingBikeTotCnt": "5",
		"shared": "0",
		"stationLatitude": "37.55564880",
		"stationLongitude": "126.91062927",
		"stationId": "ST-4"
	}

*/
exports.load_bikestops = async () => {
	U.log(`load bikestops from fetched`);
	let base_url = `http://openapi.seoul.go.kr:8088/${keys.api_key.seoul_opendata}/json/bikeList`;
	let option_1 = {
		url: `${base_url}/1/1000/`,
		encoding: null
	};
	let option_2 = {
		url: `${base_url}/1001/2000/`,
		encoding: null
	};

	// request bikestop list
	let list = [];
	try {
		let [json_1, json_2] = await Promise.all([
			requestAndParseJSON(option_1),
			requestAndParseJSON(option_2)
		]);
		list = list.concat(
			U.get_value(json_1, [], "rentBikeStatus", "row"),
			U.get_value(json_2, [], "rentBikeStatus", "row")
		);
	} catch (err) {
		U.error(err);
	}

	return list;
};

/*

	Return all N bus and its stations.

	Example of a info:
	{
		"busRouteId": "100100414",
		"busRouteNm": "6003",
		"corpNm": "공항리무진 02-2664-9898",
		"edStationNm": "서울대학교",
		"firstBusTm": "20200412065000",
		"firstLowTm": " ",
		"lastBusTm": "20200412230000",
		"lastBusYn": " ",
		"lastLowTm": "20191105000000",
		"length": "131",
		"routeType": "1",
		"stStationNm": "관악구청",
		"term": "55",

		"stations":
		[
			{
				"arsId": "22793",
				"beginTm": ":",
				"busRouteId": "115000009",
				"busRouteNm": "N6002",
				"direction": "인천공항(T2)",
				"gpsX": "127.0039283325",
				"gpsY": "37.5060680574",
				"lastTm": ":",
				"posX": "200347.29184193382",
				"posY": "445183.48014029907",
				"routeType": "1",
				"sectSpd": "6",
				"section": "121600113",
				"seq": "1",
				"station": "121000977",
				"stationNm": "강남고속버스터미널",
				"stationNo": "22793",
				"transYn": "N",
				"fullSectDist": "473",
				"trnstnid": "101000003"

				"arriveInfo":
				{
					"arrmsg1": ["운행종료"],
					"arrmsg2": ["운행종료"],
					"arsId": ["22793"],
					"avgCf1": ["0"],
					"avgCf2": ["0"],
					"brdrde_Num1": ["0"],
					"brdrde_Num2": ["0"],
					"brerde_Div1": ["0"],
					"brerde_Div2": ["0"],
					"busRouteId": ["115000009"],
					"busType1": ["0"],
					"busType2": ["0"],
					"deTourAt": ["00"],
					"dir": [" "],
					"expCf1": ["0"],
					"expCf2": ["0"],
					"exps1": ["0"],
					"exps2": ["0"],
					"firstTm": ["2020042300"],
					"full1": ["0"],
					"full2": ["0"],
					"goal1": ["0"],
					"goal2": ["0"],
					"isArrive1": ["0"],
					"isArrive2": ["0"],
					"isLast1": ["0"],
					"isLast2": ["0"],
					"kalCf1": ["0"],
					"kalCf2": ["0"],
					"kals1": ["0"],
					"kals2": ["0"],
					"lastTm": ["2020042300"],
					"mkTm": ["2020-04-23 13:27:30.0"],
					"namin2Sec1": ["0"],
					"namin2Sec2": ["0"],
					"neuCf1": ["0"],
					"neuCf2": ["0"],
					"neus1": ["0"],
					"neus2": ["0"],
					"nextBus": ["Y"],
					"nmain2Ord1": ["0"],
					"nmain2Ord2": ["0"],
					"nmain2Stnid1": ["0"],
					"nmain2Stnid2": ["0"],
					"nmain3Ord1": ["0"],
					"nmain3Ord2": ["0"],
					"nmain3Sec1": ["0"],
					"nmain3Sec2": ["0"],
					"nmain3Stnid1": ["0"],
					"nmain3Stnid2": ["0"],
					"nmainOrd1": ["0"],
					"nmainOrd2": ["0"],
					"nmainSec1": ["0"],
					"nmainSec2": ["0"],
					"nmainStnid1": ["0"],
					"nmainStnid2": ["0"],
					"nstnId1": ["0"],
					"nstnId2": ["0"],
					"nstnOrd1": ["0"],
					"nstnOrd2": ["0"],
					"nstnSec1": ["0"],
					"nstnSec2": ["0"],
					"nstnSpd1": ["0"],
					"nstnSpd2": ["0"],
					"plainNo1": [" "],
					"plainNo2": [" "],
					"rerdie_Div1": ["0"],
					"rerdie_Div2": ["0"],
					"reride_Num1": ["0"],
					"reride_Num2": ["0"],
					"routeType": ["1"],
					"rtNm": ["N6002"],
					"sectOrd1": ["0"],
					"sectOrd2": ["0"],
					"stId": ["121000977"],
					"stNm": ["강남고속버스터미널"],
					"staOrd": ["1"],
					"term": ["80"],
					"traSpd1": ["0"],
					"traSpd2": ["0"],
					"traTime1": ["0"],
					"traTime2": ["0"],
					"vehId1": ["0"],
					"vehId2": ["0"]
				}
			},
			...
		]
	}

*/
exports.load_nbus_info = async () => {
	U.log(`load N-Bus info from fetched`);

	let option_routelist = {
		uri: `http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList`,
		qs: {
			serviceKey: keys.api_key.data_portal
		}
	},
	option_getstations = {
		uri: `http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute`,
		qs: {
			serviceKey: keys.api_key.data_portal,
		}
	},
	option_arrive_info = {
		uri: `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRouteAll`,
		qs: {
			serviceKey: keys.api_key.data_portal,
		}
	};

	let i, len;
	let nbus_info_list = [];
	let route, routes, promise_stations = [], promise_arrive_infos = [];

	// get all bus routes
	try {
		routes = await requestAndParseJSON(option_routelist, 'xml').then(parse_itemList);

		// get all N-bus and find stations of each route
		promise_stations = [];
		promise_arrive_infos = [];
		for (i = 0, len = routes.length; i < len; i++) {
			route = routes[i];

			// take N-bus only
			if (U.get_value(route, null, "busRouteNm", 0, 0) != 'N') continue;

			// beautify: "property:[value]" -> "property:value"
			U.unwrap_properties(route);
			nbus_info_list.push(route);

			// request to get all stations of the bus
			option_getstations.qs.busRouteId = route.busRouteId;
			promise_stations.push(
				requestAndParseJSON(option_getstations, 'xml')
				.then(parse_itemList)
				.then(U.unwrap_properties)
			);
			option_arrive_info.qs.busRouteId = route.busRouteId;
			promise_arrive_infos.push(
				requestAndParseJSON(option_arrive_info, 'xml')
				.then(parse_itemList)
				.then(U.unwrap_properties)
			);
		}

		// CHECK: use Promise.allSettled
		let [json_stations, json_arrive_infos] = await Promise.all([
			Promise.all(promise_stations),
			Promise.all(promise_arrive_infos)
		]);

		let stations, arrive_infos;
		for (i = 0, len = nbus_info_list.length; i < len; i++) {

			stations = json_stations[i];
			arrive_infos = json_arrive_infos[i];

			// TODO: sort arriveInfo for optimization
			// save every arrive info into its station info
			for (let station of stations) {
				let stationNo = station.stationNo;
				station.arriveInfo = null;
				for (let arriveInfo of arrive_infos) {
					if (arriveInfo.arsId == stationNo) {
						station.arriveInfo = arriveInfo;
					}
				}
			}

			nbus_info_list[i].stations = stations;
		}
	} catch (err) {
		U.error(err);
		return [];
	}

	U.log(`${nbus_info_list.length} nbus_info fetched`);
	return nbus_info_list;
};


/*

	Return informations of a busstop.

*/
// TODO: test it
exports.load_buspaths = async (lat_start, lon_start, lat_end, lon_end) => {
	let info = [];
	let temp = [];
	let option = {
		uri: `http://ws.bus.go.kr/api/rest/pathinfo/getPathInfoByBus`,
		qs: {
			serviceKey: keys.api_key.data_portal,
			startX: lon_start,
			startY: lat_start,
			endX: lon_end,
			endY: lat_end,
		}
	};

	U.log(`load_buspaths(${lat_start}, ${lon_start}, ${lat_end}, ${lon_end})`);

	try {
		info = await requestAndParseJSON(option, 'xml').then(parse_itemList);

		if (!info) info = [];
		for (let path of info) {
			if (path.pathList) {
				if (path.pathList.every(path => {
					console.log(path.routeNm[0]);
					return path.routeNm[0][0] == 'N'
				})) {
					temp.push(path);
				}
			}
		}

		info = [];
		for (let path of temp) {
			let unwraped = U.unwrap_properties(path);
			unwraped.distance = parseInt(unwraped.distance);
			unwraped.time = parseInt(unwraped.time);
			unwraped.fx = parseInt(unwraped.fx);
			unwraped.fy = parseInt(unwraped.fy);
			unwraped.tx = parseInt(unwraped.tx);
			unwraped.ty = parseInt(unwraped.ty);
			info.push(unwraped);
		}
	} catch (err) {
		U.error(err);
	}

	return info;
};

/*

	Return a pedestrian route with the time required.
	Parameter 'points' is array of [lat, lon] but result is [lon, lat]

	Example of a route:
	{
		time: 868,
		distance: 1099,
		section_time: [868],
		section_distance: [1099],
		points: [
			[127.05353861565403, 37.5865481484368],
			...
		]
	}

*/
exports.get_pedestrian_route = (points) =>
	new Promise((resolve, reject) => {

		let i, passList;
		let result = {
			time: 0,
			distance: 0,
			section_time: [],
			section_distance: [],
			points: []
		};

		// handle exceptions
		if (points.length < 2)
			return reject('There should be 2 or more points.');
		
		passList = '';
		for (i = 1; i < points.length - 1; i++) {
			if (points[i].length == 2) {
				passList += `_${points[i][1]},${points[i][0]}`;
			}
		}
		passList = passList.slice(1);

		U.log(`get_pedestrian_route([${points}])`);
		let option = {
			method: "POST",
			uri: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1",
			form: {
				appKey: keys.api_key.tmap,
				startX: points[0][1], // lon
				startY: points[0][0], // lat
				endX: points[points.length - 1][1], // lon
				endY: points[points.length - 1][0], // lat
				passList: passList,
				reqCoordType: "WGS84GEO", // WGS84GEO, EPSG3857
				resCoordType: "WGS84GEO", // WGS84GEO, EPSG3857
				startName: "출발지",
				endName: "도착지"
			}
		};

		// request pedestrian route
		requestAndParseJSON(option)
		.then(json => {
			if (json?.type != 'FeatureCollection')
				return;

			let i, point_type, time, distance, feature, features;

			time = 0;
			distance = 0;
			features = json.features || [];
			for (i = 0; i < features.length; i++) {
				feature = features[i];

				// handle exception: unexpected type
				if (feature?.type != 'Feature') continue;

				// CHECK: Point와 LineString이 반드시 제 순서대로 들어와야 가능함
				if (feature.geometry.type == 'Point') {
					// check way point
					point_type = feature.properties.pointType;
					switch (point_type) {
						case 'EP': // 도착지
						case 'PP': // 경유지
						case 'PP1': // 경유지1
						case 'PP2': // 경유지2
						case 'PP3': // 경유지3
						case 'PP4': // 경유지4
						case 'PP5': // 경유지5
							result.section_time.push(time);
							result.section_distance.push(distance);
							result.time += time;
							result.distance += distance;
							time = 0;
							distance = 0;
							break;
						//case 'SP': // 출발지
						//case 'GP': // 일반 안내점
						//default: // error
						//	break;
					}
				} else {
					// LineString
					// push the point to the list in order
					result.points[feature.properties.lineIndex] = feature.geometry.coordinates;
					time += feature.properties.time ?? 0;
					distance += feature.properties.distance ?? 0;
				}
			}

			// delete all false-values
			result.points = result.points.filter(Boolean).flat();
		}, U.error)
		.then(() => resolve(result));
	});

exports.odsay_get_nbus_info = async () => {
	U.log(`get N-Bus info from odsay`);

	let option_routelist = {
		uri: `https://api.odsay.com/v1/api/searchBusLane`,
		qs: {
			apiKey: keys.api_key.odsay,
			busNo: 'N', // N bus only
			CID: 1000   // seoul
		}
	};
};

/*

	Extract itemList from response json.

*/
const parse_itemList = (json) =>
	U.get_value(json, [], "ServiceResult", "msgBody", 0, "itemList");

/*

	Request and decode the result to UTF8, and return it as JSON.

*/
const requestAndParseJSON = (option, type = 'json') =>
	new Promise((resolve, reject) => {
		U.log(`request to ${option.url || option.uri}`);

		request(option)
		.then(result => iconv.decode(Buffer.from(result), 'utf8'))
		.then(decoded => {

			// json to json
			if (type == 'json') {
				return resolve(JSON.parse(decoded));
			}

			// xml to json
			if (type == 'xml') {
				return xml2js
				.parseStringPromise(decoded)
				.then(resolve)
				.catch(err => {
					U.error('Error on parseStringPromise: ')
					U.error(err);
					resolve({});
				});
			}

			// undefined type
			return decoded;
		})
		.catch(err => {
			U.error('Error on requestAndParseAsJSON: ');
			U.error(err);
			resolve({});
		});
	});