'use strict'

const { BadRequestError } = require('../expressError')

/**  Accepts an object of new data to update DB
 *  Also accepts a list of keys that need to be converted to snake_case
 *
 *  Returns string of DB column names ready to be passed in a SQL query
 * as well as their corresponding updated values.
 *
 * Input ex:
 *    dataToUpdate: {
 *         name:"newName",
 *         description:"newDesc",
 *         numEmployees:newNumber,
 *         logoUrl:"newURL"
 *    }
 *    jsToSql: {numEmployees: "num_employees", logoUrl: "logo_url"})
 *
 * Returns:
 *    setCol = '"name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4'
 *    values = ["newName", "newDesc", newNumber, "newURL"]
 */

function sqlForPartialUpdate (dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate)
  if (keys.length === 0) throw new BadRequestError('No data')

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  )

  return {
    setCols: cols.join(', '),
    values: Object.values(dataToUpdate)
  }
}

/**  Accepts an object of keys to filter by.
 *      nameLike (will find case-insensitive, partial matches)
 *      minEmployees
 *      maxEmployees
 *
 *  Also accepts a list of keys with values of equivalent SQL phrases
 *
 *  Returns an object containing a SQL WHERE clause and values to be inserted
 *  into this clause via a parameterized array
 *
 *  Input ex:
 *     ({"minEmployees":10, "maxEmployees":100, "nameLike":"net"},
 *     {minEmployees: 'employees <', maxEmployees: 'employees >',
 *     nameLike: 'name ILIKE'}
 *
 *  Returns:
 *   {
 *  whereClause: 'WHERE num_employees > $1 AND num_employees < $2 AND name ILIKE $3'
 *  filterValues: [10, 100, "'%net%'"]
 *   }
 */

function sqlWhereClause (filterBy, jsToSql) {
  const keys = Object.keys(filterBy)
  if (keys.length === 0) {
    return { whereClause: '', filterValues: [] }
  }

  // Add %% to name search query
  if ('nameLike' in filterBy) {
    filterBy['nameLike'] = '%' + filterBy['nameLike'] + '%'
  }

  // sqlClauses is an array of strings that can proceed WHERE in an SQL query
  const sqlClauses = keys.map((colName, idx) => `${jsToSql[colName]} $${idx + 1}`)

  return {
    whereClause: 'WHERE ' + sqlClauses.join(' AND '),
    filterValues: Object.values(filterBy)
  }
}

module.exports = { sqlWhereClause, sqlForPartialUpdate }
