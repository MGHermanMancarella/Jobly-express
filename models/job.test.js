"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "testJob",
    salary: 200000,
    equity: 0.02,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    expect(job).toEqual({
      id: expect.any(Number),
      title: "testJob",
      salary: 200000,
      equity: "0.02",
      companyHandle: "c1"
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'testJob'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "testJob",
        salary: 200000,
        equity: "0.02",
        companyHandle: "c1"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
           //console.log(jobs)
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "J1",
        salary: 100000,
        equity: "0.01",
        companyHandle: "c1"
      },
      {
        id: expect.any(Number),
        title: "J2",
        salary: 200000,
        equity: "0.02",
        companyHandle: "c2"
      },
      {
        id: expect.any(Number),
        title: "J3",
        salary: 300000,
        equity: "0.03",
        companyHandle: "c3"
      }
    ]);
  });
  //TODO:  works with one filter, empty with filter and no results
//   test("works: with one filters", async function () {
//     const filter = {
//       "minEmployees": 2,
//       "maxEmployees": 2,
//       "nameLike": "c"
//     };

//     const jobs = await Job.findAll(filter);
//     expect(jobs).toEqual([
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       }
//     ]);
//   });

//   test("works: returns empty array with no results", async function () {
//     const filter = {
//       "minEmployees": 2,
//       "maxEmployees": 10,
//       "nameLike": "cat"
//     };

//     const jobs = await Job.findAll(filter);
//     expect(jobs).toEqual([]);
//   });

//   test("works: with one filter", async function () {
//     const filter = {
//       "minEmployees": 2,
//     };

//     const jobs = await Job.findAll(filter);
//     expect(jobs).toEqual([
//       {
//         handle: "c2",
//         name: "C2",
//         description: "Desc2",
//         numEmployees: 2,
//         logoUrl: "http://c2.img",
//       },
//       {
//         handle: "c3",
//         name: "C3",
//         description: "Desc3",
//         numEmployees: 3,
//         logoUrl: "http://c3.img",
//       }
//     ]);
//   });

//   test("fails: with filter minEmployees>maxEmployees", async function () {
//     const filter = {
//       "minEmployees": 3,
//       "maxEmployees": 1,
//       "nameLike": "c"
//     };
//     try {
//       const res = await Job.findAll(filter);
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
 });

/************************************** get */

describe("get", function () {

  test("works", async function () {
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'J1'`);
    const j1 = result.rows[0]

    let job = await Job.get(j1.id);
    expect(job).toEqual({
      id: j1.id,
      title: "J1",
      salary: 100000,
      equity: "0.01",
      companyHandle: "c1"
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewTitle",
    salary: 99999,
    equity: 0.07,
  };

  test("works", async function () {
    const resultBefore = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'J1'`);
    const j1 = resultBefore.rows[0]

    let job = await Job.update(j1.id, updateData);
    expect(job).toEqual({
      id: j1.id,
      title: "NewTitle",
      salary: 99999,
      equity: "0.07",
      companyHandle: 'c1'
    });

    const resultAfter = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${j1.id}`);
    expect(resultAfter.rows).toEqual([{
      id: j1.id,
      title: "NewTitle",
      salary: 99999,
      equity: "0.07",
      companyHandle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const resultBefore = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'J1'`);
    const j1 = resultBefore.rows[0]

    const updateDataSetNulls = {
      title: "NewTitle",
      salary: null,
      equity: null,
    };

    let job = await Job.update(j1.id, updateDataSetNulls);
    expect(job).toEqual({
      id: j1.id,
      ...updateDataSetNulls,
      companyHandle: 'c1'
    });

    const resultAfter = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id=${j1.id}`);

    expect(resultAfter.rows).toEqual([{
      id: j1.id,
      ...updateDataSetNulls,
      companyHandle: 'c1'
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(0, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const resultBefore = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'J1'`);
    const j1 = resultBefore.rows[0]

    await Job.remove(j1.id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id = ${j1.id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
