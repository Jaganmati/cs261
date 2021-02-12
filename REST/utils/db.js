const mongodb = require('mongodb').MongoClient;
const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const redisClient = redis.createClient(6379, '172.31.44.222');

const dbBase = 'mongodb://172.31.34.176:27017';

module.exports.mongodb = mongodb;
module.exports.redis = redisClient;

const dbFunc = (action, callback) => {
	mongodb.connect(dbBase, { useNewUrlParser: true }, async (err, res) => {
		if (err)
		{
			if (callback)
				callback(err);
			return;
		}
		
		try {
			await action(res);
		} catch (e) {
			if (callback)
				callback(e.toString());
		} finally {
			res.close();
		}
	});
}

module.exports.createCollection = (collection, options, callback) => {
	dbFunc((db) => {
		db.createCollection(collection, options);
	}, callback);
}

module.exports.insert = (database, collection, object, callback) => {
	dbFunc(async (db) => {
		let col = db.db(database).collection(collection);
	
		let result = await (Array.isArray(object) ? col.insertMany(object) : col.insertOne(object));
		
		if (callback)
			callback(null, result);
	}, callback);
}

module.exports.delete = (database, collection, object, callback) => {
	dbFunc(async (db) => {
		let col = db.db(database).collection(collection);
		let result;
		
		if (Array.isArray(object)) {
			if (!col.isCapped())
				result = await col.deleteMany(object);
		} else {
			if (col.isCapped())
				result = await col.drop();
			else result = await col.deleteOne(object);
		}
		
		if (callback)
			callback(null, result);
	}, callback);
}

module.exports.update = (database, collection, filter, modifications, callback) => {
	dbFunc(async (db) => {
		let col = db.db(database).collection(collection);
		let result = await col.updateOne(filter, modifications);
		
		if (callback)
			callback(null, result);
	}, callback);
}

module.exports.find = (database, collection, query, projection, callback) => {
	dbFunc(async (db) => {
		let result = await db.db(database).collection(collection).find(query, projection);
		
		if (callback)
			callback(null, result);
	}, callback);
}

module.exports.count = (database, collection, query, callback) => {
	dbFunc(async (db) => {
		let result = await db.db(database).collection(collection).count(query);
		
		if (callback)
			callback(null, result);
	}, callback);
}

module.exports.get = function(key) {
	let result = key => new Promise(([resolve, reject]) => redisClient.get(key, function(err, res) {
		if (err)
		{
			reject(err);
			return;
		}
		
		resolve(res);
	}));
	
	return result;
}