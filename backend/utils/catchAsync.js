// utils/catchAsync.js  fatouh
module.exports = fn => {
    return (req, res, next) => {
        // Make sure controller code can safely call `next(err)` even if Express
        // provided `next` as undefined/non-function (seen with this codebase).
        const safeNext =
            typeof next === 'function'
                ? next
                : (err) => {
                      throw err;
                  };

        Promise.resolve(fn(req, res, safeNext)).catch((err) => {
            if (typeof next === 'function') return next(err);
            const statusCode = err && (err.statusCode || err.status) ? (err.statusCode || 500) : 500;
            return res.status(statusCode).json({
                status: 'error',
                message: err?.message || 'Internal Server Error'
            });
        });
    };
};