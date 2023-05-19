'use strict'

/** Routes for jobs. */

const jsonschema = require('jsonschema')
const express = require('express')

const { BadRequestError } = require('../expressError')
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth')
const Job = require('../models/job')

const newJobAuth = require('../schemas/newJobAuth.json')
const updateJobSchema = require('../schemas/updateJobSchema.json')
const queryAuth = require('../schemas/queryAuth.json')
const { findAll } = require('../models/job')

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
 *   { jobs: [ { id, title, salary, equity, companyHandle}, ...] }
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
 *  Job is  { id, title, salary, equity, company}
 *   where company is [{ handle, name, description, numEmployees, logoUrl}, ...]
 *
 * Authorization required: none
 */

router.get('/:id', async function (req, res, next) {
  const job = await Job.get(req.params.id)
  return res.json({ job })
})

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, companyHandle}0
 *
 * Authorization required: login + is_admin
 */
//FIXME:
router.patch('/:id', ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, updateJobSchema, {
    required: true
  })
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack)
    throw new BadRequestError(errs)
  }

  const company = await Job.update(req.params.id, req.body)
  return res.json({ company })
})

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: Admin
 */

router.delete('/:id', ensureAdmin, async function (req, res, next) {
  await Job.remove(req.params.id)
  return res.json({ deleted: req.params.id })
})

module.exports = router
