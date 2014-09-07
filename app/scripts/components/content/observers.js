/** @module observers */

/**
 * Please note: This file contains hardcoded observers that are not affected by
 * the udpate mechanism.
 */

var like = {
  name: "like",
  network: "facebook",
  type: "click",
  priority: 1,
  patterns: [
    {
      node: ".UFILikeLink",
      container: ".timelineUnitContainer",
      pattern: '<div class="timelineUnitContainer"><div><div role="article"><div class="userContentWrapper"><div><span class="userContent">{id}</span></div></div></div></div></div>',
      process: "function process(info, $node) { info.id = hash(info.id); return info; }"
    }
  ]
};

module.exports = [like];
