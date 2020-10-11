const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');
const { STUDENT_LEVELS, COURSE_CATEGORY, COURSE_CONTENT_TYPES } = require('../config/constants');

const createCourse = {
  body: Joi.object().keys({
    title: Joi.string().required().min(10),
    description: Joi.string().required().min(50),
    status: Joi.forbidden(),
  }),
};

const courseQuizOptions = Joi.object().keys({
  option: Joi.string().required(),
  isAnswer: Joi.boolean().valid(true, false),
  reasonWhyIncorrect: Joi.string().when('isAnswer', {
    is: Joi.boolean().valid(false),
    then: Joi.string().required(),
  }),
});

const courseQuiz = Joi.object().keys({
  question: Joi.string().required(),
  options: Joi.array().items(courseQuizOptions).required().min(1),
});

const courseVideoLecture = Joi.object().keys({
  video: Joi.string().required(),
  isDownloadable: Joi.boolean().valid(true, false),
});

const courseAssignment = Joi.object().keys({
  estimatedDuration: Joi.number().min(1),
  instructionVideo: Joi.string(),
  instructions: Joi.string(),
  questions: Joi.array().items(Joi.string()).min(1),
  solutionVideo: Joi.string(),
  solutions: Joi.array().items(Joi.string()).min(1),
});

const courseArticle = Joi.object().keys({
  articleContent: Joi.string().required(),
});

const courseSectionContent = Joi.object().keys({
  type: Joi.string().valid(...Object.values(COURSE_CONTENT_TYPES)),
  title: Joi.string().required(),
  description: Joi.string().required(),
  resources: Joi.array().items(Joi.string()),
  quiz: courseQuiz.when('type', {
    switch: [
      {
        is: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.ASSIGNMENT,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
        then: Joi.forbidden(),
      },
    ],
  }),
  video: courseVideoLecture.when('type', {
    switch: [
      {
        is: COURSE_CONTENT_TYPES.QUIZ,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.ASSIGNMENT,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
        then: Joi.forbidden(),
      },
    ],
  }),
  assignment: courseAssignment.when('type', {
    switch: [
      {
        is: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.QUIZ,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
        then: Joi.forbidden(),
      },
    ],
  }),
  article: courseArticle.when('type', {
    switch: [
      {
        is: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.ASSIGNMENT,
        then: Joi.forbidden(),
      },
      {
        is: COURSE_CONTENT_TYPES.QUIZ,
        then: Joi.forbidden(),
      },
    ],
  }),
});

const courseSection = Joi.object().keys({
  title: Joi.string().required(),
  description: Joi.string().required(),
  content: Joi.array().items(courseSectionContent),
});

const updateCourse = {
  body: Joi.object().keys({
    title: Joi.string().min(10),
    description: Joi.string().min(50),
    status: Joi.forbidden(),
    price: Joi.string(),
    level: Joi.string().valid(...Object.values(STUDENT_LEVELS)),
    category: Joi.string().valid(...Object.values(COURSE_CATEGORY)),
    titleImage: Joi.string(),
    promotionalVideo: Joi.string(),
    sections: Joi.array().items(courseSection),
  }),
  params: {
    courseId: Joi.custom(objectId).required(),
  },
};

module.exports = {
  createCourse,
  updateCourse,
};
