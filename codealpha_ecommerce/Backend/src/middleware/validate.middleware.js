/**
 * Generic validation middleware factory using Zod schemas
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map(issue => {
          const field = issue.path.slice(1).join('.');
          return `${field ? field + ': ' : ''}${issue.message}`;
        });

        return res.status(400).json({
          error: errorMessages.join('; ') || 'Invalid request payload'
        });
      }

      // Assign parsed/sanitized values
      if (parsed.data.body) req.body = parsed.data.body;
      if (parsed.data.query) req.query = parsed.data.query;
      if (parsed.data.params) req.params = parsed.data.params;

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  validate
};
