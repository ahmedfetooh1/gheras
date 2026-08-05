module.exports = (req, res, next) => {
    if (req.body) {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                const val = req.body[key].trim();
                // Check if the value looks like a JSON object or array
                if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
                    try {
                        req.body[key] = JSON.parse(val);
                    } catch (e) {
                        // Keep the original string if parsing fails
                    }
                }
            }
        }
    }
    next();
};
