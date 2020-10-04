const Joi = require('@hapi/joi');

const createCourse = {
  body: Joi.object().keys({
    title: Joi.string().required().min(10),
    description: Joi.string().required().min(50),
    status: Joi.forbidden(),
  }),
};

module.exports = {
  createCourse,
};
