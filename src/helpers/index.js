/**
 *
 * @param {number} status
 * @return {string}
 */
export const getResponseGroup = function getResponseGroup(status) {
  if (status < 200) return 'information';
  if (status < 300) return 'successful';
  if (status < 400) return 'redirection';
  if (status < 500) return 'clientError';
  return 'serverError';
};

/**
 *
 * @param {number} ms
 * @return {Promise}
 */
export const sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
