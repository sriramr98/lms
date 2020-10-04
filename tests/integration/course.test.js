const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');

const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Course } = require('../../src/models');
const { insertUsers } = require('../fixtures/user.fixture');
const { admin, userOne } = require('../fixtures/user.fixture');
const { adminAccessToken, userOneAccessToken } = require('../fixtures/token.fixture');
const { COURSE_STATUS_TYPES } = require('../../src/config/constants');

setupTestDB();

describe('Course routes', () => {
  describe('POST /v1/course/create', () => {
    let course;
    const route = '/v1/course/create';

    beforeEach(() => {
      course = {
        title: 'Coding Course',
        description: faker.lorem.sentence(52),
      };
    });

    test('should return 201 and successfully create a new course if data is ok', async () => {
      await insertUsers([admin]);

      const res = await request(app)
        .post(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(course)
        .expect(httpStatus.CREATED);

      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('id');
      const courseId = res.body.id;

      const insertedCourse = await Course.findById(courseId).lean();
      expect(insertedCourse).toBeDefined();

      expect(insertedCourse.title).toBe(course.title);
      expect(insertedCourse.description).toBe(course.description);
      expect(insertedCourse.status).toBe(COURSE_STATUS_TYPES.DRAFT);
      expect(insertedCourse.sections).toEqual([]);
    });

    test('should throw 400 if status is sent with course data', async () => {
      await insertUsers([admin]);
      course.status = COURSE_STATUS_TYPES.RELEASED;

      await request(app)
        .post(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(course)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should throw 400 if title is not sent for course', async () => {
      await insertUsers([admin]);
      delete course.title;

      await request(app)
        .post(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(course)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should throw 400 if description is not sent for course', async () => {
      await insertUsers([admin]);
      delete course.description;

      await request(app)
        .post(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(course)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should throw 401 if user tries to create a course', async () => {
      await insertUsers([userOne]);

      await request(app)
        .post(route)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(course)
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
