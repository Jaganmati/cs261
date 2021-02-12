/**
 * @file The User and Session implementation, as well as their lookup methods.
 * @author Johnathan Faehn
 */

const crypto = require('crypto');
const db = require('./db');
const hashSecret = 'e5fbeaf87026852e50d717f27ae3ec62'; // TODO: Don't store sensitive information here.

/**
 * Represents a user.
 * @constructor
 * @param {string} username - The user's unique name.
 * @param {string} password - The user's security password.
 * @param {string} avatar - The URL of the user's avatar, or undefined if none is being set.
 */
module.exports.User = function(username, password, avatar, callback) {
	if (username === undefined)
		return;
	
	const hmac = crypto.createHmac('sha256', hashSecret);
	const pass = hmac.update(password).digest('hex');
	
	db.insert('cs261', 'users', {'username': username, 'password': pass, 'avatar': avatar ? avatar : ''}, (err, res) => {
		if (err)
		{
			if (callback)
				callback(err);
			return;
		}
		
		this.id = res.insertedId.toString();
		db.redis.set('name-' + username.toLowerCase(), this.id);
		
		let user = {'id': this.id, 'username': username, 'password': pass};
		if (avatar)
			user['avatar'] = avatar;
		
		db.redis.hmset('user-' + this.id, user);
		
		if (callback)
			callback(null, res);
	});
}

/**
 * Represents a login session.
 * @constructor
 * @param {string} userId - The id of the associated user.
 */
module.exports.Session = function(userId) {
	if (userId === undefined)
		return;
	
	/** @function */
	this.id = this.generateToken();    // The session's unique id.
	/** @function */
	this.token = this.generateToken(); // The session's authentication token.
	this.user = userId;                // The id of the user that was logged into.
	
	db.redis.hmset('session-' + this.id, {'id': this.id, 'token': this.token, 'user': userId});
	this.refresh();
}

/**
 * Compare a password against the user's password.
 * @param {string} password - The password to be tested.
 * @returns {boolean} true if the password is correct, false otherwise.
 */
module.exports.User.prototype.isPassword = function(password, callback) {
	// Hash the provided password, and compare it against the stored value.
	const hmac = crypto.createHmac('sha256', hashSecret);
	
	const func = async () => {
		if (await db.redis.existsAsync('user-' + this.id)) {
			const obj = await db.redis.hgetallAsync('user-' + this.id);
			
			if (callback)
				callback(null, obj.password === hmac.update(password).digest('hex'));
			
			return;
		}
		
		db.find('cs261', 'users', {_id: this.id}, {password: 1}, (err, res) => {
			if (err)
			{
				if (callback)
					callback(err);
				
				return;
			}
			
			if (callback)
			{
				try {
					const records = res.toArray();
					const result = records.length > 0 && records[0].password === hmac.update(password).digest('hex');
					
					callback(null, result);
				} catch (e) {
					callback(e.toString());
				}
			}
		});
	};
	
	func();
}

/**
 * Update the user's password.
 * This will do nothing if the old password is incorrect.
 * @param {string} from - The old password.
 * @param {string} to - The new password.
 * @return {boolean} Whether or not the password was successfully updated.
 */
module.exports.User.prototype.updatePassword = function(from, to) {
	return new Promise((resolve, reject) => {
		this.isPassword(from, async (err, valid) => {
			if (err)
			{
				resolve({error: err, result: false});
				return;
			}
			
			// Don't allow an update if the old password is wrong.
			if (!valid)
			{
				resolve({error: {oldPassword: "Forbidden"}, result: false});
			}
			else
			{
				// Hash the new password, and store its value.
				const hmac = crypto.createHmac('sha256', hashSecret);
				const password = hmac.update(to).digest('hex');
				
				db.update('cs261', 'users', {_id: this.id}, {$set: {'password': password}}, async (err, res) => {
					if (err)
					{
						resolve({error: err, result: false});
						return;
					}
					
					let updated = res.nModified > 0;
					
					//if (updated)
					{
						const obj = await db.redis.hgetallAsync('user-' + this.id);
						obj.password = password;
						await db.redis.hmsetAsync('user-' + this.id, obj);
					}
					
					resolve({error: null, result: updated});
				});
			}
		});
	});
}

module.exports.User.prototype.setAvatar = function(avatar, callback) {
	this.avatar = avatar;
	
	db.update('cs261', 'users', {_id: this.id}, {$set: {'avatar': avatar}}, async (err, res) => {
		if (err)
		{
			if (callback)
				callback(err);
			console.log(err);
			return;
		}
		
		let result = res.nModified > 0;
		
		//if (result)
		{
			const obj = await db.redis.hgetallAsync('user-' + this.id);
			obj.avatar = avatar;
			await db.redis.hmsetAsync('user-' + this.id, obj);
		}
		
		if (callback)
			callback(null, result);
	});
}

/**
 * Generate a random 16 byte token.
 * This is used for the login session's id and authentication token.
 * @return {string} The random token.
 */
module.exports.Session.prototype.generateToken = function() {
	// Generate a random token for the session id and authentication token.
	return crypto.randomBytes(16).toString('hex');
}

module.exports.Session.prototype.refresh = function() {
	// Set the session to expire in 10 minutes (600 seconds).
	db.redis.expire('session-' + this.id, 600);
}

/**
 * Get a user by id or username.
 * @param {(string|string[])} user - The user's id, username, or request object containing the id, username, or both.
 * @return {User} The User instance that was requested, or null if none was found.
 */
module.exports.getUser = async (user) => {
	// If the provided argument was a string,
	if (typeof user == 'string') {
		// and a registered user's name, get the user's id
		if (await db.redis.existsAsync('name-' + user.toLowerCase()))
			user = await db.redis.getAsync('name-' + user.toLowerCase());
		
		// then convert the argument into an object for a standardized interface.
		user = {id: user};
	}
	// If the username was provided, but not the id, get the user's id.
	else if (user && user.id === undefined && user.username !== undefined)
		user.id = await db.redis.getAsync('name-' + user.username.toLowerCase());
	
	// Return null rather than undefined if the key is not found or known.
	if (!user.id || !(await db.redis.existsAsync('user-' + user.id.toString())))
		return null;
	
	// Get the stored user instance (it's known to exist by this point).
	user = await db.redis.hgetallAsync('user-' + user.id.toString());
	
	const result = new module.exports.User();
	
	result.id = user.id;
	result.username = user.username;
	result.password = user.password;
	result.avatar = user.avatar !== '' ? user.avatar : undefined;
	
	return result;
}

module.exports.hasUser = async (user) => {
	return (await db.redis.existsAsync('name-' + user)) || (await db.redis.existsAsync('user-' + user));
}

/**
 * Get a session by id.
 * @param {string} session - The login session id.
 * @return {Session} The Session instance that was requested, or undefined if none was found.
 */
module.exports.getSession = async (session) => {
	const obj = await db.redis.hgetallAsync('session-' + session);
	
	if (!obj)
		return null;
	
	let result = new module.exports.Session();
	result.id = obj.id;
	result.token = obj.token;
	result.user = obj.user;
	
	return result;
}
