const httpStatus = require('http-status');
const { courseService } = require('../services');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { courseValidation } = require('../validations/course.validation');
const validateObject = require('../utils/validateObject');
const { COURSE_STATUS_TYPES } = require('../config/constants');

const createCourse = catchAsync(async (req, res) => {
  const course = req.body;
  const createdCourse = await courseService.createCourse(course);
  return res.status(201).json(createdCourse);
});

const updateCourse = catchAsync(async (req, res) => {
  const courseUpdateDetails = req.body;
  const { courseId } = req.params;

  if (!courseUpdateDetails || !Object.keys(courseUpdateDetails).length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No details to update');
  }

  const updatedCourse = await courseService.updateCourse(courseId, courseUpdateDetails);
  return res.status(httpStatus.OK).json(updatedCourse);
});

const releaseCourse = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  const course = await courseService.getCourse(courseId);

  if (!course) throw new ApiError(httpStatus.NOT_FOUND, 'Unable to find course');

  if (course.status === COURSE_STATUS_TYPES.RELEASED)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Course is already released');

  if (course.status === COURSE_STATUS_TYPES.ARCHIVED) throw new ApiError(httpStatus.BAD_REQUEST, 'Course is archived');

  const releaseDetails = {
    status: COURSE_STATUS_TYPES.RELEASED,
    releaseDate: new Date(),
  };

  const { error } = validateObject(courseValidation(true), course.toJSON());

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(',');
    throw new ApiError(httpStatus.BAD_REQUEST, errorMessage);
  }

  const releasedCourse = await courseService.updateCourse(courseId, releaseDetails);
  return res.status(httpStatus.OK).json(releasedCourse);
});

module.exports = {
  createCourse,
  updateCourse,
  releaseCourse,
};
