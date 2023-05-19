'use strict'

/** Routes for jobs. */

const jsonschema = require('jsonschema')
const express = require('express')

const { BadRequestError } = require('../expressError')
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth')
const Company = require('../models/job')

const newJobAuth = require('../schemas/newJobAuth.json')
const updateJob = require('../schemas/updateJob.json')
const queryAuth = require('../schemas/queryAuth.json')
const { findAll } = require('../models/jobs')

const router = new express.Router()

/** POST / { job } =>  { job }
 *
 * creates a new job associated with company handle
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: is_admin
 */

router.post('/', ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, newJobAuth, {
    required: true
  })
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack)
    throw new BadRequestError(errs)
  }

  const job = await Job.create(req.body)
  return res.status(201).json({ job })
})

/** GET /  =>
 *   { jobs: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter only on these search filters in the query string:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
  const jobs = await Job.findAll()
  return res.json({ jobs })

  /* **************** COMPANY FILTER FUNCTION ***********
 let queryCopy = req.query

  // Convert to integer where appropriate from Query-String
  if ('minEmployees' in queryCopy) {
    queryCopy['minEmployees'] = Number(queryCopy['minEmployees'])
  }
  if ('maxEmployees' in queryCopy) {
    queryCopy['maxEmployees'] = Number(queryCopy['maxEmployees'])
  }

  // Validate query elements with jsonschema
  const validator = jsonschema.validate(queryCopy, queryAuth, {
    required: true
  })

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack)
    throw new BadRequestError(errs)
  }

  const jobs = await Company.findAll(queryCopy)
  return res.json({ jobs })
   */
})

/** GET /[id]  =>  { job }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get('/:handle', async function (req, res, next) {
  const company = await Company.get(req.params.handle)
  return res.json({ company })
})

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login + is_admin
 */

router.patch('/:handle', ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyUpdateSchema, {
    required: true
  })
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack)
    throw new BadRequestError(errs)
  }

  const company = await Company.update(req.params.handle, req.body)
  return res.json({ company })
})

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: Admin
 */

router.delete('/:handle', ensureAdmin, async function (req, res, next) {
  await Company.remove(req.params.handle)
  return res.json({ deleted: req.params.handle })
})

module.exports = router
