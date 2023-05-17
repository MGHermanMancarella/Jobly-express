'use strict';

/** Routes for companies. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn } = require('../middleware/auth');
const Company = require('../models/company');

const companyNewSchema = require('../schemas/companyNew.json');
const companyUpdateSchema = require('../schemas/companyUpdate.json');
const queryAuth = require('../schemas/queryAuth.json');
const { filterCompanies } = require('../models/company');

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * creates a new company
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post('/', ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyNewSchema, {
    required: true
  });
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.create(req.body);
  return res.status(201).json({ company });
});

/** GET /  => //FIXME:
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter only on these search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get('/', async function (req, res, next) {
  if (Object.keys(req.query).length === 0) {
    const companies = await Company.findAll();
    return res.json({ companies });
  }

  // Handle the query string/ convert to integer where appropriate
  let queryCopy = { ...req.query };

    for (let key in queryCopy){
        if(key === "minEmployees" || key === "maxEmployees"){
          //console.log(typeof queryCopy[key], queryCopy[key])
          queryCopy[key] = parseInt(queryCopy[key])
          //console.log(typeof queryCopy[key], queryCopy[key])
        }else{
          queryCopy[key] = `'%${queryCopy[key]}%'`
        }
    }
    //console.log(queryCopy)
  // validate query elements with jsonschema
  const validator = jsonschema.validate(queryCopy, queryAuth, {
    required: true
  });
  if (queryCopy?.minEmployees > queryCopy?.maxEmployees) {
    throw new BadRequestError('minEmployees cannot be larger than maxEmployees');
  }

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }
  const companies = await Company.filterCompanies(queryCopy);
  return res.json(companies);
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get('/:handle', async function (req, res, next) {
  const company = await Company.get(req.params.handle);
  return res.json({ company });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch('/:handle', ensureLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(req.body, companyUpdateSchema, {
    required: true
  });
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete('/:handle', ensureLoggedIn, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});

module.exports = router;
