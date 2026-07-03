/**
 * Standard pagination utility to execute paginated Mongoose queries and construct the uniform meta response block.
 *
 * @param {Object} model - The Mongoose Model to query.
 * @param {Object} [filter={}] - MongoDB filter options.
 * @param {Object} [queryOptions={}] - Request query options (page, limit, sort, populate, select).
 * @returns {Promise<{data: Array, meta: {page: Number, limit: Number, total: Number, totalPages: Number}}>}
 */
const paginate = async (model, filter = {}, queryOptions = {}) => {
  const page = Math.max(1, parseInt(queryOptions.page, 10) || 1);
  let limit = parseInt(queryOptions.limit, 10);
  if (isNaN(limit)) {
    limit = 10;
  } else {
    limit = Math.min(100, Math.max(1, limit)); // Cap page limit at 100, min 1
  }

  const skip = (page - 1) * limit;

  // Build the DB query
  let dbQuery = model.find(filter).skip(skip).limit(limit);

  // Apply sorting
  if (queryOptions.sort) {
    dbQuery = dbQuery.sort(queryOptions.sort);
  } else {
    dbQuery = dbQuery.sort({ createdAt: -1 }); // default sort
  }

  // Apply select projection
  if (queryOptions.select) {
    dbQuery = dbQuery.select(queryOptions.select);
  }

  // Apply populate references
  if (queryOptions.populate) {
    if (Array.isArray(queryOptions.populate)) {
      queryOptions.populate.forEach((p) => {
        dbQuery = dbQuery.populate(p);
      });
    } else {
      dbQuery = dbQuery.populate(queryOptions.populate);
    }
  }

  // Execute count and query concurrently
  const [data, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

module.exports = paginate;
