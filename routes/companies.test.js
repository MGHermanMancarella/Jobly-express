'use strict'

const request = require('supertest')

const db = require('../db')
const app = require('../app')

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require('./_testCommon')

beforeAll(commonBeforeAll)
beforeEach(commonBeforeEach)
afterEach(commonAfterEach)
afterAll(commonAfterAll)

/************************************* POST /companies */

describe('POST /companies', function () {
  const newCompany = {
    handle: 'new',
    name: 'New',
    logoUrl: 'http://new.img',
    description: 'DescNew',
    numEmployees: 10
  }

  test('ok for Admin', async function () {
    const resp = await request(app)
      .post('/companies')
      .send(newCompany)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({
      company: newCompany
    })
  })

  test('bad request with missing data', async function () {
    const resp = await request(app)
      .post('/companies')
      .send({
        handle: 'new',
        numEmployees: 10
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request with invalid data', async function () {
    const resp = await request(app)
      .post('/companies')
      .send({
        ...newCompany,
        logoUrl: 'not-a-url'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  /********************* UN_AUTHORIZED - DELETE /users/:username  (AS_USER or ANON)  */

  test('unauthorized for users', async function () {
    const resp = await request(app)
      .post('/companies')
      .send(newCompany)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauthorized for anon', async function () {
    const resp = await request(app).post('/companies').send(newCompany)
    expect(resp.statusCode).toEqual(401)
  })
})

/************************************** GET /companies */

describe('GET /companies', function () {
  test('ok for anon', async function () {
    const resp = await request(app).get('/companies')
    expect(resp.body).toEqual({
      companies: [
        {
          handle: 'c1',
          name: 'C1',
          description: 'Desc1',
          numEmployees: 1,
          logoUrl: 'http://c1.img'
        },
        {
          handle: 'c2',
          name: 'C2',
          description: 'Desc2',
          numEmployees: 2,
          logoUrl: 'http://c2.img'
        },
        {
          handle: 'c3',
          name: 'C3',
          description: 'Desc3',
          numEmployees: 3,
          logoUrl: 'http://c3.img'
        }
      ]
    })
  })
  test('ok for all filters', async function () {
    const query = 'minEmployees=2&maxEmployees=2&nameLike=c'
    const resp = await request(app).get(`/companies?${query}`)
    expect(resp.body).toEqual({
      companies: [
        {
          handle: 'c2',
          name: 'C2',
          description: 'Desc2',
          numEmployees: 2,
          logoUrl: 'http://c2.img'
        }
      ]
    })
  })
  test('ok for one filters', async function () {
    const query = 'minEmployees=2'
    const resp = await request(app).get(`/companies?${query}`)
    expect(resp.body).toEqual({
      companies: [
        {
          handle: 'c2',
          name: 'C2',
          description: 'Desc2',
          numEmployees: 2,
          logoUrl: 'http://c2.img'
        },
        {
          handle: 'c3',
          name: 'C3',
          description: 'Desc3',
          numEmployees: 3,
          logoUrl: 'http://c3.img'
        }
      ]
    })
  })

  test('ok for User', async function () {
    const resp = await request(app)
      .get('/companies')
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      companies: [
        {
          handle: 'c1',
          name: 'C1',
          description: 'Desc1',
          numEmployees: 1,
          logoUrl: 'http://c1.img'
        },
        {
          handle: 'c2',
          name: 'C2',
          description: 'Desc2',
          numEmployees: 2,
          logoUrl: 'http://c2.img'
        },
        {
          handle: 'c3',
          name: 'C3',
          description: 'Desc3',
          numEmployees: 3,
          logoUrl: 'http://c3.img'
        }
      ]
    })
  })

  test('fails for extra queries', async function () {
    const query = 'minEmployees=2&maxEmployees=2&nameLike=c&handle=p'
    const resp = await request(app).get(`/companies?${query}`)
    expect(resp.statusCode).toEqual(400)
  })
  test('fails for illegitimate query', async function () {
    const query = 'tacos=soft-shell'
    const resp = await request(app).get(`/companies?${query}`)
    expect(resp.statusCode).toEqual(400)
  })
  test('fails for bad queries', async function () {
    const query = 'minEmployees=lots&maxEmployees=tons'
    const resp = await request(app).get(`/companies?${query}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/************************************** GET /companies/:handle */

describe('GET /companies/:handle', function () {
  test('works for anon', async function () {
    const resp = await request(app).get(`/companies/c1`)
    expect(resp.body).toEqual({
      company: {
        handle: 'c1',
        name: 'C1',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img'
      }
    })
  })

  test('works for anon: company w/o jobs', async function () {
    const resp = await request(app).get(`/companies/c2`)
    expect(resp.body).toEqual({
      company: {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img'
      }
    })
  })

  test('works for user: company w/o jobs', async function () {
    const resp = await request(app)
      .get(`/companies/c2`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      company: {
        handle: 'c2',
        name: 'C2',
        description: 'Desc2',
        numEmployees: 2,
        logoUrl: 'http://c2.img'
      }
    })
  })

  test('not found for no such company', async function () {
    const resp = await request(app).get(`/companies/nope`)
    expect(resp.statusCode).toEqual(404)
  })
})

/************************************** PATCH /companies/:handle */

describe('PATCH /companies/:handle', function () {
  test('works for Admin', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: 'C1-new'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      company: {
        handle: 'c1',
        name: 'C1-new',
        description: 'Desc1',
        numEmployees: 1,
        logoUrl: 'http://c1.img'
      }
    })
  })

  test('not found on no such company as Admin', async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: 'new nope'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('bad request on handle change attempt as Admin', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: 'c1-new'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request on invalid data as Admin', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: 'not-a-url'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  //////////// Unauthorized non-admin tests
  test('unauth for anon', async function () {
    const resp = await request(app).patch(`/companies/c1`).send({
      name: 'C1-new'
    })
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for User', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .set('authorization', `Bearer ${u1Token}`)
      .send({
        name: 'C1-new'
      })
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth on no such company as User', async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: 'new nope'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('bad request on handle change attempt as User', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: 'c1-new'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('bad request on invalid data as User', async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: 'not-a-url'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })
})

/************************************** DELETE /companies/:handle */

describe('DELETE /companies/:handle', function () {
  test('works for Admin', async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({ deleted: 'c1' })
  })

  test('not found for no such company', async function () {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('unauth for non-admin User', async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).delete(`/companies/c1`)
    expect(resp.statusCode).toEqual(401)
  })
})
