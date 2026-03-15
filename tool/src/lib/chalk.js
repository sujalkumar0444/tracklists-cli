let chalkPromise;

async function getChalk() {
  if (!chalkPromise) {
    chalkPromise = import('chalk').then((mod) => mod.default);
  }

  return chalkPromise;
}

module.exports = {
  getChalk
};