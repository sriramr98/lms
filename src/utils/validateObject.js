const Joi = require('@hapi/joi');

const validateObject = (schema, object) => {
  return Joi.compile(schema)
    .prefs({ errors: { label: 'key' } })
    .validate(object);
};

module.exports = validateObject;
