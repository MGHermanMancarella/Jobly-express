'use strict'

const db = require('../db')
const { BadRequestError, NotFoundError } = require('../expressError')
const { sqlForPartialUpdate, sqlWhereClause } = require('../helpers/sql')

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create ({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `
        SELECT handle
        FROM companies
        WHERE handle = $1`,
      [handle]
    )

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`)

    const result = await db.query(
      `
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    )
    const company = result.rows[0]

    return company
  }

  /** Find all companies by default. Accepts search terms in the query string.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Acceptable search terms:
   *   nameLike: string
   *   minEmployees: integer
   *   maxEmployees: integer
   *
   * Throws NotFoundError if not found.
   * Throws BadRequestError if min > max
   **/

  static async findAll (filter = {}) {
    if (filter.minEmployees > filter.maxEmployees) {
      throw new BadRequestError(
        'minEmployees cannot be larger than maxEmployees'
      )
    }

    const { whereClause, filterValues } = sqlWhereClause(filter, {
      minEmployees: 'num_employees >=',
      maxEmployees: 'num_employees <=',
      nameLike: 'name ILIKE'
    })

    const companiesRes = await db.query(
      `
        SELECT handle,
        name,
        description,
        num_employees AS "numEmployees",
        logo_url      AS "logoUrl"
        FROM companies
        ${whereClause}
        ORDER BY name`,
      [...filterValues]
    )

    return companiesRes.rows
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get (handle) {
    const companyRes = await db.query(
      `
        SELECT c.handle,
               c.name,
               c.description,
               c.num_employees AS "numEmployees",
               c.logo_url      AS "logoUrl",
               j.id,
               j.title,
               j.salary,
               j.equity,
               j.company_handle as "companyHandle"
        FROM jobs as j
        JOIN companies as c
        ON (j.company_handle = c.handle)
        WHERE handle = $1`,
      [handle]
    )

    const company = companyRes.rows

    if (!company) throw new NotFoundError(`No company: ${handle}`)

    const jobs = company.map(
      ({ id, title, salary, equity, companyHandle }) => ({
        id,
        title,
        salary,
        equity: parseFloat(equity),
        companyHandle
      })
    )

    return {
      handle: company[0].handle,
      name: company[0].name,
      description: company[0].description,
      numEmployees: company[0].numEmployees,
      logoUrl: company[0].logoUrl,
      jobs: jobs
    }
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update (handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: 'num_employees',
      logoUrl: 'logo_url'
    })
    const handleVarIdx = '$' + (values.length + 1)

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`
    const result = await db.query(querySql, [...values, handle])
    const company = result.rows[0]

    if (!company) throw new NotFoundError(`No company: ${handle}`)

    return company
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove (handle) {
    const result = await db.query(
      `
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`,
      [handle]
    )
    const company = result.rows[0]

    if (!company) throw new NotFoundError(`No company: ${handle}`)
  }
}

module.exports = Company
