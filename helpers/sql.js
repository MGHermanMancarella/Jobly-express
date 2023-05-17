'use strict'

const { BadRequestError } = require('../expressError')

/**  Accepts an object of new data to update DB
 *  Also accepts a list of keys that need to be converted to snake_case
 *
 *  Returns string of DB column names ready to be passed in a SQL query
 * as well as their corresponding updated values.
 *
 * ex:
 *    ({name, description, numEmployees, logoUrl}, {numEmployees, logoUrl})
 *
 * Returns:
 *    setCol = ""name"=$1, "description"=$2, "num_employees"=$3, "logo_url"=$4"
 *    values = {newValue, newValue2, anotherNewValue, alsoNew}
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
 *  Also accepts a list of keys converted to snake_case
 *
 *  Returns string of DB column names ready to be passed in a SQL query
 *
 * ex:
 *    ({"minEmployees":10, "maxEmployees":100, "nameLike":"net"},
 *    {minEmployees: 'employees <', maxEmployees: 'employees >',
      nameLike: 'name ILIKE'}
 *
 * Returns:
 *    setCol = ""name_like"=$1, "min_employees"=$2, "max_employees"=$3"
 */

function sqlForFilter (filterBy, jsToSql) {
  const keys = Object.keys(filterBy)
  if (keys.length === 0) throw new BadRequestError('No data')

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']

  const cols = keys.map(
    (colName) => `(${jsToSql[colName]} ${filterBy[colName]})`
  )
    console.log("cols", cols.join(` AND `))
  // const values = Object.values(filterBy)

  // return {
  //   setCols: cols.join(' AND '),
  //   values: Object.values(filterBy)
  // }

  return cols.join(` AND `)
}

module.exports = {sqlForFilter, sqlForPartialUpdate }
