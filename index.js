const Logger = require('vishal-smart-logger');

module.exports = (config) => (req, res, next) => {
  const logger = new Logger(req);
  const { loggs400Request,sendStatusCodeinRespose } = config || {};
  const { 'x-coreplatform-correlationid': correlationId } = req.headers;

  const responseStructure = (type, details = [], statusCode) => {
    const isValid = details.some((obj) => {
      if (obj.name && obj.message) {
        return true;
      }

      return false;
    });

    if (isValid) {
      if(loggs400Request){
        logger.log({
          level: 'info',
          meta: { details },
        });
      }

      if(sendStatusCodeinRespose){
        return {
          statusCode,
          type,
          details,
        };
      }

      return {
        type,
        details,
      };
    }

    logger.log({
      level: 'error',
      meta: {
        message: 'unexpected-internal-server-error',
        details: '4.x.x response body structure should follow the standards defined by vishal core team',
      },
    });

    if(sendStatusCodeinRespose){
      res.status(500).json({
        statusCode: 500,
        type: 'unexpected-internal-server-error',
        correlationId,
        details: [
          {
            name: 'unexpected-server-error',
            message: 'Please contact administrator and present correlation identifier for troubleshooting',
          },
        ],
      });

      return next();
    }
    res.status(500).json({
      type: 'unexpected-internal-server-error',
      correlationId,
      details: [
        {
          name: 'unexpected-server-error',
          message: 'Please contact administrator and present correlation identifier for troubleshooting',
        },
      ],
    });

    return next();
  };

  const successResponseStructure = (json,statusCode) => {
    if(json){
      const { data, doc, message } = json;

      if(sendStatusCodeinRespose){
        return {
          data: data||doc,
          message,
        };
      }

      return {
        statusCode,
        data: data||doc,
        message,
      };
    }

    return { statusCode }
  };

  const unAuthorized = () => res.status(401).json();

  const forbidden = () => res.status(403).json();

  const notFound = () => res.status(404).json();

  const concurrencyError = () => res.status(412).json();

  const badRequest = (type, details) => res.status(400).json(responseStructure(type, details, 400));

  const serverError = (error = '', message = null) => {
    const defaultMessage = [
      {
        name: 'unexpected-server-error',
        message: 'Please contact administrator and present correlation identifier for troubleshooting',
      },
    ];

    logger.log({
      level: 'error',
      meta: {
        message: 'unexpected-internal-server-error',
        details: error ? error.toString() : null,
      },
    });

    const userMessage = message ? message : defaultMessage;

    if(sendStatusCodeinRespose){
      return res.status(500).json({
        statusCode: 500,
        correlationId,
        type: 'unexpected-internal-server-error',
        details: userMessage,
      });
    }

    return res.status(500).json({
      correlationId,
      type: 'unexpected-internal-server-error',
      details: userMessage,
    });
  };

  const postSuccessfully = (json) => res.status(201).json(successResponseStructure(json,201));
  const getSuccessfully = (json) => res.status(200).json(successResponseStructure(json,200));
  const getRequest = (json) => res.status(200).json(json);
  const postRequest = () => res.status(201).json();
  const updated = () => res.status(204).json();
  const deleted = () => res.status(204).json();

  const response = {
    unAuthorized,
    forbidden,
    notFound,
    concurrencyError,
    badRequest,
    serverError,
    postSuccessfully,
    getSuccessfully,
    getRequest,
    postRequest,
    updated,
    deleted,
  };

  Object.assign(res, response);

  return next();
};
