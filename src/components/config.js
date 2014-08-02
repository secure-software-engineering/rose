/** @module config */

/** Configuration */
var _config = {
  /*************************************
   * Security                          *
   *************************************/
  
  /**
   * Salt used for hashing.
   */
  salt: "ROSE",
  
  /*************************************
   * Updates                           *
   *************************************/
  
  /**
   * URL of central repository.
   */
  repository: "http://-/-/repository.json",
  
  /**
   * Certificate.
   */
  certificate: null,
  
  /**
   * Interval in which ROSE synchronizes with the repository.
   *
   * Default value: 2 hours
   */
  update_interval: 2 * 60 * 1000
};

module.exports = function config(item) {
  return _config[item];
};
