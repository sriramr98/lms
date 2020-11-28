const request = require('supertest');
const faker = require('faker');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const _ = require('lodash');

const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { Course } = require('../../src/models');
const { insertUsers } = require('../fixtures/user.fixture');
const { admin, userOne } = require('../fixtures/user.fixture');
const { adminAccessToken, userOneAccessToken } = require('../fixtures/token.fixture');
const { course: courseData, insertCourse, findCourse, releaseCourse } = require('../fixtures/course.fixture');
const { COURSE_STATUS_TYPES, COURSE_CONTENT_TYPES } = require('../../src/config/constants');

setupTestDB();

describe('Course routes', () => {
  describe('POST /v1/course/create', () => {
    let course;
    const route = '/v1/course/create';

    beforeEach(() => {
      course = _.cloneDeep(courseData);
      delete course._id;
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

  describe('PATCH /v1/course/:courseId', () => {
    let route = '/v1/course/:courseId';
    let course;
    beforeEach(async () => {
      course = _.cloneDeep(courseData);
      route = route.replace(':courseId', course._id);
      await insertCourse([course]);
      await insertUsers([admin]);
    });

    it('should return 200 and successfully update a course if data is ok', async () => {
      const updateData = {
        title: 'Course Name 2',
        description: faker.lorem.sentence(55),
      };
      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(updateData.title);
      expect(updatedCourse.description).toEqual(updateData.description);

      const response = res.body;
      expect(response).toBeTruthy();
      expect(response.title).toEqual(updateData.title);
      expect(response.description).toEqual(updateData.description);
    });

    it('should return 200 and successfully update a course if valid level is sent', async () => {
      const updateData = {
        level: 'EXPERIENCED',
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.level).toEqual(updateData.level);
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      const response = res.body;
      expect(response).toBeTruthy();
      expect(response.level).toEqual(updateData.level);
      expect(response.title).toEqual(course.title);
      expect(response.description).toEqual(course.description);
    });

    it('should return 200 and add a section to the course if it is a new section', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
          },
        ],
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      expect(updatedCourse.sections[0].title).toEqual(updateData.sections[0].title);
      expect(updatedCourse.sections[0].description).toEqual(updateData.sections[0].description);
      expect(updatedCourse.sections[0].content).toEqual([]);

      const response = res.body;
      expect(response.sections[0].title).toEqual(updateData.sections[0].title);
      expect(response.sections[0].description).toEqual(updateData.sections[0].description);
      expect(response.sections[0].content).toEqual([]);
    });

    it('should return 200 and create a valid video content in a section', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
                title: 'Lecture 1',
                description: 'Lecture 1 description',
                video: {
                  video: 'videoS3Key',
                  isDownloadable: true,
                },
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      expect(updatedCourse.sections[0].title).toEqual(updateData.sections[0].title);
      expect(updatedCourse.sections[0].description).toEqual(updateData.sections[0].description);
      expect(updatedCourse.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(updatedCourse.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(updatedCourse.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(updatedCourse.sections[0].content[0].video).toBeTruthy();
      expect(updatedCourse.sections[0].content[0].video.video).toEqual(updateData.sections[0].content[0].video.video);
      expect(updatedCourse.sections[0].content[0].video.isDownloadable).toEqual(
        updateData.sections[0].content[0].video.isDownloadable
      );

      const response = res.body;
      expect(response.sections[0].title).toEqual(updateData.sections[0].title);
      expect(response.sections[0].description).toEqual(updateData.sections[0].description);
      expect(response.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(response.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(response.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(response.sections[0].content[0].video).toBeTruthy();
      expect(response.sections[0].content[0].video.video).toEqual(updateData.sections[0].content[0].video.video);
      expect(response.sections[0].content[0].video.isDownloadable).toEqual(
        updateData.sections[0].content[0].video.isDownloadable
      );
    });

    it('should return 200 and create a valid quiz content in a section', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.QUIZ,
                title: 'Lecture 1',
                description: 'Lecture 1 description',
                quiz: {
                  question: 'Whats the quiz question?',
                  options: [
                    {
                      option: 'Option 1',
                      isAnswer: true,
                    },
                    {
                      option: 'Option 2',
                      isAnswer: false,
                      reasonWhyIncorrect: 'Option 2 incorrect',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);
      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      expect(updatedCourse.sections[0].title).toEqual(updateData.sections[0].title);
      expect(updatedCourse.sections[0].description).toEqual(updateData.sections[0].description);
      expect(updatedCourse.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(updatedCourse.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(updatedCourse.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(updatedCourse.sections[0].content[0].quiz).toBeTruthy();
      expect(updatedCourse.sections[0].content[0].quiz.question).toEqual(updateData.sections[0].content[0].quiz.question);
      expect(updatedCourse.sections[0].content[0].quiz.options[0].option).toEqual(
        updateData.sections[0].content[0].quiz.options[0].option
      );
      expect(updatedCourse.sections[0].content[0].quiz.options[0].isAnswer).toEqual(
        updateData.sections[0].content[0].quiz.options[0].isAnswer
      );
      expect(updatedCourse.sections[0].content[0].quiz.options[1].option).toEqual(
        updateData.sections[0].content[0].quiz.options[1].option
      );
      expect(updatedCourse.sections[0].content[0].quiz.options[1].isAnswer).toEqual(
        updateData.sections[0].content[0].quiz.options[1].isAnswer
      );
      expect(updatedCourse.sections[0].content[0].quiz.options[1].reasonWhyIncorrect).toEqual(
        updateData.sections[0].content[0].quiz.options[1].reasonWhyIncorrect
      );

      const response = res.body;
      expect(response.sections[0].title).toEqual(updateData.sections[0].title);
      expect(response.sections[0].description).toEqual(updateData.sections[0].description);
      expect(response.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(response.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(response.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(response.sections[0].content[0].quiz.options[0].option).toEqual(
        updateData.sections[0].content[0].quiz.options[0].option
      );
      expect(response.sections[0].content[0].quiz.options[0].isAnswer).toEqual(
        updateData.sections[0].content[0].quiz.options[0].isAnswer
      );
      expect(response.sections[0].content[0].quiz.options[1].option).toEqual(
        updateData.sections[0].content[0].quiz.options[1].option
      );
      expect(response.sections[0].content[0].quiz.options[1].isAnswer).toEqual(
        updateData.sections[0].content[0].quiz.options[1].isAnswer
      );
      expect(response.sections[0].content[0].quiz.options[1].reasonWhyIncorrect).toEqual(
        updateData.sections[0].content[0].quiz.options[1].reasonWhyIncorrect
      );
    });

    it('should return 200 and create a valid article content in a section', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
                title: 'Lecture 1',
                description: 'Lecture 1 description',
                article: {
                  articleContent: 'This is an article content in  a section',
                },
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      expect(updatedCourse.sections[0].title).toEqual(updateData.sections[0].title);
      expect(updatedCourse.sections[0].description).toEqual(updateData.sections[0].description);
      expect(updatedCourse.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(updatedCourse.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(updatedCourse.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(updatedCourse.sections[0].content[0].article).toBeTruthy();
      expect(updatedCourse.sections[0].content[0].article.articleContent).toEqual(
        updateData.sections[0].content[0].article.articleContent
      );

      const response = res.body;
      expect(response.sections[0].title).toEqual(updateData.sections[0].title);
      expect(response.sections[0].description).toEqual(updateData.sections[0].description);
      expect(response.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(response.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(response.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(response.sections[0].content[0].article).toBeTruthy();
      expect(response.sections[0].content[0].article.articleContent).toEqual(
        updateData.sections[0].content[0].article.articleContent
      );
    });

    it('should return 200 and create valid assignment content in a section', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.ASSIGNMENT,
                title: 'Lecture 1',
                description: 'Lecture 1 description',
                assignment: {
                  estimatedDuration: 30,
                  instructionVideo: 'https://s3.amazon.com/video.mp4',
                  instructions: 'This is an instruction to the assignment',
                  solutionVideo: 'https://s3.amazon.com/video.mp4',
                  questions: ['Question 1', 'Question 2', 'Question 3'],
                  solutions: ['Answers 1', 'Answers 2', 'Answers 3'],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app)
        .patch(route)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      const updatedCourse = await findCourse(course._id);

      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.title).toEqual(course.title);
      expect(updatedCourse.description).toEqual(course.description);

      expect(updatedCourse.sections[0].title).toEqual(updateData.sections[0].title);
      expect(updatedCourse.sections[0].description).toEqual(updateData.sections[0].description);
      expect(updatedCourse.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(updatedCourse.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(updatedCourse.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(updatedCourse.sections[0].content[0].assignment).toBeTruthy();
      expect(updatedCourse.sections[0].content[0].assignment.estimatedDuration).toEqual(
        updateData.sections[0].content[0].assignment.estimatedDuration
      );
      expect(updatedCourse.sections[0].content[0].assignment.instructionVideo).toEqual(
        updateData.sections[0].content[0].assignment.instructionVideo
      );
      expect(updatedCourse.sections[0].content[0].assignment.instructions).toEqual(
        updateData.sections[0].content[0].assignment.instructions
      );
      expect(updatedCourse.sections[0].content[0].assignment.solutionVideo).toEqual(
        updateData.sections[0].content[0].assignment.solutionVideo
      );
      expect(updatedCourse.sections[0].content[0].assignment.questions).toEqual(
        updateData.sections[0].content[0].assignment.questions
      );
      expect(updatedCourse.sections[0].content[0].assignment.solutions).toEqual(
        updateData.sections[0].content[0].assignment.solutions
      );

      const response = res.body;
      expect(response.sections[0].title).toEqual(updateData.sections[0].title);
      expect(response.sections[0].description).toEqual(updateData.sections[0].description);
      expect(response.sections[0].content[0].type).toEqual(updateData.sections[0].content[0].type);
      expect(response.sections[0].content[0].title).toEqual(updateData.sections[0].content[0].title);
      expect(response.sections[0].content[0].description).toEqual(updateData.sections[0].content[0].description);
      expect(response.sections[0].content[0].assignment).toBeTruthy();
      expect(response.sections[0].content[0].assignment.estimatedDuration).toEqual(
        updateData.sections[0].content[0].assignment.estimatedDuration
      );
      expect(response.sections[0].content[0].assignment.instructionVideo).toEqual(
        updateData.sections[0].content[0].assignment.instructionVideo
      );
      expect(response.sections[0].content[0].assignment.instructions).toEqual(
        updateData.sections[0].content[0].assignment.instructions
      );
      expect(response.sections[0].content[0].assignment.solutionVideo).toEqual(
        updateData.sections[0].content[0].assignment.solutionVideo
      );
      expect(response.sections[0].content[0].assignment.questions).toEqual(
        updateData.sections[0].content[0].assignment.questions
      );
      expect(response.sections[0].content[0].assignment.solutions).toEqual(
        updateData.sections[0].content[0].assignment.solutions
      );
    });

    it('should return 400 and throw error if anything other than video is sent for a video content', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
                title: 'Lecture 1',
                description: 'Lecture Description',
                assignment: {
                  estimatedDuration: 30,
                },
              },
            ],
          },
        ],
      };

      await request(app).patch(route).set('Authorization', `Bearer ${adminAccessToken}`).send(updateData).expect(400);
    });

    it('should return 400 and throw error if anything other than quiz is sent for a quiz content', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.QUIZ,
                title: 'Lecture 1',
                description: 'Lecture Description',
                assignment: {
                  estimatedDuration: 30,
                },
              },
            ],
          },
        ],
      };

      await request(app).patch(route).set('Authorization', `Bearer ${adminAccessToken}`).send(updateData).expect(400);
    });

    it('should return 400 and throw error if anything other than assignment is sent for a assignment content', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.ASSIGNMENT,
                title: 'Lecture 1',
                description: 'Lecture Description',
                video: {
                  video: 'https://s3.amazon.com/video.mp4',
                },
              },
            ],
          },
        ],
      };

      await request(app).patch(route).set('Authorization', `Bearer ${adminAccessToken}`).send(updateData).expect(400);
    });

    it('should return 400 and throw error if anything other than article is sent for a article content', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
                title: 'Lecture 1',
                description: 'Lecture Description',
                assignment: {
                  estimatedDuration: 30,
                },
              },
            ],
          },
        ],
      };

      await request(app).patch(route).set('Authorization', `Bearer ${adminAccessToken}`).send(updateData).expect(400);
    });

    it('should return 401 and throw unauthorized error if anyone other than admin tries to update', async () => {
      const updateData = {
        sections: [
          {
            title: 'Section 1',
            description: 'Section 1 Description',
            content: [
              {
                type: COURSE_CONTENT_TYPES.ASSIGNMENT,
                title: 'Lecture 1',
                description: 'Lecture 1 description',
                assignment: {
                  estimatedDuration: 30,
                  instructionVideo: 'https://s3.amazon.com/video.mp4',
                  instructions: 'This is an instruction to the assignment',
                  solutionVideo: 'https://s3.amazon.com/video.mp4',
                  questions: ['Question 1', 'Question 2', 'Question 3'],
                  solutions: ['Answers 1', 'Answers 2', 'Answers 3'],
                },
              },
            ],
          },
        ],
      };

      await request(app).patch(route).set('Authorization', `Bearer ${userOneAccessToken}`).send(updateData).expect(401);
    });
  });

  describe('PATCH /v1/course/:courseId/release', () => {
    let route = '/v1/course/:courseId/release';
    let course;
    beforeEach(async () => {
      course = _.cloneDeep(releaseCourse);
      route = route.replace(':courseId', course._id);
      await insertCourse(releaseCourse);
      await insertUsers([admin]);
    });

    it('should return 200 and successfully release a course if data is ok', async () => {
      await request(app).patch(route).set('Authorization', `Bearer ${adminAccessToken}`).expect(200);

      const updatedCourse = await findCourse(course._id);
      expect(updatedCourse).toBeTruthy();
      expect(updatedCourse.status).toEqual(COURSE_STATUS_TYPES.RELEASED);
      expect(updatedCourse.releaseDate).toBeTruthy();
    });

    it('should return 400 and throw error if course is already released', async () => {
      const releasedCoursedData = _.cloneDeep(releaseCourse);
      const releasedCourseId = mongoose.Types.ObjectId();
      releasedCoursedData._id = releasedCourseId;
      releasedCoursedData.status = COURSE_STATUS_TYPES.RELEASED;
      await insertCourse(releasedCoursedData);

      await request(app)
        .patch(route.replace(course._id, releasedCourseId))
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it('should return 400 and throw error if course is archived', async () => {
      const releasedCoursedData = _.cloneDeep(releaseCourse);
      const releasedCourseId = mongoose.Types.ObjectId();
      releasedCoursedData._id = releasedCourseId;
      releasedCoursedData.status = COURSE_STATUS_TYPES.ARCHIVED;
      await insertCourse(releasedCoursedData);

      await request(app)
        .patch(route.replace(course._id, releasedCourseId))
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(400);
    });

    it('should throw a 404 error if trying to release a non exinsting course', async () => {
      const courseId = mongoose.Types.ObjectId();
      await request(app)
        .patch(route.replace(course._id, courseId))
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });
});
