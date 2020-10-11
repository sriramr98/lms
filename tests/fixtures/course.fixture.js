const mongoose = require('mongoose');
const faker = require('faker');
const Course = require('../../src/models/course.model');

const course = {
  _id: mongoose.Types.ObjectId(),
  title: 'Coding Course',
  description: faker.lorem.sentence(52),
};

const insertCourse = async (courses) => {
  return Course.insertMany(courses);
};

const findCourse = async (id) => Course.findById(id).lean();

module.exports = {
  course,
  insertCourse,
  findCourse,
};
