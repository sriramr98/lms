const express = require('express');
const { courseController } = require('../../controllers');
const { courseValidation } = require('../../validations');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');

const router = express.Router();

router.post('/create', auth('createCourse'), validate(courseValidation.createCourse), courseController.createCourse);

router.patch('/:courseId', auth('manageCourse'), validate(courseValidation.updateCourse), courseController.updateCourse);

module.exports = router;

/**
 * @swagger
 * tags:
 *  name: Course
 *  description: Course Management
 */

/**
 * @swagger
 * path:
 *  /course/create:
 *    post:
 *      summary: Create a new course (draft)
 *      description: Only admins can create a course. This course is not released, but a basic framework is created and put in draft.
 *      tags: [Course]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - title
 *                - description
 *              properties:
 *                title:
 *                  type: string
 *                  description: Title of the course
 *                description:
 *                  type: string
 *                  description: Description of the course
 *              example:
 *                title: Gatsby Master Course
 *                description: The gatsby master course to teach you A-Z about GatsbyJS
 *      responses:
 *        "201":
 *          description: Created
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/Course'
 *        "401":
 *          $ref: '#/components/responses/Unauthorized'
 *        "403":
 *          $ref: '#/components/responses/Forbidden'
 */
