const { courseService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createCourse = catchAsync(async (req, res) => {
  const course = req.body;
  const createdCourse = await courseService.createCourse(course);
  return res.status(201).json(createdCourse);
});

module.exports = {
  createCourse,
};
