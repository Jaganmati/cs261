/**
 * @file The JSON response middleware for express.
 * @author Johnathan Faehn
 */

/**
 * The response middleware for ensuring express handles its data as a JSON response.
 * @param {Request} req - The HTTP request instance.
 * @param {Response} res - The HTTP response instance.
 * @param {function} next - The next callback to be called.
 */
module.exports.responseMiddleware = (req, res, next) => {
	// Tell express to treat the result as JSON.
	res.setHeader('Content-Type', 'application/json');
	return next();
}
