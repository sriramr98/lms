const mongoose = require('mongoose');
const faker = require('faker');
const Course = require('../../src/models/course.model');
const { COURSE_STATUS_TYPES, COURSE_CATEGORY, COURSE_CONTENT_TYPES, STUDENT_LEVELS } = require('../../src/config/constants');

const course = {
  _id: mongoose.Types.ObjectId(),
  title: 'Coding Course',
  description: faker.lorem.sentence(52),
};

const releaseCourse = {
  _id: mongoose.Types.ObjectId(),
  title: 'Coding Course',
  description: faker.lorem.sentence(52),
  status: COURSE_STATUS_TYPES.DRAFT,
  price: '20 USD',
  level: STUDENT_LEVELS.ALL,
  category: COURSE_CATEGORY.CLOUD,
  titleImage: faker.image.imageUrl(),
  promotionalVideo: faker.internet.url(),
  sections: [
    {
      title: 'Section 1',
      description: faker.lorem.sentence(55),
      content: [
        {
          type: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
          title: faker.lorem.sentence(20),
          description: faker.lorem.sentence(50),
          resources: [faker.image.imageUrl()],
          article: {
            articleContent: faker.lorem.paragraphs(2),
          },
        },
      ],
    },
  ],
};

const insertCourse = async (courses) => {
  return Course.insertMany(courses);
};

const findCourse = async (id) => Course.findById(id).lean();

module.exports = {
  course,
  insertCourse,
  findCourse,
  releaseCourse,
};
