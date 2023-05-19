'use strict'

const request = require('supertest')

const db = require('../db.js')
const app = require('../app')
const Job = require('../models/job')

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

/************************************** POST /users (AS ADMIN) */

describe('POST /users', function () {
  test('works for Admin: create non-admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: false
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({
      user: {
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        email: 'new@email.com',
        isAdmin: false
      },
      token: expect.any(String)
    })
  })

  test('works for Admin: create admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: true
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(201)
    expect(resp.body).toEqual({
      user: {
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        email: 'new@email.com',
        isAdmin: true
      },
      token: expect.any(String)
    })
  })

  test('bad request if missing data (Admin)', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('bad request if invalid data (Admin)', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'not-an-email',
        isAdmin: true
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })
})

/***************************** UnAuthorized:  POST /users (AS_USER or ANON)*/

describe('POST /users', function () {
  test('unauth for users: create non-admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: false
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for users: create admin', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'new@email.com',
        isAdmin: true
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).post('/users').send({
      username: 'u-new',
      firstName: 'First-new',
      lastName: 'Last-newL',
      password: 'password-new',
      email: 'new@email.com',
      isAdmin: true
    })
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth bad request if missing data', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth bad request if invalid data', async function () {
    const resp = await request(app)
      .post('/users')
      .send({
        username: 'u-new',
        firstName: 'First-new',
        lastName: 'Last-newL',
        password: 'password-new',
        email: 'not-an-email',
        isAdmin: true
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })
})

/***********************  AUTHORIZED:  GET /users (AS_ADMIN)*/

describe('GET /users', function () {
  test('works for users', async function () {
    const resp = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      users: [
        {
          username: 'u1',
          firstName: 'U1F',
          lastName: 'U1L',
          email: 'user1@user.com',
          isAdmin: false
        },
        {
          username: 'u2',
          firstName: 'U2F',
          lastName: 'U2L',
          email: 'user2@user.com',
          isAdmin: false
        },
        {
          username: 'u3',
          firstName: 'U3F',
          lastName: 'U3L',
          email: 'user3@user.com',
          isAdmin: false
        }
      ]
    })
  })

  /***********************  UN_AUTHORIZED:  GET /users (AS_USER or ANON)*/

  test('unauth for users', async function () {
    const resp = await request(app)
      .get('/users')
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).get('/users')
    expect(resp.statusCode).toEqual(401)
  })
})

/************************************** GET /users/:username */

describe('GET /users/:username', function () {
  test('works for users', async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      }
    })
  })

  test('not found if user not found', async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  /*********  UN_AUTHORIZED:  GET /users/:username (AS_USER or ANON)  */

  test('Unauth for users', async function () {
    const resp = await request(app)
      .get(`/users/u2`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('Unauth / not found if user not found', async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).get(`/users/u1`)
    expect(resp.statusCode).toEqual(401)
  })
})
/************** AUTHORIZED - PATCH /users/:username (AS_ADMIN) */

describe('PATCH /users/:username', () => {
  test('works for admin', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 'New'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'New',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      }
    })
  })
  test('works for logged in user', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 'New'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'New',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      }
    })
  })

  test('not found if no such user', async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: 'Nope'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  test('bad request if invalid data', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(400)
  })

  test('works: set new password as Admin', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: 'new-password'
      })
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      }
    })
    const isSuccessful = await User.authenticate('u1', 'new-password')
    expect(isSuccessful).toBeTruthy()
  })

  test('works: set new password as logged in user', async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: 'new-password'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({
      user: {
        username: 'u1',
        firstName: 'U1F',
        lastName: 'U1L',
        email: 'user1@user.com',
        isAdmin: false
      }
    })
    const isSuccessful = await User.authenticate('u1', 'new-password')
    expect(isSuccessful).toBeTruthy()
  })
  /*************  UN_AUTHORIZED - PATCH /users/:username (USER or ANON)   */

  test('unauth for Users', async function () {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: 'New'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).patch(`/users/u1`).send({
      firstName: 'New'
    })
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth not found if no such user', async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: 'Nope'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth request if invalid data', async function () {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: 42
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth: set new password for another user', async function () {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        password: 'new-password'
      })
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })
  test('unauth: set new password as anon', async function () {
    const resp = await request(app).patch(`/users/u1`).send({
      password: 'new-password'
    })
    expect(resp.statusCode).toEqual(401)
  })
})
/********************* AUTHORIZED - DELETE /users/:username  (AS_ADMIN)  */

describe('DELETE /users/:username', function () {
  test('works for users', async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.body).toEqual({ deleted: 'u1' })
  })

  test('works for admin', async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.body).toEqual({ deleted: 'u1' })
  })

  test('not found if user missing', async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set('authorization', `Bearer ${adminToken}`)
    expect(resp.statusCode).toEqual(404)
  })

  /********************* UN_AUTHORIZED - DELETE /users/:username  (AS_USER or ANON)  */
  test('unauth for different users', async function () {
    const resp = await request(app)
      .delete(`/users/u2`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for anon', async function () {
    const resp = await request(app).delete(`/users/u1`)
    expect(resp.statusCode).toEqual(401)
  })

  test('unauth for user - if username does not exist', async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set('authorization', `Bearer ${u1Token}`)
    expect(resp.statusCode).toEqual(401)
  })
})
