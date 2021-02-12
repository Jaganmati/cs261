/**
 * @file The game endpoint implementation.
 * @author Johnathan Faehn
 */

const userUtils = require('../utils/user');
const common = require('../utils/common');
const crypto = require('crypto');

/**
 * The game endpoint's connect action callback.
 * This function manages client connection using data provided through a GET or POST request.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
const connect = async (req, res, next) => {
	// Check if the request is associated with an authorized user.
	const auth = await common.authenticate(req);
	if (auth.status != "success")
		return res.send(auth);
	
	// Get the user instance associated with this request.
	const user = await userUtils.getUser(auth.session.user);

	const data = user.username.concat(user.avatar ? user.avatar : '').concat(user.id).concat(process.env.SHARED_SECRET);
	const hash = crypto.createHash('sha256').update(data).digest('hex');
	
	return common.sendResponse(res, null, {id: user.id, username: user.username, avatar: user.avatar, server: '54.186.203.114:8008', token: hash}); // TODO: Move this to Redis / Env variable.
}

/**
 * The game endpoint's action registration function
 * @param {string} root - The route endpoint.
 * @param {express} app - The express instance to register with.
 */
module.exports.register = (root, app) => {
    let _root = root;
    if (_root.slice(-1) != '/')
        _root += '/';
	
	// Register all action callbacks.
    app.get(_root + 'connect', connect);
    app.post(_root + 'connect', connect);
}