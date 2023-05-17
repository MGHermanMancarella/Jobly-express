'use strict';

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

/**
 *
 */

describe("Test sqlForPartialUpdate", function () {
  test("works: with good input", function () {
    const dataToUpdate = {
      name: "test",
      description: "testing company",
      numEmployees: 100
    };
    const jsToSql = {
      numEmployees: "num_employees"
    }
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql)
    expect(result).toEqual({
      setCols: '"name"=$1, "description"=$2, "num_employees"=$3',
      values: ["test", "testing company", 100]
    });
  });
  test("throws error: with bad input", function () {
    const dataToUpdate = {};
    const jsToSql = {
      numEmployees: "num_employees"
    }
    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql)
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

  });
});