const { Course } = require('../models');

/**
 * Create a new course.
 * @param {Object} course
 * @returns {Promise<Course>}
 */
const createCourse = async (course) => {
  return new Course(course).save();
};

module.exports = {
  createCourse,
};
