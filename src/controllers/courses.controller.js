const httpStatus = require('http-status');
const { courseService } = require('../services');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

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

module.exports = {
  createCourse,
  updateCourse,
};
