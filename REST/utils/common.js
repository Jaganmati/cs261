/**
 * @file The common helper functions used in all endpoints.
 * @author Johnathan Faehn
 */

const userUtils = require('./user');

/**
 * A response helper function for ensuring success and failure format consistency.
 * @param {Response} res - The HTTP response instance.
 * @param {string|Object} err - The errors to be reported.
 * @param {string|Object} payload - The requested data upon success.
 */
module.exports.sendResponse = (res, err, payload) => {
	if (err)
		return res.send({ status: "fail", reason: err });
	else
		return res.send({ status: "success", data: payload });
}

/**
 * A argument verification helper function for input availability validation.
 * @param {Request} req - The HTTP request instance.
 * @param {string[]} required - The list of required arguments.
 * @param {string[]} optional - The list of optional arguments
 * @return {Object} An object that contains the verification status, and the status related data.
 */
module.exports.verifyArguments = (req, required, optional) => {
	let errors = { };
	let fields = { };
	let succeeded = true;
	
	if (required) {
		if (!Array.isArray(required)) {
			let params = [ ];
			for (var param in required)
				params.push(param);
			
			required = params;
		}
		
		for (let i = 0; i < required.length; i++) {
			// Get the argument from either the body, URL, or express parameters.
			let key = required[i];
			if (req.body[key] !== undefined)
				fields[key] = req.body[key];
			else if (req.query[key] !== undefined)
				fields[key] = req.query[key];
			else if (req.params[key] !== undefined)
				fields[key] = req.params[key];
			else {
				errors[key] = "Required";
				succeeded = false;
			}
		}
	}
	
	if (optional) {
		if (!Array.isArray(optional)) {
			let params = [ ];
			for (var param in optional)
				params.push(param);
			
			optional = params;
		}
		
		for (let i = 0; i < optional.length; i++) {
			// Get the argument from either the body, URL, or express parameters.
			let key = optional[i];
			if (req.body[key] !== undefined)
				fields[key] = req.body[key];
			else if (req.query[key] !== undefined)
				fields[key] = req.query[key];
			else if (req.params[key] !== undefined)
				fields[key] = req.params[key];
		}
	}
	
	if (succeeded)
		return { status: "success", data: fields };
	else
		return { status: "fail", reason: errors };
}

/**
 * A login session authentication helper function that validates the state of the active login session.
 * @param {Request} req - The HTTP request instance.
 * @return {Object} An object that contains the verification status, and the status related data.
 */
module.exports.authenticate = async (req) => {
	// Verify all required arguments were provided.
	const args = module.exports.verifyArguments(req, [ "_session", "_token" ]);
	if (args.status != "success")
		return args;
	
	let errors = { };
	let succeeded = true;
	
	// Get the session with the provided session id.
	const session = await userUtils.getSession(args.data._session);
	
	// Validate the session with the provided authentication token.
	if (!session || session.token !== args.data._token) {
		// Mark the token as invalid, and the action as unsucessful.
		errors._token = "Invalid";
		succeeded = false;
	}
	
	if (succeeded) {
		// Provide the Session instance, the session id, and the authentication token.
		args.session = session;
		return args;
	}
	else
		return { status: "fail", reason: errors };
}

module.exports.protocolMiddleware = (req, res, next) => {
	if (req.headers['x-forwarded-proto'] !== 'https')
		return module.exports.sendResponse(res, "Encryption required");
	
	return next();
}
