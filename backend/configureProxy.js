'use strict';

module.exports = function configureProxy(app, env = process.env) {
  // Render terminates public HTTP traffic at its reverse proxy.
  // Trust only the nearest hop; never trust arbitrary client-supplied chains.
  app.set('trust proxy', env.RENDER === 'true' ? 1 : false);
};
