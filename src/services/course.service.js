const { Course } = require('../models');

/**
 * Create a new course.
 * @param {Object} course
 * @returns {Promise<Course>}
 */
const createCourse = async (course) => {
  return new Course(course).save();
};

/**
 *
 * @param {ObjectId} id Course ID
 * @param {Object} courseUpdate Course details to be updated
 * @returns {Promise<Course>}
 */
const updateCourse = async (id, courseUpdate) => {
  return Course.findByIdAndUpdate(id, courseUpdate, { new: true, runValidators: true });
};

/**
 * @param {ObjectId} id Course ID
 * @returns {Promise<Course>}
 */
const getCourse = (courseId) => {
  return Course.findById(courseId);
};

module.exports = {
  createCourse,
  updateCourse,
  getCourse,
};
