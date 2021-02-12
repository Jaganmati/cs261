/**
 * @file The users endpoint implementation.
 * @author Johnathan Faehn
 */

const userUtils = require('../utils/user');
const common = require('../utils/common');

/**
 * The users endpoint's create action callback.
 * This function manages user creation using data provided through a GET or POST request.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
const create = async (req, res, next) => {
	// Verify all required arguments were provided, and get the optional one if it's found.
	const args = common.verifyArguments(req, [ "username", "password" ], [ "avatar" ]);
	if (args.status != "success")
		return res.send(args);
	
	const user = args.data.username;
	const pass = args.data.password;
	
	// Allow an unset avatar to be undefined.
	const avatar = args.data.avatar;
	
	try {
		// Check if the username is already in use.
		// Usernames are not case sensitive.
		if (await userUtils.hasUser(user.toLowerCase()))
			return common.sendResponse(res, {username: "Already taken"});
		
		// Create an instance for this new user.
		new userUtils.User(user, pass, avatar, function(err, result) {
			if (err)
				common.sendResponse(res, err);
			
			// Send a response with the new user's id and username.
			common.sendResponse(res, null, {'id': result.insertedId.toString(), 'username': user});
		});
	} catch (err) {
		common.sendResponse(res, err.toString());
	}
	
	return;
}

/**
 * The users endpoint's get and find action callback.
 * This function manages user creation using data provided through a POST request.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
const get = async (req, res, next) => {
	// Check if the request is associated with an authorized user.
	const auth = await common.authenticate(req);
	if (auth.status != "success")
		return res.send(auth);
	
	// Search for the requested user using the passed parameters (expects either id or username).
	const user = await userUtils.getUser(req.params);
	if (!user) {
		let errors = {};
		
		// Log errors for invalid parameters.
		for (let param in req.params)
			errors[param] = "Not found";
		
		return common.sendResponse(res, errors);
	}
	
	return common.sendResponse(res, null, {id: user.id, username: user.username, avatar: user.avatar});
}

/**
 * The users endpoint's login action callback.
 * This function manages user creation using data provided through a GET or POST request.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
const login = async (req, res, next) => {
	// Verify all required arguments were provided.
	const args = common.verifyArguments(req, [ "username", "password" ]);
	if (args.status != "success")
		return res.send(args);
	
	const username = args.data.username;
	const password = args.data.password;
	const user = await userUtils.getUser(username);
	
	// Fail if the user was not found,
	if (!user)
		return common.sendResponse(res, "Username/password mismatch");
	
	// or if the password is invalid.
	user.isPassword(password, (err, valid) => {
		if (!valid)
			return common.sendResponse(res, "Username/password mismatch");
		
		// Create a new login session, and store it.
		let session = new userUtils.Session(user.id);
		
		return common.sendResponse(res, null, {id: user.id, session: session.id, token: session.token});
	});
}

/**
 * The users endpoint's update action callback.
 * This function manages user creation using data provided through a POST request.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
const update = async (req, res, next) => {
	// Check if the request is associated with an authorized user.
	const auth = await common.authenticate(req);
	if (auth.status != "success")
		return res.send(auth);
	
	// Get the optional arguments, if they're provided.
	// This will always be successful, so a status check isn't necessary.
	const args = common.verifyArguments(req, null, [ "oldPassword", "newPassword", "avatar" ]);
	
	// Disallow other users from updating this user.
	if (auth.session.user !== req.params.id)
		return common.sendResponse(res, {id: "Forbidden"});
	
	// Setup an object to store the response.
	const result = { };
	
	// Store the variables associated with this update, and the user being updated.
	const user = await userUtils.getUser(auth.session.user);
	const oldPass = args.data.oldPassword;
	const newPass = args.data.newPassword;
	const newAvatar = args.data.avatar;
	
	// Check if the password is being updated.
	if (oldPass && newPass) {
		// Update the password if the previous password matches.
		const update = await user.updatePassword(oldPass, newPass);
		
		if (update.error)
			return common.sendResponse(res, update.error);
			
		result.passwordChanged = true;
	}
	else
		result.passwordChanged = false;
	
	// Check if the avatar is being updated, and respond with the new avatar if it is.
	if (newAvatar) {
		result.avatar = newAvatar;
		
		user.setAvatar(newAvatar);
	}
	
	// Respond with whether or not the password was changed, and the new avatar if the avatar was updated.
	return common.sendResponse(res, null, result);
}

/**
 * The users endpoint's action registration function
 * @param {string} root - The route endpoint.
 * @param {express} app - The express instance to register with.
 */
module.exports.register = (root, app) => {
    let _root = root;
    if (_root.slice(-1) != '/')
        _root += '/';
	
	// Register all action callbacks, allowing for GET requests on read-only actions.
    app.get(_root + 'create', create);
    app.post(_root + 'create', create);
    app.post(_root + 'find/:username', get);
    app.post(_root + ':id/get', get);
    app.get(_root + 'login', login);
    app.post(_root + 'login', login);
    app.post(_root + ':id/update', update);
}
