/**
 * Pagination Utility
 * Helper for handling pagination
 */

const { server } = require('../config');

class PaginationUtil {
    /**
     * Get pagination parameters from request
     */
    static getParams(req) {
        const page = parseInt(req.query.page) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize) || server.defaultPageSize,
            server.maxPageSize
        );
        const offset = (page - 1) * pageSize;

        return {
            page,
            pageSize,
            offset,
            limit: pageSize
        };
    }

    /**
     * Build pagination metadata
     */
    static buildMeta(page, pageSize, totalItems) {
        return {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: parseInt(totalItems),
            totalPages: Math.ceil(totalItems / pageSize),
            hasNext: page * pageSize < totalItems,
            hasPrev: page > 1
        };
    }

    /**
     * Get SQL limit/offset clause
     */
    static getSqlClause(params) {
        return `LIMIT ${params.limit} OFFSET ${params.offset}`;
    }
}

module.exports = PaginationUtil;
