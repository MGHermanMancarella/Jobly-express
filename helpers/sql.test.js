'use strict';

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate, sqlWhereClause } = require("./sql");

describe("Test sqlForPartialUpdate", function () {
  test("works: with good input", function () {
    const dataToUpdate = {
      name: "test",
      description: "testing company",
      numEmployees: 100
    };
    const jsToSql = {
      numEmployees: "num_employees"
    };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result).toEqual({
      setCols: '"name"=$1, "description"=$2, "num_employees"=$3',
      values: ["test", "testing company", 100]
    });
  });
  test("throws error: with no key/values in data", function () {
    const dataToUpdate = {};
    const jsToSql = {
      numEmployees: "num_employees"
    };
    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }

  });
});

describe("Test sqlWhereClause", function () {
  const jsToSql = {
    minEmployees: 'num_employees >=',
    maxEmployees: 'num_employees <=',
    nameLike: 'name ILIKE'
  };

  test("works: with all filters", function () {
    const filterBy = {
      "minEmployees": 10,
      "maxEmployees": 100,
      "nameLike": "net"
    };

    const result = sqlWhereClause(filterBy, jsToSql);
    expect(result).toEqual({
      whereClause: 'WHERE num_employees >= $1 AND num_employees <= $2 AND name ILIKE $3',
      filterValues: [10, 100, "%net%"]
    });
  });
  test("works: with one filter", function () {
    const filterBy = {"minEmployees": 10};

    const result = sqlWhereClause(filterBy, jsToSql);
    expect(result).toEqual({
      whereClause: 'WHERE num_employees >= $1',
      filterValues: [10]
    });
  });
  test("works: with empty filterBy", function () {
    const filterBy = {};

    const result = sqlWhereClause(filterBy, jsToSql);
    expect(result).toEqual({
      whereClause: '',
      filterValues: []
    });
  });
});