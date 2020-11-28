const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');
const { STUDENT_LEVELS, COURSE_CATEGORY, COURSE_CONTENT_TYPES, COURSE_STATUS_TYPES } = require('../config/constants');

const createCourse = {
  body: Joi.object().keys({
    title: Joi.string().required().min(10),
    description: Joi.string().required().min(50),
    status: Joi.forbidden(),
  }),
};

const getCourseQuizOptions = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    option: Joi.string().required(),
    isAnswer: isRelease ? Joi.boolean().valid(true, false).required() : Joi.boolean().valid(true, false),
    reasonWhyIncorrect: Joi.string().when('isAnswer', {
      is: Joi.boolean().valid(false),
      then: Joi.string().required(),
    }),
  });
};

const getCourseQuizSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    question: Joi.string().required(),
    options: Joi.array().items(getCourseQuizOptions(isRelease)).required().min(1),
  });
};

const getCourseVideoLectureSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    video: Joi.string().required(),
    isDownloadable: isRelease ? Joi.boolean().valid(true, false).required() : Joi.boolean().valid(true, false),
  });
};

const getCourseAssignmentSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    estimatedDuration: isRelease ? Joi.number().min(1).required() : Joi.number().min(1),
    instructionVideo: isRelease ? Joi.string().required() : Joi.string(),
    instructions: isRelease ? Joi.string().required() : Joi.string(),
    questions: isRelease ? Joi.array().items(Joi.string()).min(1).required() : Joi.array().items(Joi.string()).min(1),
    solutionVideo: isRelease ? Joi.string().required() : Joi.string(),
    solutions: isRelease ? Joi.array().items(Joi.string()).min(1).required() : Joi.array().items(Joi.string()).min(1),
  });
};

const getCourseArticleSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    articleContent: Joi.string().required(),
  });
};

const getCourseSectionContentSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    type: Joi.string().valid(...Object.values(COURSE_CONTENT_TYPES)),
    title: Joi.string().required(),
    description: Joi.string().required(),
    resources: Joi.array().items(Joi.string()),
    quiz: getCourseQuizSchema(isRelease).when('type', {
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
        {
          is: COURSE_CONTENT_TYPES.QUIZ,
          then: isRelease ? Joi.required() : Joi.optional(),
        },
      ],
    }),
    video: getCourseVideoLectureSchema(isRelease).when('type', {
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
        {
          is: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
          then: isRelease ? Joi.required() : Joi.optional(),
        },
      ],
    }),
    assignment: getCourseAssignmentSchema(isRelease).when('type', {
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
        {
          is: COURSE_CONTENT_TYPES.ASSIGNMENT,
          then: isRelease ? Joi.required() : Joi.optional(),
        },
      ],
    }),
    article: getCourseArticleSchema(isRelease).when('type', {
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
        {
          is: COURSE_CONTENT_TYPES.LECTURE_ARTICLE,
          then: isRelease ? Joi.required() : Joi.optional(),
        },
      ],
    }),
  });
};

const getCourseSectionSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    title: Joi.string().required(),
    description: Joi.string().required(),
    content: Joi.array().items(getCourseSectionContentSchema(isRelease)),
  });
};

const getCourseSchema = (isRelease = false) => {
  return Joi.object().keys({
    id: isRelease ? Joi.custom(objectId).required() : Joi.forbidden(),
    title: isRelease ? Joi.string().min(10).required() : Joi.string().min(10),
    description: isRelease ? Joi.string().min(50).required() : Joi.string().min(50),
    status: isRelease ? Joi.valid(COURSE_STATUS_TYPES.DRAFT) : Joi.forbidden(),
    price: isRelease ? Joi.string().required() : Joi.string(),
    level: isRelease
      ? Joi.string()
          .valid(...Object.values(STUDENT_LEVELS))
          .required()
      : Joi.string().valid(...Object.values(STUDENT_LEVELS)),
    category: isRelease
      ? Joi.string()
          .valid(...Object.values(COURSE_CATEGORY))
          .required()
      : Joi.string().valid(...Object.values(COURSE_CATEGORY)),
    titleImage: isRelease ? Joi.string().required() : Joi.string(),
    promotionalVideo: isRelease ? Joi.string().required() : Joi.string(),
    sections: Joi.array().items(getCourseSectionSchema(isRelease)),
  });
};

const updateCourse = {
  body: getCourseSchema(false),
  params: {
    courseId: Joi.custom(objectId).required(),
  },
};

const releaseCourse = {
  params: {
    courseId: Joi.custom(objectId).required(),
  },
};

module.exports = {
  createCourse,
  updateCourse,
  releaseCourse,
  courseValidation: getCourseSchema,
};
