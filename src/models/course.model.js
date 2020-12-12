const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const { COURSE_STATUS_TYPES, COURSE_CONTENT_TYPES, STUDENT_LEVELS, COURSE_CATEGORY } = require('../config/constants');

const quizOptionSchema = mongoose.Schema({
  option: {
    type: String,
    required: true,
  },
  reasonWhyIncorrect: {
    type: String,
  },
  isAnswer: {
    type: Boolean,
    default: false,
  },
});

const quizSchema = mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: quizOptionSchema,
      required: true,
    },
  ],
});

const videoLectureSchema = mongoose.Schema({
  video: {
    type: String,
    required: true,
  },
  isDownloadable: {
    type: Boolean,
    default: false,
  },
});

const assignmentSchema = mongoose.Schema({
  estimatedDuration: {
    type: Number,
  },
  instructionVideo: String,
  instructions: String,
  questions: [String],
  solutionVideo: String,
  solutions: [String],
});

const articleSchema = mongoose.Schema({
  articleContent: {
    type: String,
    required: true,
  },
});

const courseContentSchema = mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: Object.values(COURSE_CONTENT_TYPES),
    default: COURSE_CONTENT_TYPES.LECTURE_VIDEO,
  },
  title: String,
  description: String,
  resources: [String],
  quiz: quizSchema,
  video: videoLectureSchema,
  assignment: assignmentSchema,
  article: articleSchema,
});

const sectionSchema = mongoose.Schema({
  title: String,
  description: String,
  content: [courseContentSchema],
});

const courseSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(COURSE_STATUS_TYPES),
    default: COURSE_STATUS_TYPES.DRAFT,
  },
  price: {
    type: String,
  },
  sections: [sectionSchema],
  level: {
    type: String,
    enum: Object.values(STUDENT_LEVELS),
    default: STUDENT_LEVELS.ALL,
  },
  category: {
    type: String,
    enum: Object.values(COURSE_CATEGORY),
  },
  titleImage: {
    type: String,
  },
  promotionalVideo: {
    type: String,
  },
  releaseDate: {
    type: Date,
  },
});

courseSchema.plugin(toJSON);
sectionSchema.plugin(toJSON);
courseContentSchema.plugin(toJSON);
assignmentSchema.plugin(toJSON);
videoLectureSchema.plugin(toJSON);
quizSchema.plugin(toJSON);
quizOptionSchema.plugin(toJSON);
articleSchema.plugin(toJSON);

const Token = mongoose.model('Course', courseSchema);
module.exports = Token;
